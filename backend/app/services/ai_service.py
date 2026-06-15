import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.schemas.ai import AIExplainResponse, AICompareResponse
from app.services.cache_service import get_ai_cache, set_ai_cache

# Anthropic API endpoint
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

# Placeholder shown when AI is disabled and no cache exists
AI_DISABLED_MESSAGE = (
    "AI explanations are currently disabled. "
    "Enable them by setting AI_ENABLED=true in your environment settings."
)


# ==================================================
# HELPER — Build prompt based on question type
# ==================================================
def build_prompt(
    entity_type: str,
    entity_id: str,
    entity_name: str,
    question_type: str,
    context: dict | None = None,
) -> str:
    """
    Builds a focused prompt for Claude based on what type of
    explanation is being requested.

    context: optional dict with extra data to make explanation richer
             e.g. {"ic50_value": 50, "units": "nM", "target": "EGFR"}
    """
    ctx = context or {}

    if question_type == "mechanism":
        return f"""You are a medicinal chemistry expert explaining drug mechanisms 
to a non-expert audience.

Explain the mechanism of action of {entity_name} (ChEMBL ID: {entity_id})
in simple, clear English. Cover:
1. What biological target does it act on?
2. How does it interact with that target (inhibitor, agonist, antagonist)?
3. What disease or condition is it used for?
4. Why does blocking/activating that target help treat the disease?

Keep the explanation under 150 words. Use simple language — 
avoid jargon where possible. If you must use technical terms, briefly define them."""

    elif question_type == "ic50":
        ic50_value = ctx.get("ic50_value", "unknown")
        units = ctx.get("units", "nM")
        target = ctx.get("target", "the target")
        return f"""You are a pharmacology expert explaining bioactivity data 
to a non-expert audience.

A compound has an IC50 value of {ic50_value} {units} against {target}.

Explain in simple English:
1. What does IC50 mean in plain terms?
2. Is {ic50_value} {units} a strong, moderate, or weak activity?
3. What does this mean for whether this compound could become a drug?

Keep the explanation under 120 words. Be specific about the numbers."""

    elif question_type == "druglike":
        mw = ctx.get("molecular_weight", "unknown")
        logp = ctx.get("logp", "unknown")
        ro5 = ctx.get("ro5_violations", 0)
        return f"""You are a medicinal chemistry expert assessing drug-likeness.

A compound has these properties:
- Molecular Weight: {mw} Da
- LogP (lipophilicity): {logp}
- Lipinski Rule of 5 violations: {ro5}

Explain in simple English:
1. What does each property mean for drug development?
2. Is this compound drug-like based on Lipinski's Rule of 5?
3. What are the main concerns, if any?
4. Could these issues be fixed through chemical modification?

Keep the explanation under 150 words. Be specific about the numbers provided."""

    elif question_type == "disease_gene":
        gene_symbol = ctx.get("gene_symbol", entity_id)
        disease_name = ctx.get("disease_name", "the disease")
        score = ctx.get("score", "unknown")
        return f"""You are a genomics expert explaining gene-disease relationships 
to a non-expert audience.

The gene {gene_symbol} has an association score of {score} with {disease_name}.

Explain in simple English:
1. What does this gene normally do in the body?
2. How might mutations or dysregulation of this gene contribute to {disease_name}?
3. What does the association score of {score} tell us about the strength of evidence?
4. Is this gene a potential drug target for {disease_name}?

Keep the explanation under 150 words. Use simple language."""

    else:
        # Fallback for any unrecognised question type
        return f"""You are a drug discovery expert. 
Provide a brief, clear explanation about {entity_type} {entity_id} 
in the context of drug discovery. Keep it under 100 words."""


# ==================================================
# HELPER — Call Anthropic API directly via httpx
# ==================================================
async def call_claude(prompt: str) -> str:
    """
    Makes a direct HTTP call to the Anthropic messages API.
    Uses claude-haiku-4-5 model as configured in settings.
    Returns the text response from Claude.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 300,        # explanations are short — 300 tokens is enough
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                "system": (
                    "You are a helpful drug discovery assistant. "
                    "Always give clear, accurate, concise explanations. "
                    "Never hallucinate drug names or mechanisms. "
                    "If you are unsure, say so clearly."
                ),
            },
        )
        response.raise_for_status()
        data = response.json()

        # Extract text from response
        content_blocks = data.get("content", [])
        for block in content_blocks:
            if block.get("type") == "text":
                return block.get("text", "").strip()

        return "No explanation could be generated."


# ==================================================
# MAIN — Get AI Explanation
# ==================================================
async def get_explanation(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    entity_name: str = "",
    question_type: str = "mechanism",
    context: dict | None = None,
) -> AIExplainResponse:
    """
    The main function called by the AI router.
    Implements the full cache + feature flag logic we designed.

    Steps:
    1. Always check cache first
    2. If cache hit → return cached (regardless of AI_ENABLED)
    3. If cache miss + AI disabled → return placeholder
    4. If cache miss + AI enabled → call Haiku → cache → return
    """

    # ── Step 1: Always check cache first ──────────────────
    cached_explanation = await get_ai_cache(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        question_type=question_type,
    )

    # ── Step 2: Cache HIT → return immediately ─────────────
    if cached_explanation:
        return AIExplainResponse(
            entity_id=entity_id,
            question_type=question_type,
            explanation=cached_explanation,
            from_cache=True,
            ai_enabled=settings.ai_enabled,
        )

    # ── Step 3: Cache MISS + AI disabled → placeholder ─────
    if not settings.ai_enabled:
        return AIExplainResponse(
            entity_id=entity_id,
            question_type=question_type,
            explanation=AI_DISABLED_MESSAGE,
            from_cache=False,
            ai_enabled=False,
        )

    # ── Step 4: Cache MISS + AI enabled → call Haiku ───────
    try:
        prompt = build_prompt(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=context.get("entity_name", entity_id),
            question_type=question_type,
            context=context,
        )

        explanation = await call_claude(prompt)

        # Store in cache for future requests
        await set_ai_cache(
            db=db,
            entity_type=entity_type,
            entity_id=entity_id,
            question_type=question_type,
            explanation=explanation,
        )

        return AIExplainResponse(
            entity_id=entity_id,
            question_type=question_type,
            explanation=explanation,
            from_cache=False,
            ai_enabled=True,
        )

    except httpx.HTTPStatusError as e:
        # Handle API errors gracefully — don't crash the whole request
        error_msg = f"AI explanation temporarily unavailable (API error: {e.response.status_code})."
        return AIExplainResponse(
            entity_id=entity_id,
            question_type=question_type,
            explanation=error_msg,
            from_cache=False,
            ai_enabled=True,
        )

    except Exception as e:
        # Catch all other errors
        error_msg = "AI explanation temporarily unavailable. Please try again later."
        return AIExplainResponse(
            entity_id=entity_id,
            question_type=question_type,
            explanation=error_msg,
            from_cache=False,
            ai_enabled=True,
        )


# ==================================================
# COMPARISON NARRATIVE
# ==================================================
async def get_comparison_narrative(
    db: AsyncSession,
    chembl_ids: list[str],
    compounds_data: list[dict],
) -> AICompareResponse:
    """
    Generates a plain-English narrative comparing multiple compounds.
    Used on the Comparison page to summarise key differences.

    compounds_data: list of dicts with compound properties
    """
    # Build a combined cache key from all compound IDs
    combined_id = "_".join(sorted(chembl_ids))

    # Check cache first
    cached = await get_ai_cache(
        db=db,
        entity_type="comparison",
        entity_id=combined_id,
        question_type="comparison_narrative",
    )

    if cached:
        return AICompareResponse(
            explanation=cached,
            from_cache=True,
            ai_enabled=settings.ai_enabled,
        )

    # AI disabled and no cache
    if not settings.ai_enabled:
        return AICompareResponse(
            explanation=AI_DISABLED_MESSAGE,
            from_cache=False,
            ai_enabled=False,
        )

    # Build comparison prompt
    compounds_summary = "\n".join([
        f"- {c.get('name', c.get('chembl_id', 'Unknown'))}: "
        f"MW={c.get('molecular_weight', 'N/A')} Da, "
        f"LogP={c.get('logp', 'N/A')}, "
        f"HBD={c.get('hbd', 'N/A')}, "
        f"HBA={c.get('hba', 'N/A')}, "
        f"TPSA={c.get('tpsa', 'N/A')}, "
        f"Ro5 violations={c.get('ro5_violations', 'N/A')}, "
        f"Status={c.get('approval_status', 'N/A')}"
        for c in compounds_data
    ])

    prompt = f"""You are a medicinal chemistry expert comparing drug candidates.

Here are {len(chembl_ids)} compounds with their key physicochemical properties:

{compounds_summary}

Write a concise comparison (under 200 words) covering:
1. Which compound has the best drug-like properties and why?
2. What are the key differences between them?
3. Which would you prioritise for further development based on these properties alone?

Be specific about the numbers. Use simple language."""

    try:
        explanation = await call_claude(prompt)

        # Cache the comparison narrative
        await set_ai_cache(
            db=db,
            entity_type="comparison",
            entity_id=combined_id,
            question_type="comparison_narrative",
            explanation=explanation,
        )

        return AICompareResponse(
            explanation=explanation,
            from_cache=False,
            ai_enabled=True,
        )

    except Exception:
        return AICompareResponse(
            explanation="Comparison narrative temporarily unavailable. Please try again later.",
            from_cache=False,
            ai_enabled=True,
        )
