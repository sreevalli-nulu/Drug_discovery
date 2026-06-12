from pydantic import BaseModel
from typing import Optional


# Frontend sends this to request an AI explanation
class AIExplainRequest(BaseModel):
    entity_type: str        # compound / target / disease
    entity_id: str          # ChEMBL ID, UniProt ID, or EFO ID
    question_type: str      # mechanism / ic50 / druglike / disease_gene


# What gets returned
class AIExplainResponse(BaseModel):
    entity_id: str
    question_type: str
    explanation: str                        # the actual plain English explanation
    from_cache: bool                        # was this served from cache or freshly generated?
    ai_enabled: bool                        # is AI currently turned on in .env?


# Frontend sends this for compound comparison narrative
class AICompareRequest(BaseModel):
    chembl_ids: list[str]


# What gets returned for comparison narrative
class AICompareResponse(BaseModel):
    explanation: str
    from_cache: bool
    ai_enabled: bool

