from pydantic import BaseModel
from typing import Optional


# Single target in search results
class TargetSearchResult(BaseModel):
    target_chembl_id: str
    pref_name: str                          # preferred protein name
    target_type: Optional[str] = None       # SINGLE PROTEIN, PROTEIN COMPLEX etc.
    organism: Optional[str] = None
    gene_name: Optional[str] = None


# Full target profile page
class TargetProfile(BaseModel):
    target_chembl_id: str
    pref_name: str
    target_type: Optional[str] = None
    organism: Optional[str] = None
    gene_name: Optional[str] = None
    uniprot_id: Optional[str] = None
    target_class: Optional[str] = None     # Kinase, GPCR, Ion Channel etc.
    description: Optional[str] = None


# One compound that hits this target — shown in Ligands tab
class LigandRecord(BaseModel):
    chembl_id: str
    name: Optional[str] = None
    standard_type: Optional[str] = None    # IC50, Ki etc.
    standard_value: Optional[float] = None
    standard_units: Optional[str] = None
    pchembl_value: Optional[float] = None


# Full ligands response
class LigandsResponse(BaseModel):
    target_chembl_id: str
    ligands: list[LigandRecord]
    total_count: int

