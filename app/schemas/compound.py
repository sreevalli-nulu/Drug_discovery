from pydantic import BaseModel
from typing import Optional


# Single compound in search results list
class CompoundSearchResult(BaseModel):
    chembl_id: str
    name: str
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    max_phase: Optional[int] = None        # 4=Approved, 3=Phase3, etc.
    indication: Optional[str] = None


# Full compound profile page
class CompoundProfile(BaseModel):
    chembl_id: str
    name: str
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None           # lipophilicity
    hbd: Optional[int] = None              # hydrogen bond donors
    hba: Optional[int] = None              # hydrogen bond acceptors
    tpsa: Optional[float] = None           # topological polar surface area
    ro5_violations: Optional[int] = None   # Lipinski Rule of 5 violations
    smiles: Optional[str] = None           # chemical structure string
    max_phase: Optional[int] = None
    approval_status: Optional[str] = None  # Approved / Clinical / Preclinical


# One row in the bioactivity table
class BioactivityRecord(BaseModel):
    activity_id: Optional[int] = None
    target_name: Optional[str] = None
    target_chembl_id: Optional[str] = None
    assay_type: Optional[str] = None       # B=Binding, F=Functional etc.
    standard_type: Optional[str] = None    # IC50, Ki, EC50 etc.
    standard_value: Optional[float] = None
    standard_units: Optional[str] = None   # nM, uM etc.
    pchembl_value: Optional[float] = None  # -log10 of activity value
    document_year: Optional[int] = None


# Full bioactivity response — list of records
class BioactivityResponse(BaseModel):
    chembl_id: str
    activities: list[BioactivityRecord]
    total_count: int
