from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.schemas.compound import (
    CompoundProfile,
    BioactivityResponse,
)
from app.services import chembl_service
from app.services import cache_service

router = APIRouter()

CHEMBL_STRUCTURE_URL = "https://www.ebi.ac.uk/chembl/api/utils/smiles2svg"


# 1. SPECIFIC ROUTES FIRST ─────────────────────────

@router.get("/{chembl_id}/activities", response_model=BioactivityResponse)
async def get_compound_activities(
    chembl_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    chembl_id = chembl_id.upper().strip()
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="compound_activities",
        params={"chembl_id": chembl_id, "limit": limit},
    )
    if cached:
        return BioactivityResponse(**cached)
    try:
        activities = await chembl_service.get_compound_activities(
            chembl_id=chembl_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )
    await cache_service.set_api_cache(
        db=db,
        endpoint="compound_activities",
        params={"chembl_id": chembl_id, "limit": limit},
        data=activities.model_dump(),
    )
    return activities


@router.get("/{chembl_id}/targets")
async def get_compound_targets(
    chembl_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    chembl_id = chembl_id.upper().strip()
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="compound_targets",
        params={"chembl_id": chembl_id},
    )
    if cached:
        return cached
    try:
        activities = await chembl_service.get_compound_activities(
            chembl_id=chembl_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )
    targets_map = {}
    for activity in activities.activities:
        target_id = activity.target_chembl_id
        if not target_id:
            continue
        if target_id not in targets_map:
            targets_map[target_id] = {
                "target_chembl_id": target_id,
                "target_name": activity.target_name,
                "best_activity_type": activity.standard_type,
                "best_activity_value": activity.standard_value,
                "best_activity_units": activity.standard_units,
                "best_pchembl_value": activity.pchembl_value,
            }
        else:
            existing = targets_map[target_id]
            if (
                activity.pchembl_value
                and existing["best_pchembl_value"]
                and activity.pchembl_value > existing["best_pchembl_value"]
            ):
                targets_map[target_id].update({
                    "best_activity_type": activity.standard_type,
                    "best_activity_value": activity.standard_value,
                    "best_activity_units": activity.standard_units,
                    "best_pchembl_value": activity.pchembl_value,
                })
    result = {
        "chembl_id": chembl_id,
        "targets": list(targets_map.values()),
        "total_count": len(targets_map),
    }
    await cache_service.set_api_cache(
        db=db,
        endpoint="compound_targets",
        params={"chembl_id": chembl_id},
        data=result,
    )
    return result


@router.get("/{chembl_id}/structure")
async def get_compound_structure(
    chembl_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the 2D structure SVG image for a compound.
    Uses POST request to ChEMBL structure service.
    """
    chembl_id = chembl_id.upper().strip()

    smiles = None

    # Try getting SMILES from cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="compound_profile",
        params={"chembl_id": chembl_id},
    )
    if cached:
        smiles = cached.get("smiles")

    # If not in cache or SMILES is None — fetch directly from ChEMBL
    if not smiles:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://www.ebi.ac.uk/chembl/api/data/molecule/{chembl_id}",
                    params={"format": "json"},
                )
                response.raise_for_status()
                data = response.json()
                structures = data.get("molecule_structures") or {}
                smiles = structures.get("canonical_smiles")
        except Exception:
            pass

    if not smiles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No structure available for {chembl_id}",
        )

    # Fetch SVG using POST — ChEMBL changed from GET to POST
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://www.ebi.ac.uk/chembl/api/utils/smiles2svg",
                json={"smiles": smiles},
            )
            response.raise_for_status()
            svg_content = response.text

        return Response(
            content=svg_content,
            media_type="image/svg+xml",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Structure service unavailable: {str(e)}",
        )

# 2. BASE ROUTE LAST ───────────────────────────────

@router.get("/{chembl_id}", response_model=CompoundProfile)
async def get_compound_profile(
    chembl_id: str,
    db: AsyncSession = Depends(get_db),
):
    chembl_id = chembl_id.upper().strip()
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="compound_profile",
        params={"chembl_id": chembl_id},
    )
    if cached:
        return CompoundProfile(**cached)
    profile = await chembl_service.get_compound_profile(chembl_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compound {chembl_id} not found in ChEMBL",
        )
    await cache_service.set_api_cache(
        db=db,
        endpoint="compound_profile",
        params={"chembl_id": chembl_id},
        data=profile.model_dump(),
    )
    return profile

