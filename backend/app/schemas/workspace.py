from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


# Frontend sends this when saving a compound/target/disease
class SaveEntityRequest(BaseModel):
    entity_type: str        # compound / target / disease
    entity_id: str          # ChEMBL ID, UniProt ID, or EFO ID
    entity_name: str
    notes: Optional[str] = None


# Frontend sends this when updating notes
class UpdateNotesRequest(BaseModel):
    notes: str


# What gets returned for each saved item
class SavedEntityResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: str
    entity_name: str
    notes: Optional[str] = None
    saved_at: datetime

    class Config:
        from_attributes = True     # allows converting SQLAlchemy model → this schema


# Full workspace response
class WorkspaceResponse(BaseModel):
    compounds: list[SavedEntityResponse]
    targets: list[SavedEntityResponse]
    diseases: list[SavedEntityResponse]
    total_count: int


