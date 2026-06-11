import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.schemas.compound import (
    CompoundSearchResult,
    CompoundProfile,
    BioactivityRecord,
    BioactivityResponse,
)
from app.schemas.target import (
    TargetSearchResult,
    TargetProfile,
    LigandRecord,
    LigandsResponse,
)

# Base URL for all ChEMBL API calls
CHEMBL_BASE_URL = "https://www.ebi.ac.uk/chembl/api/data"

# Shared async HTTP client — reused across all calls (more efficient)
client = httpx.AsyncClient(
    base_url=CHEMBL_BASE_URL,
    headers={"Accept": "application/json"},
    timeout=30.0,
)


# --------------------------------------------------
# HELPER — Retry decorator
# --------------------------------------------------
def chembl_retry(func):
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=True,
    )(func)


# --------------------------------------------------
# HELPER — Approval status from max_phase
# --------------------------------------------------
def get_approval_status(max_phase: int | None) -> str:
    if max_phase is None:
        return "Unknown"
    if max_phase == 4:
        return "Approved"
    if max_phase == 3:
        return "Phase 3"
    if max_phase == 2:
        return "Phase 2"
    if max_phase == 1:
        return "Phase 1"
    return "Preclinical"


# --------------------------------------------------
# HELPER — Fetch SMILES directly from ChEMBL
# --------------------------------------------------
async def fetch_smiles(chembl_id: str) -> str | None:
    """
    Fetches SMILES string directly from ChEMBL molecule endpoint.
    Used as fallback when SMILES is missing from cached profile.
    """
    try:
        response = await client.get(
            f"/molecule/{chembl_id}",
            params={"format": "json"},
        )
        if response.status_code != 200:
            return None
        data = response.json()
        structures = data.get("molecule_structures") or {}
        return (
            structures.get("canonical_smiles")
            or structures.get("standard_inchi")
            or None
        )
    except Exception:
        return None


# ==================================================
# COMPOUND SEARCH
# ==================================================
@chembl_retry
async def search_compounds(query: str, limit: int = 20) -> list[CompoundSearchResult]:
    """
    Search ChEMBL for compounds by name or ChEMBL ID.
    Returns a list of matching compounds with basic info.
    """
    response = await client.get(
        "/molecule",
        params={
            "pref_name__icontains": query,
            "limit": limit,
            "format": "json",
        },
    )
    response.raise_for_status()
    data = response.json()

    results = []
    for molecule in data.get("molecules", []):
        props = molecule.get("molecule_properties") or {}
        results.append(
            CompoundSearchResult(
                chembl_id=molecule.get("molecule_chembl_id", ""),
                name=molecule.get("pref_name") or molecule.get("molecule_chembl_id", ""),
                molecular_formula=props.get("full_molecular_formula"),
                molecular_weight=float(props["full_mwt"]) if props.get("full_mwt") else None,
                max_phase=molecule.get("max_phase"),
                indication=None,
            )
        )
    return results


# ==================================================
# COMPOUND PROFILE
# ==================================================
@chembl_retry
async def get_compound_profile(chembl_id: str) -> CompoundProfile | None:
    """
    Fetch full details of a single compound by ChEMBL ID.
    Returns all physicochemical properties for the profile page.
    """
    response = await client.get(
        f"/molecule/{chembl_id}",
        params={"format": "json"},
    )

    if response.status_code == 404:
        return None

    response.raise_for_status()
    molecule = response.json()
    props = molecule.get("molecule_properties") or {}

    # Robust SMILES extraction — try multiple fields
    structures = molecule.get("molecule_structures") or {}
    smiles = (
        structures.get("canonical_smiles")
        or structures.get("molfile")
        or None
    )

    return CompoundProfile(
        chembl_id=molecule.get("molecule_chembl_id", ""),
        name=molecule.get("pref_name") or molecule.get("molecule_chembl_id", ""),
        molecular_formula=props.get("full_molecular_formula"),
        molecular_weight=float(props["full_mwt"]) if props.get("full_mwt") else None,
        logp=float(props["alogp"]) if props.get("alogp") else None,
        hbd=int(props["hbd"]) if props.get("hbd") else None,
        hba=int(props["hba"]) if props.get("hba") else None,
        tpsa=float(props["psa"]) if props.get("psa") else None,
        ro5_violations=int(props["num_ro5_violations"]) if props.get("num_ro5_violations") else None,
        smiles=smiles,
        max_phase=molecule.get("max_phase"),
        approval_status=get_approval_status(molecule.get("max_phase")),
    )


# ==================================================
# BIOACTIVITY DATA
# ==================================================
@chembl_retry
async def get_compound_activities(
    chembl_id: str, limit: int = 100
) -> BioactivityResponse:
    """
    Fetch all bioactivity measurements for a compound.
    Returns IC50, Ki, EC50 values across all targets.
    """
    response = await client.get(
        "/activity",
        params={
            "molecule_chembl_id": chembl_id,
            "limit": limit,
            "format": "json",
        },
    )
    response.raise_for_status()
    data = response.json()

    records = []
    for activity in data.get("activities", []):
        std_value = activity.get("standard_value")
        try:
            std_value = float(std_value) if std_value else None
        except (ValueError, TypeError):
            std_value = None

        pchembl = activity.get("pchembl_value")
        try:
            pchembl = float(pchembl) if pchembl else None
        except (ValueError, TypeError):
            pchembl = None

        records.append(
            BioactivityRecord(
                activity_id=activity.get("activity_id"),
                target_name=activity.get("target_pref_name"),
                target_chembl_id=activity.get("target_chembl_id"),
                assay_type=activity.get("assay_type"),
                standard_type=activity.get("standard_type"),
                standard_value=std_value,
                standard_units=activity.get("standard_units"),
                pchembl_value=pchembl,
                document_year=activity.get("document_year"),
            )
        )

    return BioactivityResponse(
        chembl_id=chembl_id,
        activities=records,
        total_count=data.get("page_meta", {}).get("total_count", len(records)),
    )


# ==================================================
# TARGET SEARCH
# ==================================================
@chembl_retry
async def search_targets(query: str, limit: int = 20) -> list[TargetSearchResult]:
    """
    Search ChEMBL for targets by protein name or gene symbol.
    Returns a list of matching targets.
    """
    response = await client.get(
        "/target",
        params={
            "pref_name__icontains": query,
            "limit": limit,
            "format": "json",
        },
    )
    response.raise_for_status()
    data = response.json()

    results = []
    for target in data.get("targets", []):
        gene_name = None
        components = target.get("target_components", [])
        if components:
            synonyms = components[0].get("target_component_synonyms", [])
            for syn in synonyms:
                if syn.get("syn_type") == "GENE_SYMBOL":
                    gene_name = syn.get("component_synonym")
                    break

        results.append(
            TargetSearchResult(
                target_chembl_id=target.get("target_chembl_id", ""),
                pref_name=target.get("pref_name", ""),
                target_type=target.get("target_type"),
                organism=target.get("organism"),
                gene_name=gene_name,
            )
        )
    return results


# ==================================================
# TARGET PROFILE
# ==================================================
@chembl_retry
async def get_target_profile(target_chembl_id: str) -> TargetProfile | None:
    """
    Fetch full details of a single target by ChEMBL target ID.
    """
    response = await client.get(
        f"/target/{target_chembl_id}",
        params={"format": "json"},
    )

    if response.status_code == 404:
        return None

    response.raise_for_status()
    target = response.json()

    uniprot_id = None
    gene_name = None
    components = target.get("target_components", [])
    if components:
        uniprot_id = components[0].get("accession")
        synonyms = components[0].get("target_component_synonyms", [])
        for syn in synonyms:
            if syn.get("syn_type") == "GENE_SYMBOL":
                gene_name = syn.get("component_synonym")
                break

    return TargetProfile(
        target_chembl_id=target.get("target_chembl_id", ""),
        pref_name=target.get("pref_name", ""),
        target_type=target.get("target_type"),
        organism=target.get("organism"),
        gene_name=gene_name,
        uniprot_id=uniprot_id,
        target_class=target.get("target_type"),
        description=None,
    )


# ==================================================
# TARGET LIGANDS
# ==================================================
@chembl_retry
async def get_target_ligands(
    target_chembl_id: str, limit: int = 50
) -> LigandsResponse:
    """
    Fetch all compounds (ligands) known to hit a specific target.
    """
    response = await client.get(
        "/activity",
        params={
            "target_chembl_id": target_chembl_id,
            "limit": limit,
            "format": "json",
        },
    )
    response.raise_for_status()
    data = response.json()

    ligands = []
    seen_ids = set()

    for activity in data.get("activities", []):
        chembl_id = activity.get("molecule_chembl_id")
        if not chembl_id or chembl_id in seen_ids:
            continue
        seen_ids.add(chembl_id)

        std_value = activity.get("standard_value")
        try:
            std_value = float(std_value) if std_value else None
        except (ValueError, TypeError):
            std_value = None

        pchembl = activity.get("pchembl_value")
        try:
            pchembl = float(pchembl) if pchembl else None
        except (ValueError, TypeError):
            pchembl = None

        ligands.append(
            LigandRecord(
                chembl_id=chembl_id,
                name=activity.get("molecule_pref_name"),
                standard_type=activity.get("standard_type"),
                standard_value=std_value,
                standard_units=activity.get("standard_units"),
                pchembl_value=pchembl,
            )
        )

    return LigandsResponse(
        target_chembl_id=target_chembl_id,
        ligands=ligands,
        total_count=len(ligands),
    )
