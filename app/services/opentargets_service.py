import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.schemas.disease import (
    DiseaseSearchResult,
    DiseaseProfile,
    GeneAssociation,
    GeneAssociationsResponse,
    DrugPipelineEntry,
)

# Open Targets GraphQL endpoint
OPENTARGETS_URL = "https://api.platform.opentargets.org/api/v4/graphql"

# Shared async HTTP client
client = httpx.AsyncClient(
    headers={"Content-Type": "application/json"},
    timeout=30.0,
)


# --------------------------------------------------
# HELPER — Retry decorator (same pattern as ChEMBL)
# --------------------------------------------------
def opentargets_retry(func):
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=True,
    )(func)


# --------------------------------------------------
# HELPER — Execute a GraphQL query
# --------------------------------------------------
async def run_query(query: str, variables: dict) -> dict:
    """
    Sends a GraphQL query to Open Targets and returns the response data.
    All service functions use this helper internally.
    """
    response = await client.post(
        OPENTARGETS_URL,
        json={"query": query, "variables": variables},
    )
    response.raise_for_status()
    result = response.json()

    # GraphQL returns errors inside the response body (not as HTTP errors)
    if "errors" in result:
        error_messages = [e.get("message", "Unknown error") for e in result["errors"]]
        raise ValueError(f"GraphQL errors: {'; '.join(error_messages)}")

    return result.get("data", {})


# ==================================================
# DISEASE SEARCH
# ==================================================
@opentargets_retry
async def search_diseases(query: str, limit: int = 20) -> list[DiseaseSearchResult]:
    """
    Search Open Targets for diseases by name.
    Returns a list of matching diseases with EFO IDs.
    """
    # GraphQL query — asks for exactly the fields we need
    gql_query = """
    query SearchDiseases($query: String!, $size: Int!) {
        search(queryString: $query, entityNames: ["disease"], page: {size: $size, index: 0}) {
            hits {
                id
                name
                description
                entity
            }
        }
    }
    """

    data = await run_query(gql_query, {"query": query, "size": limit})
    hits = data.get("search", {}).get("hits", [])

    results = []
    for hit in hits:
        # Only include disease results (search can return targets too)
        if hit.get("entity") == "disease":
            results.append(
                DiseaseSearchResult(
                    efo_id=hit.get("id", ""),
                    name=hit.get("name", ""),
                    description=hit.get("description"),
                    synonyms=[],
                )
            )
    return results


# ==================================================
# DISEASE PROFILE
# ==================================================
@opentargets_retry
async def get_disease_profile(efo_id: str) -> DiseaseProfile | None:
    """
    Fetch full details of a single disease by EFO ID.
    Returns description, synonyms, and ontology hierarchy.
    """
    gql_query = """
    query DiseaseProfile($efoId: String!) {
        disease(efoId: $efoId) {
            id
            name
            description
            synonyms {
                terms
                relation
            }
            ancestors
        }
    }
    """


    data = await run_query(gql_query, {"efoId": efo_id})
    disease = data.get("disease")

    if not disease:
        return None

    # Extract synonyms list safely
    synonyms = []
    syn_data = disease.get("synonyms")
    if syn_data:
        if isinstance(syn_data, list):
            # API returns list of DiseaseSynonyms objects
            for syn_obj in syn_data:
                terms = syn_obj.get("terms", [])
                synonyms.extend(terms)
            synonyms = synonyms[:10]
        elif isinstance(syn_data, dict):
            synonyms = syn_data.get("terms", [])[:10]

    # limit to 10 synonyms

    # Ancestors give us the ontology hierarchy (breadcrumb)
    ancestors = disease.get("ancestors") or []

    return DiseaseProfile(
        efo_id=disease.get("id", ""),
        name=disease.get("name", ""),
        description=disease.get("description"),
        synonyms=synonyms,
        ontology_path=ancestors,
    )


# ==================================================
# GENE - DISEASE ASSOCIATIONS
# ==================================================
@opentargets_retry
async def get_disease_associations(
    efo_id: str, limit: int = 50
) -> GeneAssociationsResponse:
    """
    Fetch all genes associated with a disease ranked by score.
    This is the core Open Targets feature — gene-disease evidence scores.
    Powers the Genes tab and Evidence Heatmap on the Disease Profile page.
    """
    gql_query = """
    query DiseaseAssociations($efoId: String!, $size: Int!) {
        disease(efoId: $efoId) {
            id
            associatedTargets(page: {size: $size, index: 0}) {
                count
                rows {
                    target {
                        id
                        approvedSymbol
                        approvedName
                    }
                    score
                    datatypeScores {
                        id
                        score
                    }
                }
            }
        }
    }
    """

    data = await run_query(gql_query, {"efoId": efo_id, "size": limit})
    disease_data = data.get("disease", {})
    associated = disease_data.get("associatedTargets", {})
    rows = associated.get("rows", [])
    total = associated.get("count", 0)

    associations = []
    for row in rows:
        target = row.get("target", {})

        # Parse individual evidence type scores
        # Each datatype has an id and score
        datatype_scores = {
            ds["id"]: ds["score"]
            for ds in row.get("datatypeScores", [])
            if ds.get("id") and ds.get("score") is not None
        }

        associations.append(
            GeneAssociation(
                gene_id=target.get("id", ""),
                gene_symbol=target.get("approvedSymbol"),
                gene_name=target.get("approvedName"),
                overall_score=row.get("score"),
                genetic_score=datatype_scores.get("genetic_association"),
                somatic_score=datatype_scores.get("somatic_mutation"),
                drug_score=datatype_scores.get("known_drug"),
                pathway_score=datatype_scores.get("affected_pathway"),
                text_mining_score=datatype_scores.get("literature"),
            )
        )

    return GeneAssociationsResponse(
        efo_id=efo_id,
        associations=associations,
        total_count=total,
    )


def parse_clinical_stage(stage: str) -> tuple[int, str]:
    """
    Converts Open Targets clinical stage strings to phase number and status label.
    Examples:
        "APPROVAL"  → (4, "Approved")
        "PHASE_3"   → (3, "Phase 3")
        "PHASE_2"   → (2, "Phase 2")
        "PHASE_1"   → (1, "Phase 1")
        "UNKNOWN"   → (0, "Preclinical")
    """
    stage = (stage or "").upper().strip()

    if stage == "APPROVAL":
        return 4, "Approved"
    elif stage == "PHASE_4":
        return 4, "Approved"
    elif stage == "PHASE_3":
        return 3, "Phase 3"
    elif stage == "PHASE_2":
        return 2, "Phase 2"
    elif stage == "PHASE_1":
        return 1, "Phase 1"
    else:
        return 0, "Preclinical"
# ==================================================
# DRUG PIPELINE FOR A DISEASE
# ==================================================
@opentargets_retry
async def get_disease_drug_pipeline(efo_id: str) -> list[DrugPipelineEntry]:
    """
    Fetch all drugs linked to a disease — approved, clinical, and preclinical.
    Uses the updated drugAndClinicalCandidates field (API v4 current).
    """
    gql_query = """
    query DiseaseDrugs($efoId: String!) {
        disease(efoId: $efoId) {
            id
            drugAndClinicalCandidates {
                rows {
                    id
                    maxClinicalStage
                    drug {
                        id
                        name
                        maximumClinicalStage
                    }
                }
            }
        }
    }
    """

    data = await run_query(gql_query, {"efoId": efo_id})
    disease_data = data.get("disease", {})
    candidates = disease_data.get("drugAndClinicalCandidates", {})
    rows = candidates.get("rows", [])

    pipeline = []
    seen_ids = set()

    for row in rows:
        drug = row.get("drug", {})
        drug_id = drug.get("id")

        if not drug_id or drug_id in seen_ids:
            continue
        seen_ids.add(drug_id)

        # Convert stage string to phase number
        # maximumClinicalStage returns strings like "APPROVAL", "PHASE_3" etc.
        stage = drug.get("maximumClinicalStage") or row.get("maxClinicalStage", "")
        max_phase, approval_status = parse_clinical_stage(stage)

        pipeline.append(
            DrugPipelineEntry(
                chembl_id=drug_id,
                name=drug.get("name", ""),
                max_phase=max_phase,
                approval_status=approval_status,
                mechanism_of_action=None,
            )
        )

    # Sort — approved first, then by phase descending
    pipeline.sort(key=lambda x: x.max_phase or 0, reverse=True)
    return pipeline


# ==================================================
# TARGET DISEASE ASSOCIATIONS
# ==================================================
@opentargets_retry
async def get_target_disease_associations(
    ensembl_id: str, limit: int = 20
) -> list[dict]:
    """
    Fetch diseases associated with a specific gene/target.
    Used in the Target Profile page — Disease Associations bar chart.
    """
    gql_query = """
    query TargetDiseases($ensemblId: String!, $size: Int!) {
        target(ensemblId: $ensemblId) {
            id
            associatedDiseases(page: {size: $size, index: 0}) {
                count
                rows {
                    disease {
                        id
                        name
                        description
                    }
                    score
                }
            }
        }
    }
    """

    data = await run_query(gql_query, {"ensemblId": ensembl_id, "size": limit})
    target_data = data.get("target", {})
    associated = target_data.get("associatedDiseases", {})
    rows = associated.get("rows", [])

    # Return as plain dicts — simple enough without a dedicated schema
    results = []
    for row in rows:
        disease = row.get("disease", {})
        results.append({
            "efo_id": disease.get("id"),
            "name": disease.get("name"),
            "description": disease.get("description"),
            "score": row.get("score"),
        })

    return results
