import hashlib
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.api_cache import APICache
from app.models.ai_cache import AIExplanationCache


# ==================================================
# HELPER — Generate a cache key
# ==================================================
def make_cache_key(*parts: str) -> str:
    """
    Generates a unique cache key from any number of string parts.
    Example: make_cache_key("compound", "profile", "CHEMBL941")
             → "a3f8c2d1..." (SHA256 hash)
    """
    combined = "_".join(parts).lower()
    return hashlib.sha256(combined.encode()).hexdigest()


# ==================================================
# HELPER — Check if a cached item is still valid
# ==================================================
def is_expired(expires_at: datetime) -> bool:
    """
    Returns True if the cache entry has expired.
    Compares expiry time against current UTC time.
    """
    now = datetime.now(timezone.utc)

    # Handle both timezone-aware and timezone-naive datetimes
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return now > expires_at


# ==================================================
# API CACHE — Get
# ==================================================
async def get_api_cache(
    db: AsyncSession,
    endpoint: str,
    params: dict,
) -> dict | None:
    """
    Look up a cached API response.
    Returns the cached data if found and not expired.
    Returns None if not found or expired.

    endpoint: descriptive name like "compound_profile" or "disease_associations"
    params: dict of parameters that make this request unique e.g. {"chembl_id": "CHEMBL941"}
    """
    # Build cache key from endpoint + sorted params
    params_str = json.dumps(params, sort_keys=True)
    cache_key = make_cache_key(endpoint, params_str)

    # Query the database for this key
    result = await db.execute(
        select(APICache).where(APICache.cache_key == cache_key)
    )
    cached = result.scalar_one_or_none()

    # Return None if not found
    if not cached:
        return None

    # Return None if expired — also clean it up from DB
    if is_expired(cached.expires_at):
        await db.execute(
            delete(APICache).where(APICache.cache_key == cache_key)
        )
        await db.commit()
        return None

    # Cache hit — return the stored data
    return cached.response_data


# ==================================================
# API CACHE — Set
# ==================================================
async def set_api_cache(
    db: AsyncSession,
    endpoint: str,
    params: dict,
    data: dict,
) -> None:
    """
    Store an API response in the cache.
    If a cache entry already exists for this key, it updates it.

    endpoint: descriptive name like "compound_profile"
    params: dict of parameters that make this request unique
    data: the API response data to cache (must be JSON serializable)
    """
    params_str = json.dumps(params, sort_keys=True)
    cache_key = make_cache_key(endpoint, params_str)

    # Check if entry already exists
    result = await db.execute(
        select(APICache).where(APICache.cache_key == cache_key)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing entry — reset data and expiry
        existing.response_data = data
        existing.fetched_at = datetime.now(timezone.utc)
        # expires_at resets automatically via model default on new entries
        # but for updates we set it manually
        from datetime import timedelta
        existing.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    else:
        # Create new cache entry
        new_entry = APICache(
            cache_key=cache_key,
            endpoint=endpoint,
            response_data=data,
        )
        db.add(new_entry)

    await db.commit()


# ==================================================
# AI CACHE — Get
# ==================================================
async def get_ai_cache(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    question_type: str,
) -> str | None:
    """
    Look up a cached AI explanation.
    Returns the explanation text if found and not expired.
    Returns None if not found or expired.

    This is called regardless of whether AI is enabled or disabled.
    Even when AI is disabled we still serve from cache if available.
    """
    cache_key = make_cache_key(entity_type, entity_id, question_type)

    result = await db.execute(
        select(AIExplanationCache).where(
            AIExplanationCache.cache_key == cache_key
        )
    )
    cached = result.scalar_one_or_none()

    if not cached:
        return None

    # Return None if expired — clean up from DB
    if is_expired(cached.expires_at):
        await db.execute(
            delete(AIExplanationCache).where(
                AIExplanationCache.cache_key == cache_key
            )
        )
        await db.commit()
        return None

    # Cache hit — return the stored explanation text
    return cached.explanation


# ==================================================
# AI CACHE — Set
# ==================================================
async def set_ai_cache(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    question_type: str,
    explanation: str,
) -> None:
    """
    Store an AI explanation in the cache.
    TTL is 7 days as per your plan.
    """
    cache_key = make_cache_key(entity_type, entity_id, question_type)

    # Check if entry already exists
    result = await db.execute(
        select(AIExplanationCache).where(
            AIExplanationCache.cache_key == cache_key
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing entry
        existing.explanation = explanation
        existing.generated_at = datetime.now(timezone.utc)
        from datetime import timedelta
        existing.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    else:
        # Create new cache entry
        new_entry = AIExplanationCache(
            cache_key=cache_key,
            entity_type=entity_type,
            entity_id=entity_id,
            question_type=question_type,
            explanation=explanation,
        )
        db.add(new_entry)

    await db.commit()


# ==================================================
# CACHE CLEANUP — Remove all expired entries
# ==================================================
async def cleanup_expired_cache(db: AsyncSession) -> dict:
    """
    Removes all expired entries from both cache tables.
    Can be called periodically or via an admin endpoint.
    Returns count of deleted entries for logging.
    """
    now = datetime.now(timezone.utc)

    # Delete expired API cache entries
    api_result = await db.execute(
        delete(APICache).where(APICache.expires_at < now)
    )

    # Delete expired AI cache entries
    ai_result = await db.execute(
        delete(AIExplanationCache).where(AIExplanationCache.expires_at < now)
    )

    await db.commit()

    return {
        "api_cache_deleted": api_result.rowcount,
        "ai_cache_deleted": ai_result.rowcount,
    }

