from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.disease import (
    DiseaseProfile,
    GeneAssociationsResponse,
)
from app.services import opentargets_service
from app.services import cache_service

router = APIRouter()


# ==================================================
# SPECIFIC ROUTES FIRST
# ==================================================

# GET /api/diseases/{efo_id}/genes
@router.get("/{efo_id}/genes", response_model=GeneAssociationsResponse)
async def get_disease_genes(
    efo_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all genes associated with this disease ranked by score.
    Returns genetic, somatic, drug, pathway, text mining scores.
    Powers the Genes tab and Evidence Heatmap on Disease Profile page.
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="disease_genes",
        params={"efo_id": efo_id, "limit": limit},
    )
    if cached:
        return GeneAssociationsResponse(**cached)

    # Fetch from Open Targets
    try:
        associations = await opentargets_service.get_disease_associations(
            efo_id=efo_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="disease_genes",
        params={"efo_id": efo_id, "limit": limit},
        data=associations.model_dump(),
    )

    return associations


# GET /api/diseases/{efo_id}/drugs
@router.get("/{efo_id}/drugs")
async def get_disease_drugs(
    efo_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all drugs for this disease — approved, clinical, preclinical.
    Powers the Drug Pipeline funnel chart on Disease Profile page.
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="disease_drugs",
        params={"efo_id": efo_id},
    )
    if cached:
        return cached

    # Fetch from Open Targets
    try:
        pipeline = await opentargets_service.get_disease_drug_pipeline(
            efo_id=efo_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    # Group by approval status for pipeline funnel chart
    approved = [d for d in pipeline if d.max_phase == 4]
    phase3 = [d for d in pipeline if d.max_phase == 3]
    phase2 = [d for d in pipeline if d.max_phase == 2]
    phase1 = [d for d in pipeline if d.max_phase == 1]
    preclinical = [d for d in pipeline if not d.max_phase or d.max_phase == 0]

    result = {
        "efo_id": efo_id,
        "total_count": len(pipeline),
        "pipeline_summary": {
            "approved": len(approved),
            "phase_3": len(phase3),
            "phase_2": len(phase2),
            "phase_1": len(phase1),
            "preclinical": len(preclinical),
        },
        "drugs": [d.model_dump() for d in pipeline],
    }

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="disease_drugs",
        params={"efo_id": efo_id},
        data=result,
    )

    return result


# GET /api/diseases/{efo_id}/evidence-heatmap
@router.get("/{efo_id}/evidence-heatmap")
async def get_evidence_heatmap(
    efo_id: str,
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch gene x evidence type matrix data for the heatmap.
    Returns top genes with all their individual evidence scores.
    Powers the Evidence Heatmap (D3.js) on Disease Profile page.
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="disease_evidence_heatmap",
        params={"efo_id": efo_id, "limit": limit},
    )
    if cached:
        return cached

    # Fetch gene associations which contain all evidence scores
    try:
        associations = await opentargets_service.get_disease_associations(
            efo_id=efo_id,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    # Format as matrix data for D3 heatmap
    # Each row = one gene, each column = one evidence type
    evidence_types = [
        "genetic_score",
        "somatic_score",
        "drug_score",
        "pathway_score",
        "text_mining_score",
    ]

    matrix = []
    for assoc in associations.associations:
        row = {
            "gene_symbol": assoc.gene_symbol or assoc.gene_id,
            "gene_id": assoc.gene_id,
            "overall_score": assoc.overall_score,
            "scores": {
                "genetic": assoc.genetic_score or 0,
                "somatic": assoc.somatic_score or 0,
                "drug": assoc.drug_score or 0,
                "pathway": assoc.pathway_score or 0,
                "text_mining": assoc.text_mining_score or 0,
            }
        }
        matrix.append(row)

    result = {
        "efo_id": efo_id,
        "evidence_types": ["genetic", "somatic", "drug", "pathway", "text_mining"],
        "genes": matrix,
        "total_genes": len(matrix),
    }

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="disease_evidence_heatmap",
        params={"efo_id": efo_id, "limit": limit},
        data=result,
    )

    return result


# ==================================================
# BASE ROUTE LAST
# ==================================================

# GET /api/diseases/{efo_id}
@router.get("/{efo_id}", response_model=DiseaseProfile)
async def get_disease_profile(
    efo_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch full profile for a single disease by EFO ID.
    Returns name, description, synonyms, ontology hierarchy.
    Powers the Overview tab on Disease Profile page.
    Results cached for 24 hours.
    """
    # Check cache first
    cached = await cache_service.get_api_cache(
        db=db,
        endpoint="disease_profile",
        params={"efo_id": efo_id},
    )
    if cached:
        return DiseaseProfile(**cached)

    # Fetch from Open Targets
    profile = await opentargets_service.get_disease_profile(efo_id=efo_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease {efo_id} not found in Open Targets",
        )

    # Cache result
    await cache_service.set_api_cache(
        db=db,
        endpoint="disease_profile",
        params={"efo_id": efo_id},
        data=profile.model_dump(),
    )

    return profile
