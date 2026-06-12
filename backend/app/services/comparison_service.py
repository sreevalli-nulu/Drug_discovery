from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.comparison import Comparison
from app.schemas.comparison import (
    CreateComparisonRequest,
    CompoundComparisonData,
    ComparisonResponse,
)
from app.services import chembl_service
from app.services import cache_service


# ==================================================
# CREATE COMPARISON
# ==================================================
async def create_comparison(
    db: AsyncSession,
    user_id: UUID,
    request: CreateComparisonRequest,
) -> ComparisonResponse:
    """
    Creates a new comparison session for up to 4 compounds.

    Steps:
    1. Fetch each compound profile from ChEMBL (with cache)
    2. Store the comparison session in the database
    3. Return all compound data side by side

    user_id: UUID of the current user
    request: contains list of ChEMBL IDs and optional name
    """

    # ── Step 1: Fetch each compound profile ───────────────
    compounds_data = []

    for chembl_id in request.entity_ids:
        # Check API cache first before calling ChEMBL
        cached = await cache_service.get_api_cache(
            db=db,
            endpoint="compound_profile",
            params={"chembl_id": chembl_id},
        )

        if cached:
            # Serve from cache
            compound = CompoundComparisonData(**cached)
        else:
            # Fetch fresh from ChEMBL
            profile = await chembl_service.get_compound_profile(chembl_id)

            if profile is None:
                # Compound not found — add placeholder so comparison still works
                compound = CompoundComparisonData(
                    chembl_id=chembl_id,
                    name=f"Unknown ({chembl_id})",
                )
            else:
                compound = CompoundComparisonData(
                    chembl_id=profile.chembl_id,
                    name=profile.name,
                    molecular_weight=profile.molecular_weight,
                    logp=profile.logp,
                    hbd=profile.hbd,
                    hba=profile.hba,
                    tpsa=profile.tpsa,
                    ro5_violations=profile.ro5_violations,
                    approval_status=profile.approval_status,
                )

                # Store in cache for future requests
                await cache_service.set_api_cache(
                    db=db,
                    endpoint="compound_profile",
                    params={"chembl_id": chembl_id},
                    data=compound.model_dump(),
                )

        compounds_data.append(compound)

    # ── Step 2: Store comparison session in DB ─────────────
    new_comparison = Comparison(
        user_id=user_id,
        entity_type="compound",
        entity_ids=request.entity_ids,
        name=request.name,
    )
    db.add(new_comparison)
    await db.commit()
    await db.refresh(new_comparison)

    # ── Step 3: Return full comparison response ────────────
    return ComparisonResponse(
        id=new_comparison.id,
        name=new_comparison.name,
        compounds=compounds_data,
        created_at=new_comparison.created_at,
    )


# ==================================================
# GET COMPARISON BY ID
# ==================================================
async def get_comparison(
    db: AsyncSession,
    user_id: UUID,
    comparison_id: UUID,
) -> ComparisonResponse | None:
    """
    Retrieves a previously saved comparison session by its ID.
    Re-fetches compound data for each stored ChEMBL ID.
    Returns None if not found or doesn't belong to this user.
    """
    result = await db.execute(
        select(Comparison).where(
            Comparison.id == comparison_id,
            Comparison.user_id == user_id,  # security check
        )
    )
    comparison = result.scalar_one_or_none()

    if not comparison:
        return None

    # Re-fetch compound data for each stored ChEMBL ID
    compounds_data = []
    for chembl_id in comparison.entity_ids:
        # Check cache first
        cached = await cache_service.get_api_cache(
            db=db,
            endpoint="compound_profile",
            params={"chembl_id": chembl_id},
        )

        if cached:
            compound = CompoundComparisonData(**cached)
        else:
            profile = await chembl_service.get_compound_profile(chembl_id)
            if profile is None:
                compound = CompoundComparisonData(
                    chembl_id=chembl_id,
                    name=f"Unknown ({chembl_id})",
                )
            else:
                compound = CompoundComparisonData(
                    chembl_id=profile.chembl_id,
                    name=profile.name,
                    molecular_weight=profile.molecular_weight,
                    logp=profile.logp,
                    hbd=profile.hbd,
                    hba=profile.hba,
                    tpsa=profile.tpsa,
                    ro5_violations=profile.ro5_violations,
                    approval_status=profile.approval_status,
                )

                # Cache for future
                await cache_service.set_api_cache(
                    db=db,
                    endpoint="compound_profile",
                    params={"chembl_id": chembl_id},
                    data=compound.model_dump(),
                )

        compounds_data.append(compound)

    return ComparisonResponse(
        id=comparison.id,
        name=comparison.name,
        compounds=compounds_data,
        created_at=comparison.created_at,
    )


# ==================================================
# GET ALL COMPARISONS FOR USER
# ==================================================
async def get_user_comparisons(
    db: AsyncSession,
    user_id: UUID,
) -> list[dict]:
    """
    Returns a list of all comparison sessions saved by this user.
    Returns lightweight data — just ID, name, entity_ids, created_at.
    Used to show comparison history in the workspace.
    """
    result = await db.execute(
        select(Comparison)
        .where(Comparison.user_id == user_id)
        .order_by(Comparison.created_at.desc())
    )
    comparisons = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "entity_ids": c.entity_ids,
            "entity_type": c.entity_type,
            "created_at": c.created_at.isoformat(),
        }
        for c in comparisons
    ]
