from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.comparison import (
    CreateComparisonRequest,
    ComparisonResponse,
)
from app.services import comparison_service

router = APIRouter()

# Same temp user ID as workspace — replaced with real auth in Phase 4
TEMP_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# ==================================================
# POST /api/comparison
# Create a new comparison session
# ==================================================
@router.post(
    "",
    response_model=ComparisonResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comparison(
    request: CreateComparisonRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new side-by-side comparison of 2-4 compounds.
    Fetches physicochemical properties for each ChEMBL ID.
    """
    return await comparison_service.create_comparison(
        db=db,
        user_id=TEMP_USER_ID,
        request=request,
    )


# ==================================================
# GET /api/comparison
# Get all comparisons for current user
# ==================================================
@router.get("", response_model=list[dict])
async def get_user_comparisons(
    db: AsyncSession = Depends(get_db),
):
    """
    Get all previously saved comparison sessions for the current user.
    """
    return await comparison_service.get_user_comparisons(
        db=db,
        user_id=TEMP_USER_ID,
    )


# ==================================================
# GET /api/comparison/{comparison_id}
# Get a specific comparison by ID
# ==================================================
@router.get("/{comparison_id}", response_model=ComparisonResponse)
async def get_comparison(
    comparison_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a previously saved comparison by its ID.
    Re-fetches compound data for all stored ChEMBL IDs.
    """
    result = await comparison_service.get_comparison(
        db=db,
        user_id=TEMP_USER_ID,
        comparison_id=comparison_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found",
        )

    return result
