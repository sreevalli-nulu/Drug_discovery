from pydantic import BaseModel
from typing import Optional


# Single disease in search results
class DiseaseSearchResult(BaseModel):
    efo_id: str
    name: str
    description: Optional[str] = None
    synonyms: Optional[list[str]] = []


# Full disease profile page
class DiseaseProfile(BaseModel):
    efo_id: str
    name: str
    description: Optional[str] = None
    synonyms: Optional[list[str]] = []
    ontology_path: Optional[list[str]] = []   # breadcrumb hierarchy


# One gene associated with this disease — shown in Genes tab
class GeneAssociation(BaseModel):
    gene_id: str                               # Ensembl gene ID
    gene_symbol: Optional[str] = None
    gene_name: Optional[str] = None
    overall_score: Optional[float] = None      # Open Targets 0-1 score
    genetic_score: Optional[float] = None
    somatic_score: Optional[float] = None
    drug_score: Optional[float] = None
    pathway_score: Optional[float] = None
    text_mining_score: Optional[float] = None


# Gene associations response
class GeneAssociationsResponse(BaseModel):
    efo_id: str
    associations: list[GeneAssociation]
    total_count: int


# One drug in the disease drug pipeline
class DrugPipelineEntry(BaseModel):
    chembl_id: str
    name: str
    max_phase: Optional[int] = None
    approval_status: Optional[str] = None      # Approved / Clinical / Preclinical
    mechanism_of_action: Optional[str] = None
