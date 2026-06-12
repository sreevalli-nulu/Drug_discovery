import asyncio

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import JSONResponse
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
async def log_search(db: AsyncSession, search_term: str, search_type: str) -> None:
    try:
        entry = SearchHistory(
            user_id=None,
            search_term=search_term.lower().strip(),
            search_type=search_type,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        pass  # never let logging break a search


# ==================================================
# HELPER — Run a coroutine with a hard timeout ceiling.
# Returns empty list on timeout OR any exception.
# ==================================================
async def safe_search(coro, timeout: float) -> list:
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except Exception:
        return []


# ==================================================
# GET /api/search/unified
# Runs all three searches in parallel with individual timeouts.
# ChEMBL is slow from India (~10s) so we give it 12s individually
# while Open Targets only needs 5s — they run concurrently so total
# wall time ≈ max(12, 5) = 12s instead of 10+10+5 = 25s sequentially.
# ==================================================
@router.get("/unified")
async def unified_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    if not q or len(q.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters",
        )

    # All three run in parallel — total time = slowest individual call
    compounds, targets, diseases = await asyncio.gather(
        safe_search(chembl_service.search_compounds(q, limit=limit), timeout=12.0),
        safe_search(chembl_service.search_targets(q, limit=limit), timeout=12.0),
        safe_search(opentargets_service.search_diseases(q, limit=limit), timeout=5.0),
    )

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
# ==================================================
@router.get("/compounds", response_model=list[CompoundSearchResult])
async def search_compounds(
    q: str = Query(..., min_length=2),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await asyncio.wait_for(
            chembl_service.search_compounds(q, limit=limit), timeout=12.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="ChEMBL search timed out — please try again")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ChEMBL unavailable: {str(e)}")

    await log_search(db=db, search_term=q, search_type="compound")
    return results


# ==================================================
# GET /api/search/targets
# ==================================================
@router.get("/targets", response_model=list[TargetSearchResult])
async def search_targets(
    q: str = Query(..., min_length=2),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await asyncio.wait_for(
            chembl_service.search_targets(q, limit=limit), timeout=12.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="ChEMBL target search timed out — please try again")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"ChEMBL unavailable: {str(e)}")

    await log_search(db=db, search_term=q, search_type="target")
    return results


# ==================================================
# GET /api/search/diseases
# ==================================================
@router.get("/diseases", response_model=list[DiseaseSearchResult])
async def search_diseases(
    q: str = Query(..., min_length=2),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await asyncio.wait_for(
            opentargets_service.search_diseases(q, limit=limit), timeout=8.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Open Targets search timed out — please try again")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Open Targets unavailable: {str(e)}")

    await log_search(db=db, search_term=q, search_type="disease")
    return results


# ==================================================
# GET /api/search/trending
# ==================================================
@router.get("/trending")
async def get_trending_searches(
    limit: int = Query(default=10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
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
            {"term": row.search_term, "type": row.search_type, "count": row.count}
            for row in rows
        ]
    }