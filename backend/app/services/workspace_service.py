import csv
import io
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.saved_entity import SavedEntity
from app.schemas.workspace import (
    SaveEntityRequest,
    SavedEntityResponse,
    WorkspaceResponse,
)


# ==================================================
# SAVE ENTITY TO WORKSPACE
# ==================================================
async def save_entity(
    db: AsyncSession,
    user_id: UUID,
    request: SaveEntityRequest,
) -> SavedEntityResponse:
    """
    Saves a compound, target, or disease to the user's workspace.
    If already saved, returns the existing entry without duplicating.

    user_id: UUID of the logged-in user
    request: contains entity_type, entity_id, entity_name, notes
    """
    # Check if already saved — avoid duplicates
    result = await db.execute(
        select(SavedEntity).where(
            SavedEntity.user_id == user_id,
            SavedEntity.entity_type == request.entity_type,
            SavedEntity.entity_id == request.entity_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Already saved — just return it as-is
        return SavedEntityResponse.model_validate(existing)

    # Create new saved entity
    new_entity = SavedEntity(
        user_id=user_id,
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        entity_name=request.entity_name,
        notes=request.notes,
    )
    db.add(new_entity)
    await db.commit()
    await db.refresh(new_entity)

    return SavedEntityResponse.model_validate(new_entity)


# ==================================================
# GET FULL WORKSPACE
# ==================================================
async def get_workspace(
    db: AsyncSession,
    user_id: UUID,
) -> WorkspaceResponse:
    """
    Fetches all saved entities for a user organised by type.
    Returns compounds, targets, and diseases in separate lists.
    """
    result = await db.execute(
        select(SavedEntity)
        .where(SavedEntity.user_id == user_id)
        .order_by(SavedEntity.saved_at.desc())  # most recently saved first
    )
    all_entities = result.scalars().all()

    # Separate into three lists by entity type
    compounds = []
    targets = []
    diseases = []

    for entity in all_entities:
        response = SavedEntityResponse.model_validate(entity)
        if entity.entity_type == "compound":
            compounds.append(response)
        elif entity.entity_type == "target":
            targets.append(response)
        elif entity.entity_type == "disease":
            diseases.append(response)

    return WorkspaceResponse(
        compounds=compounds,
        targets=targets,
        diseases=diseases,
        total_count=len(all_entities),
    )


# ==================================================
# UPDATE NOTES
# ==================================================
async def update_notes(
    db: AsyncSession,
    user_id: UUID,
    entity_db_id: UUID,
    notes: str,
) -> SavedEntityResponse | None:
    """
    Updates the personal notes on a saved entity.
    Returns None if the entity is not found or doesn't belong to this user.

    entity_db_id: the UUID primary key of the saved_entity row
    """
    result = await db.execute(
        select(SavedEntity).where(
            SavedEntity.id == entity_db_id,
            SavedEntity.user_id == user_id,  # security check — user owns this
        )
    )
    entity = result.scalar_one_or_none()

    if not entity:
        return None

    entity.notes = notes
    await db.commit()
    await db.refresh(entity)

    return SavedEntityResponse.model_validate(entity)


# ==================================================
# DELETE SAVED ENTITY
# ==================================================
async def delete_entity(
    db: AsyncSession,
    user_id: UUID,
    entity_db_id: UUID,
) -> bool:
    """
    Deletes a saved entity from the workspace.
    Returns True if deleted, False if not found.

    Security: checks user_id to ensure users can only delete their own items.
    """
    result = await db.execute(
        select(SavedEntity).where(
            SavedEntity.id == entity_db_id,
            SavedEntity.user_id == user_id,  # security check
        )
    )
    entity = result.scalar_one_or_none()

    if not entity:
        return False

    await db.execute(
        delete(SavedEntity).where(SavedEntity.id == entity_db_id)
    )
    await db.commit()
    return True


# ==================================================
# EXPORT WORKSPACE AS CSV
# ==================================================
async def export_workspace_csv(
    db: AsyncSession,
    user_id: UUID,
) -> str:
    """
    Exports all saved entities as a CSV string.
    The router will wrap this in a streaming response for download.
    """
    result = await db.execute(
        select(SavedEntity)
        .where(SavedEntity.user_id == user_id)
        .order_by(SavedEntity.entity_type, SavedEntity.entity_name)
    )
    all_entities = result.scalars().all()

    # Write CSV to an in-memory string buffer
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Entity Type",
        "Entity ID",
        "Entity Name",
        "Notes",
        "Saved At",
    ])

    # Data rows
    for entity in all_entities:
        writer.writerow([
            entity.entity_type,
            entity.entity_id,
            entity.entity_name,
            entity.notes or "",
            entity.saved_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    return output.getvalue()
