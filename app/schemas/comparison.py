from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


# Frontend sends this to start a comparison
class CreateComparisonRequest(BaseModel):
    entity_ids: list[str]       # up to 4 ChEMBL IDs
    name: Optional[str] = None  # optional name user gives this comparison

    @field_validator("entity_ids")
    @classmethod
    def max_four_compounds(cls, v):
        if len(v) < 2:
            raise ValueError("Need at least 2 compounds to compare")
        if len(v) > 4:
            raise ValueError("Cannot compare more than 4 compounds at once")
        return v


# One compound's data in the comparison view
class CompoundComparisonData(BaseModel):
    chembl_id: str
    name: str
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    hbd: Optional[int] = None
    hba: Optional[int] = None
    tpsa: Optional[float] = None
    ro5_violations: Optional[int] = None
    approval_status: Optional[str] = None


# Full comparison response — all compounds side by side
class ComparisonResponse(BaseModel):
    id: uuid.UUID
    name: Optional[str] = None
    compounds: list[CompoundComparisonData]
    created_at: datetime

    class Config:
        from_attributes = True
