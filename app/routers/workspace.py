from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.database import get_db
from app.schemas.workspace import (
    SaveEntityRequest,
    UpdateNotesRequest,
    SavedEntityResponse,
    WorkspaceResponse,
)
from app.services import workspace_service

router = APIRouter()


# --------------------------------------------------
# Temporary user ID for development
# --------------------------------------------------
# In Phase 4 you will replace this with real Supabase Auth
# For now we use a fixed UUID so we can test all endpoints
TEMP_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# ==================================================
# GET /api/workspace
# Returns full workspace organised by entity type
# ==================================================
@router.get("", response_model=WorkspaceResponse)
async def get_workspace(
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all saved compounds, targets, and diseases
    for the current user.
    """
    return await workspace_service.get_workspace(
        db=db,
        user_id=TEMP_USER_ID,
    )


# ==================================================
# POST /api/workspace
# Save a new entity to workspace
# ==================================================
@router.post("", response_model=SavedEntityResponse, status_code=status.HTTP_201_CREATED)
async def save_entity(
    request: SaveEntityRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Save a compound, target, or disease to workspace.
    If already saved, returns the existing entry.
    """
    # Validate entity type
    valid_types = {"compound", "target", "disease"}
    if request.entity_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"entity_type must be one of: {', '.join(valid_types)}",
        )

    return await workspace_service.save_entity(
        db=db,
        user_id=TEMP_USER_ID,
        request=request,
    )


# ==================================================
# PUT /api/workspace/{entity_id}
# Update notes on a saved entity
# ==================================================
@router.put("/{entity_id}", response_model=SavedEntityResponse)
async def update_notes(
    entity_id: UUID,
    request: UpdateNotesRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Update personal notes on a saved entity.
    """
    updated = await workspace_service.update_notes(
        db=db,
        user_id=TEMP_USER_ID,
        entity_db_id=entity_id,
        notes=request.notes,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved entity not found",
        )

    return updated


# ==================================================
# DELETE /api/workspace/{entity_id}
# Remove an entity from workspace
# ==================================================
@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(
    entity_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a saved entity from workspace.
    Returns 204 No Content on success.
    """
    deleted = await workspace_service.delete_entity(
        db=db,
        user_id=TEMP_USER_ID,
        entity_db_id=entity_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved entity not found",
        )


# ==================================================
# GET /api/workspace/export
# Download workspace as CSV file
# ==================================================
@router.get("/export")
async def export_workspace(
    db: AsyncSession = Depends(get_db),
):
    """
    Export all saved workspace entities as a downloadable CSV file.
    """
    csv_content = await workspace_service.export_workspace_csv(
        db=db,
        user_id=TEMP_USER_ID,
    )

    # StreamingResponse sends the CSV as a file download
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=my_workspace.csv"
        },
    )
