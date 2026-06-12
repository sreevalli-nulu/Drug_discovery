from app.schemas.compound import (
    CompoundSearchResult, CompoundProfile,
    BioactivityRecord, BioactivityResponse
)
from app.schemas.target import (
    TargetSearchResult, TargetProfile,
    LigandRecord, LigandsResponse
)
from app.schemas.disease import (
    DiseaseSearchResult, DiseaseProfile,
    GeneAssociation, GeneAssociationsResponse, DrugPipelineEntry
)
from app.schemas.workspace import (
    SaveEntityRequest, UpdateNotesRequest,
    SavedEntityResponse, WorkspaceResponse
)
from app.schemas.comparison import (
    CreateComparisonRequest, CompoundComparisonData, ComparisonResponse
)
from app.schemas.ai import (
    AIExplainRequest, AIExplainResponse,
    AICompareRequest, AICompareResponse
)
