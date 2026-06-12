# Drug Discovery Dashboard

An interactive data visualization platform that makes **ChEMBL** and **Open Targets** data accessible to non-experts. Search for drugs, gene targets, or diseases and instantly see bioactivity charts, compound structures, gene-disease association scores, and AI-generated plain-English explanations.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [External APIs](#external-apis)
- [Key Design Decisions](#key-design-decisions)
- [Known Issues & Fixes](#known-issues--fixes)
- [Roadmap](#roadmap)

---

## Overview

Drug Discovery Dashboard bridges the gap between raw cheminformatics databases and actionable drug discovery insight. It integrates two major open-access databases:

- **ChEMBL** — bioactive molecules, drug targets, and quantitative activity measurements
- **Open Targets** — gene-disease associations with multi-evidence scoring

An AI layer powered by **Claude Haiku** provides plain-English explanations of molecular data, making complex pharmacological information accessible to non-experts.

---

## Features

### Multi-Mode Search
- Search by compound name or ChEMBL ID
- Search by gene/target name or UniProt ID
- Search by disease name or EFO ID
- Unified search across all three entity types simultaneously

### Compound Profile
- 2D molecular structure rendering (SVG)
- Physicochemical properties — MW, LogP, HBD, HBA, TPSA
- Lipinski Rule of 5 compliance check
- Bioactivity data — IC50, Ki, EC50 values across all targets
- Approval status — Approved / Clinical / Preclinical

### Target Profile
- Protein metadata — gene symbol, UniProt ID, target class
- Known ligands with activity values
- Disease associations from Open Targets
- Selectivity data across target family

### Disease Profile
- EFO ID, description, synonyms, ontology hierarchy
- Associated genes ranked by Open Targets association score
- Evidence breakdown — genetic, somatic, drug, pathway, text mining
- Drug pipeline — approved, clinical, preclinical drugs

### AI Explanations Layer
- Plain-English explanation of IC50 values
- Drug mechanism of action summaries
- Drug-likeness assessment
- Gene-disease relationship explanations
- Feature flag — enable/disable without code changes
- Cache-first logic — serves cached explanations even when AI is disabled

### Comparison View
- Side-by-side comparison of up to 4 compounds
- Physicochemical property comparison
- AI-generated comparison narrative

### Workspace
- Save compounds, targets, and diseases
- Personal notes per entity
- Export workspace as CSV

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL (Docker) |
| ORM | SQLAlchemy 2.0 (async) |
| HTTP Client | httpx (async) |
| AI | Anthropic Claude Haiku (claude-haiku-4-5-20251001) |
| Data Validation | Pydantic v2 |
| Frontend (planned) | React + Recharts + D3.js |

---

## Project Structure

```
drug_discovery/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Settings & env vars
│   ├── database.py              # DB engine, session, Base
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── saved_entity.py
│   │   ├── comparison.py
│   │   ├── ai_cache.py
│   │   ├── api_cache.py
│   │   └── search_history.py
│   │
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── compound.py
│   │   ├── target.py
│   │   ├── disease.py
│   │   ├── workspace.py
│   │   ├── comparison.py
│   │   └── ai.py
│   │
│   ├── routers/                 # Thin FastAPI routers
│   │   ├── search.py
│   │   ├── compounds.py
│   │   ├── targets.py
│   │   ├── diseases.py
│   │   ├── ai.py
│   │   ├── workspace.py
│   │   └── comparison.py
│   │
│   └── services/                # All business logic
│       ├── chembl_service.py
│       ├── opentargets_service.py
│       ├── ai_service.py
│       ├── cache_service.py
│       ├── workspace_service.py
│       └── comparison_service.py
│
├── .env                         # Environment variables (never commit)
├── .env.example                 # Template for environment variables
├── requirements.txt
└── README.md
```

---

## Prerequisites

- Python 3.11
- Docker Desktop (for PostgreSQL)
- pgAdmin (for database management)
- Anthropic API key (optional — for AI explanations)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/drug-discovery-dashboard.git
cd drug-discovery-dashboard
```

### 2. Create and activate virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables)).

### 5. Start PostgreSQL in Docker

```bash
docker run --name drug_discovery_db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=drug_discovery \
  -p 5432:5432 \
  -d postgres:16
```

### 6. Run database migrations

Connect to your database in pgAdmin and run the SQL from the [Database Setup](#database-setup) section.

### 7. Insert test user (for development)

```sql
INSERT INTO users (id, email, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@test.com',
  'Dev User',
  NOW()
);
```

### 8. Start the server

```bash
python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/drug_discovery

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# AI Feature Flag — set to false to disable AI calls (cache still works)
AI_ENABLED=true

# App Settings
APP_ENV=development
APP_SECRET_KEY=your_generated_secret_key_here
```

Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Database Setup

Run this SQL in pgAdmin to create all required tables:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Entities (workspace)
CREATE TABLE saved_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('compound', 'target', 'disease')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- Comparison Sessions
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT DEFAULT 'compound',
  entity_ids TEXT[] NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Explanation Cache (7-day TTL)
CREATE TABLE ai_explanation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  explanation TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- API Response Cache (24-hour TTL)
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  response_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Search History (for trending searches)
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_term TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN ('compound', 'target', 'disease', 'unified')),
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_entities_user ON saved_entities(user_id);
CREATE INDEX idx_saved_entities_type ON saved_entities(entity_type, entity_id);
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_search_history_term ON search_history(search_term);
```

---

## Running the Application

```bash
# Development with auto-reload
python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Documentation

Once running, visit:

- **Swagger UI** — `http://localhost:8000/docs`
- **ReDoc** — `http://localhost:8000/redoc`
- **Health Check** — `http://localhost:8000/health`

---

## API Endpoints

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/unified?q=` | Search compounds, targets, diseases |
| GET | `/api/search/compounds?q=` | Search compounds only |
| GET | `/api/search/targets?q=` | Search targets only |
| GET | `/api/search/diseases?q=` | Search diseases only |
| GET | `/api/search/trending` | Get trending searches this week |

### Compounds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compounds/{chembl_id}` | Full compound profile |
| GET | `/api/compounds/{chembl_id}/activities` | Bioactivity data |
| GET | `/api/compounds/{chembl_id}/targets` | Known targets |
| GET | `/api/compounds/{chembl_id}/structure` | 2D structure SVG |

### Targets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/targets/{chembl_id}` | Full target profile |
| GET | `/api/targets/{chembl_id}/ligands` | Known compounds |
| GET | `/api/targets/{chembl_id}/selectivity` | Selectivity data |
| GET | `/api/targets/{ensembl_id}/diseases` | Disease associations |
| GET | `/api/targets/{ensembl_id}/evidence` | Open Targets evidence |

### Diseases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/diseases/{efo_id}` | Full disease profile |
| GET | `/api/diseases/{efo_id}/genes` | Associated genes ranked |
| GET | `/api/diseases/{efo_id}/drugs` | Drug pipeline |
| GET | `/api/diseases/{efo_id}/evidence-heatmap` | Evidence matrix data |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/explain` | Get AI explanation |
| POST | `/api/ai/compare` | Get comparison narrative |
| GET | `/api/ai/status` | Check AI feature flag |
| DELETE | `/api/ai/cache` | Clear expired cache |

### Workspace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspace` | Get full workspace |
| POST | `/api/workspace` | Save entity |
| PUT | `/api/workspace/{id}` | Update notes |
| DELETE | `/api/workspace/{id}` | Delete entity |
| GET | `/api/workspace/export` | Export as CSV |

### Comparison
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comparison` | Create comparison |
| GET | `/api/comparison` | Get all comparisons |
| GET | `/api/comparison/{id}` | Get comparison by ID |

---

## External APIs

| API | Base URL | Auth | Notes |
|-----|----------|------|-------|
| ChEMBL REST | `https://www.ebi.ac.uk/chembl/api/data/` | None | 20 req/s limit |
| ChEMBL Structure | `https://www.ebi.ac.uk/chembl/api/utils/smiles2svg` | None | POST request |
| Open Targets GraphQL | `https://api.platform.opentargets.org/api/v4/graphql` | None | Fair use |
| Anthropic Claude | `https://api.anthropic.com/v1/messages` | API Key | Haiku model |

### Useful Test IDs

| Entity | ID |
|--------|----|
| Imatinib (compound) | `CHEMBL941` |
| Dasatinib (compound) | `CHEMBL1421` |
| EGFR (ChEMBL target) | `CHEMBL203` |
| EGFR (Ensembl gene) | `ENSG00000146648` |
| Lung Cancer (disease) | `EFO_0001071` |
| Melanoma (disease) | `EFO_0000389` |

---

## Key Design Decisions

### Service Architecture
Routers are kept thin — they only handle HTTP concerns (request parsing, response formatting, status codes). All business logic lives in the service layer. This makes the codebase easy to test and maintain.

### Caching Strategy
Two-level cache stored in PostgreSQL:
- **API Cache** — 24-hour TTL for ChEMBL and Open Targets responses
- **AI Cache** — 7-day TTL for Claude explanations

Cache-first logic: always check cache before calling external APIs. This minimises latency, reduces costs, and protects against rate limits.

### AI Feature Flag
The `AI_ENABLED` environment variable controls AI calls:
- `AI_ENABLED=true` — cache hit returns cached, cache miss calls Haiku
- `AI_ENABLED=false` — cache hit still returns cached, cache miss returns placeholder

This allows cost control and safe deployment without touching code.

### Async Throughout
The entire stack is async — FastAPI, SQLAlchemy, httpx. This means the server never blocks waiting for slow external API calls and can handle many concurrent requests efficiently.

---

## Known Issues & Fixes

### Open Targets API Breaking Changes
The Open Targets GraphQL API has changed several field names. The following have been updated in this codebase:

| Old Field | New Field |
|-----------|-----------|
| `knownDrugs` | `drugAndClinicalCandidates` |
| `maximumClinicalTrialPhase` | `maximumClinicalStage` |
| `synonyms` (string) | `synonyms { terms relation }` |

### ChEMBL Structure Endpoint
The structure rendering endpoint changed from GET to POST. The correct usage is:
```python
httpx.post(
    "https://www.ebi.ac.uk/chembl/api/utils/smiles2svg",
    json={"smiles": smiles}
)
```

### SQLAlchemy Timezone
All datetime columns must use `DateTime(timezone=True)` in SQLAlchemy models and `TIMESTAMPTZ` in PostgreSQL. Using `TIMESTAMP WITHOUT TIME ZONE` causes errors with Python's timezone-aware datetimes.

---

## Roadmap

### Phase 1 — Compound Search & Profile ✅
- FastAPI backend setup
- ChEMBL REST API integration
- Compound search and profile endpoints
- API response caching

### Phase 2 — Target & Disease Profiles ✅
- Open Targets GraphQL API integration
- Target profile endpoints
- Disease profile endpoints
- Unified search

### Phase 3 — AI Explanations ✅
- Claude Haiku integration
- AI feature flag
- Cache-first AI logic
- 4 question types — mechanism, ic50, druglike, disease_gene

### Phase 4 — Comparison & Workspace ✅
- Workspace save/delete/export
- Multi-compound comparison
- AI comparison narrative

### Phase 5 — React Frontend ⏳
- Next.js + Tailwind CSS setup
- Compound profile page with Recharts
- Target and Disease profile pages
- D3.js evidence heatmap
- Comparison radar chart
- Mobile responsive layout

---

## License

MIT License — free to use for academic and portfolio purposes.

---

## Acknowledgements

- [ChEMBL Database](https://www.ebi.ac.uk/chembl/) — EMBL-EBI
- [Open Targets Platform](https://platform.opentargets.org/) — Open Targets Consortium
- [Anthropic Claude](https://www.anthropic.com/) — AI explanations layer