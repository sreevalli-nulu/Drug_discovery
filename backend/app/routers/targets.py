from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.target import TargetProfile, LigandsResponse
from app.services import chembl_service
from app.services import opentargets_service
from app.services import cache_service

router = APIRouter()


# ==================================================
# SPECIFIC ROUTES FIRST
# ==================================================

# GET /api/targets/{target_id}/ligands
@router.get("/{target_id}/ligands", response_model=LigandsResponse)
async def get_target_ligands(
    target_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all compounds (ligands) known to hit this target.
    Powers the Ligands tab on the Target Profile page.
    Results cached for 24 hours.
    """
    target_id = target_id.upper().strip()

    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="target_ligands",
        params={"target_id": target_id, "limit": limit},
    )
    if cached:
        return LigandsResponse(**cached)

    # Fetch from ChEMBL
    try:
        ligands = await chembl_service.get_target_ligands(
            target_chembl_id=target_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="target_ligands",
        params={"target_id": target_id, "limit": limit},
        data=ligands.model_dump(),
    )

    return ligands


# GET /api/targets/{target_id}/diseases
@router.get("/{target_id}/diseases")
async def get_target_diseases(
    target_id: str,
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch diseases associated with this target from Open Targets.
    Powers the Disease Associations bar chart on Target Profile page.
    Note: target_id here should be an Ensembl gene ID (ENSG...).
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="target_diseases",
        params={"target_id": target_id, "limit": limit},
    )
    if cached:
        return cached

    # Fetch from Open Targets
    try:
        diseases = await opentargets_service.get_target_disease_associations(
            ensembl_id=target_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    result = {
        "target_id": target_id,
        "diseases": diseases,
        "total_count": len(diseases),
    }

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="target_diseases",
        params={"target_id": target_id, "limit": limit},
        data=result,
    )

    return result


# GET /api/targets/{target_id}/selectivity
@router.get("/{target_id}/selectivity")
async def get_target_selectivity(
    target_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch activity data across related target family members.
    Powers the Selectivity bar chart on Target Profile page.
    Shows how selective compounds are for this target vs related ones.
    Results cached for 24 hours.
    """
    target_id = target_id.upper().strip()

    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="target_selectivity",
        params={"target_id": target_id},
    )
    if cached:
        return cached

    # Fetch ligands and summarise activity by target
    try:
        ligands = await chembl_service.get_target_ligands(
            target_chembl_id=target_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )

    # Calculate average pChEMBL for selectivity overview
    pchembl_values = [
        l.pchembl_value
        for l in ligands.ligands
        if l.pchembl_value is not None
    ]

    avg_pchembl = (
        round(sum(pchembl_values) / len(pchembl_values), 2)
        if pchembl_values else None
    )

    result = {
        "target_id": target_id,
        "total_ligands": ligands.total_count,
        "avg_pchembl_value": avg_pchembl,
        "top_ligands": [
            {
                "chembl_id": l.chembl_id,
                "name": l.name,
                "pchembl_value": l.pchembl_value,
                "standard_type": l.standard_type,
                "standard_value": l.standard_value,
                "standard_units": l.standard_units,
            }
            for l in sorted(
                ligands.ligands,
                key=lambda x: x.pchembl_value or 0,
                reverse=True,
            )[:10]  # top 10 most potent ligands
        ],
    }

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="target_selectivity",
        params={"target_id": target_id},
        data=result,
    )

    return result


# GET /api/targets/{target_id}/evidence
@router.get("/{target_id}/evidence")
async def get_target_evidence(
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch Open Targets evidence breakdown for a target.
    Shows genetic, somatic, drug, pathway, and text mining scores.
    Powers the Open Targets Evidence tab on Target Profile page.
    Note: target_id should be an Ensembl gene ID (ENSG...).
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="target_evidence",
        params={"target_id": target_id},
    )
    if cached:
        return cached

    # Fetch disease associations which contain evidence scores
    try:
        diseases = await opentargets_service.get_target_disease_associations(
            ensembl_id=target_id,
            limit=20,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    result = {
        "target_id": target_id,
        "disease_associations": diseases,
        "total_diseases": len(diseases),
    }

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="target_evidence",
        params={"target_id": target_id},
        data=result,
    )

    return result


# ==================================================
# BASE ROUTE LAST
# ==================================================

# GET /api/targets/{target_id}
@router.get("/{target_id}", response_model=TargetProfile)
async def get_target_profile(
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch full profile for a single target by ChEMBL target ID.
    Returns protein name, gene symbol, UniProt ID, target class.
    Powers the Overview tab on Target Profile page.
    Results cached for 24 hours.
    """
    target_id = target_id.upper().strip()

    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="target_profile",
        params={"target_id": target_id},
    )
    if cached:
        return TargetProfile(**cached)

    # Fetch from ChEMBL
    profile = await chembl_service.get_target_profile(target_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target {target_id} not found in ChEMBL",
        )

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="target_profile",
        params={"target_id": target_id},
        data=profile.model_dump(),
    )

    return profile
