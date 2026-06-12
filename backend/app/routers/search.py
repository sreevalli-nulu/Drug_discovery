from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.search_history import SearchHistory
from app.schemas.compound import CompoundSearchResult
from app.schemas.target import TargetSearchResult
from app.schemas.disease import DiseaseSearchResult
from app.services import chembl_service
from app.services import opentargets_service

router = APIRouter()


# ==================================================
# HELPER — Log search to history table
# ==================================================
async def log_search(
    db: AsyncSession,
    search_term: str,
    search_type: str,
) -> None:
    """
    Logs every search to search_history table.
    Used for trending searches on the home page.
    user_id is None for anonymous searches.
    """
    entry = SearchHistory(
        user_id=None,          # anonymous for now — Phase 4 adds real auth
        search_term=search_term.lower().strip(),
        search_type=search_type,
    )
    db.add(entry)
    await db.commit()


# ==================================================
# GET /api/search/unified
# Search across compounds, targets, and diseases
# ==================================================
@router.get("/unified")
async def unified_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Searches ChEMBL and Open Targets simultaneously.
    Returns compounds, targets, and diseases in one response.
    Powers the main search bar on the home page.
    """
    if not q or len(q.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters",
        )

    # Run all three searches — if one fails others still return
    compounds = []
    targets = []
    diseases = []

    try:
        compounds = await chembl_service.search_compounds(q, limit=limit)
    except Exception:
        pass  # Don't fail entire search if ChEMBL is slow

    try:
        targets = await chembl_service.search_targets(q, limit=limit)
    except Exception:
        pass

    try:
        diseases = await opentargets_service.search_diseases(q, limit=limit)
    except Exception:
        pass

    # Log the search for trending
    await log_search(db=db, search_term=q, search_type="unified")

    return {
        "query": q,
        "compounds": compounds,
        "targets": targets,
        "diseases": diseases,
        "counts": {
            "compounds": len(compounds),
            "targets": len(targets),
            "diseases": len(diseases),
            "total": len(compounds) + len(targets) + len(diseases),
        },
    }


# ==================================================
# GET /api/search/compounds
# Search compounds only via ChEMBL
# ==================================================
@router.get("/compounds", response_model=list[CompoundSearchResult])
async def search_compounds(
    q: str = Query(..., min_length=2, description="Compound name or ChEMBL ID"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search ChEMBL for compounds by name or ChEMBL ID.
    Returns paginated list of matching compounds.
    """
    try:
        results = await chembl_service.search_compounds(q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )

    # Log search
    await log_search(db=db, search_term=q, search_type="compound")

    return results


# ==================================================
# GET /api/search/targets
# Search targets only via ChEMBL
# ==================================================
@router.get("/targets", response_model=list[TargetSearchResult])
async def search_targets(
    q: str = Query(..., min_length=2, description="Target name or gene symbol"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search ChEMBL for protein targets by name or gene symbol.
    Returns paginated list of matching targets.
    """
    try:
        results = await chembl_service.search_targets(q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ChEMBL service unavailable: {str(e)}",
        )

    # Log search
    await log_search(db=db, search_term=q, search_type="target")

    return results


# ==================================================
# GET /api/search/diseases
# Search diseases only via Open Targets
# ==================================================
@router.get("/diseases", response_model=list[DiseaseSearchResult])
async def search_diseases(
    q: str = Query(..., min_length=2, description="Disease name or EFO ID"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search Open Targets for diseases by name.
    Returns paginated list of matching diseases with EFO IDs.
    """
    try:
        results = await opentargets_service.search_diseases(q, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Open Targets service unavailable: {str(e)}",
        )

    # Log search
    await log_search(db=db, search_term=q, search_type="disease")

    return results


# ==================================================
# GET /api/search/trending
# Get most searched terms this week
# ==================================================
@router.get("/trending")
async def get_trending_searches(
    limit: int = Query(default=10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the most searched terms in the last 7 days.
    Powers the trending searches section on the home page.
    """
    # Only look at searches from the last 7 days
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    result = await db.execute(
        select(
            SearchHistory.search_term,
            SearchHistory.search_type,
            func.count(SearchHistory.id).label("count"),
        )
        .where(SearchHistory.searched_at >= one_week_ago)
        .group_by(SearchHistory.search_term, SearchHistory.search_type)
        .order_by(func.count(SearchHistory.id).desc())
        .limit(limit)
    )
    rows = result.all()

    return {
        "trending": [
            {
                "term": row.search_term,
                "type": row.search_type,
                "count": row.count,
            }
            for row in rows
        ]
    }
