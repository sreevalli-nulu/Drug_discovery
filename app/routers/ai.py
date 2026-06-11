from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.schemas.ai import (
    AIExplainRequest,
    AIExplainResponse,
    AICompareRequest,
    AICompareResponse,
)
from app.services import ai_service
from app.services import cache_service
from app.services import chembl_service

router = APIRouter()


# ==================================================
# POST /api/ai/explain
# Get AI explanation for a compound, target, or disease
# ==================================================
@router.post("/explain", response_model=AIExplainResponse)
async def explain_entity(
    request: AIExplainRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a plain English explanation for any entity.

    entity_type: compound / target / disease
    entity_id:   ChEMBL ID, UniProt ID, or EFO ID
    question_type: mechanism / ic50 / druglike / disease_gene

    Logic:
    - Always checks cache first
    - Cache hit → returns cached explanation (even if AI disabled)
    - Cache miss + AI disabled → returns placeholder message
    - Cache miss + AI enabled → calls Haiku → caches → returns
    """

    # Validate entity type
    valid_entity_types = {"compound", "target", "disease"}
    if request.entity_type not in valid_entity_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"entity_type must be one of: {', '.join(valid_entity_types)}",
        )

    # Validate question type
    valid_question_types = {"mechanism", "ic50", "druglike", "disease_gene"}
    if request.question_type not in valid_question_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"question_type must be one of: {', '.join(valid_question_types)}",
        )

    # Build context from cached compound data if available
    # This makes the AI explanation more specific and accurate
    context = {}

    if request.entity_type == "compound":
        cached_profile = await cache_service.get_api_cache(
            db=db,
            endpoint="compound_profile",
            params={"chembl_id": request.entity_id.upper()},
        )
        if cached_profile:
            context = {
                "molecular_weight": cached_profile.get("molecular_weight"),
                "logp": cached_profile.get("logp"),
                "hbd": cached_profile.get("hbd"),
                "hba": cached_profile.get("hba"),
                "tpsa": cached_profile.get("tpsa"),
                "ro5_violations": cached_profile.get("ro5_violations"),
                "approval_status": cached_profile.get("approval_status"),
            }

    # Call AI service — handles all cache + flag logic internally
    response = await ai_service.get_explanation(
        db=db,
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        question_type=request.question_type,
        context=context,
    )

    return response


# ==================================================
# POST /api/ai/compare
# Get AI narrative comparing multiple compounds
# ==================================================
@router.post("/compare", response_model=AICompareResponse)
async def compare_compounds(
    request: AICompareRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a plain English narrative comparing 2-4 compounds.
    Uses cached compound data where available.
    Powers the AI Insights section on the Comparison page.
    """

    # Validate number of compounds
    if len(request.chembl_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 compounds to compare",
        )
    if len(request.chembl_ids) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot compare more than 4 compounds at once",
        )

    # Fetch compound data for context
    # Try cache first — fall back to ChEMBL API
    compounds_data = []
    for chembl_id in request.chembl_ids:
        chembl_id = chembl_id.upper().strip()

        cached = await cache_service.get_api_cache(
            db=db,
            endpoint="compound_profile",
            params={"chembl_id": chembl_id},
        )

        if cached:
            compounds_data.append(cached)
        else:
            # Fetch fresh from ChEMBL
            try:
                profile = await chembl_service.get_compound_profile(chembl_id)
                if profile:
                    compounds_data.append(profile.model_dump())
                else:
                    # Add minimal placeholder if not found
                    compounds_data.append({
                        "chembl_id": chembl_id,
                        "name": f"Unknown ({chembl_id})",
                    })
            except Exception:
                compounds_data.append({
                    "chembl_id": chembl_id,
                    "name": f"Unknown ({chembl_id})",
                })

    # Call AI service for comparison narrative
    response = await ai_service.get_comparison_narrative(
        db=db,
        chembl_ids=request.chembl_ids,
        compounds_data=compounds_data,
    )

    return response


# ==================================================
# GET /api/ai/status
# Check AI feature flag status
# ==================================================
@router.get("/status")
async def get_ai_status():
    """
    Returns the current AI feature flag status.
    Useful for the frontend to know whether to show
    the AI Insights tab or a disabled message.
    """
    return {
        "ai_enabled": settings.ai_enabled,
        "model": settings.anthropic_model if settings.ai_enabled else "disabled",
        "message": (
            "AI explanations are active"
            if settings.ai_enabled
            else "AI explanations are disabled — set AI_ENABLED=true to enable"
        ),
    }


# ==================================================
# DELETE /api/ai/cache
# Clear AI explanation cache
# ==================================================
@router.delete("/cache", status_code=status.HTTP_200_OK)
async def clear_ai_cache(
    db: AsyncSession = Depends(get_db),
):
    """
    Clears all expired cache entries from both
    api_cache and ai_explanation_cache tables.
    Useful for maintenance and testing.
    """
    result = await cache_service.cleanup_expired_cache(db=db)
    return {
        "message": "Cache cleanup complete",
        "api_cache_deleted": result["api_cache_deleted"],
        "ai_cache_deleted": result["ai_cache_deleted"],
    }
