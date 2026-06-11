from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# Import all routers
from app.routers import (
    search,
    compounds,
    targets,
    diseases,
    ai,
    workspace,
    comparison,
)


# --------------------------------------------------
# Lifespan — runs on startup and shutdown
# --------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP — runs before the app accepts any requests
    print("🚀 Starting Drug Discovery Dashboard API...")
    print(f"   Environment : {settings.app_env}")
    print(f"   AI Enabled  : {settings.ai_enabled}")
    print(f"   AI Model    : {settings.anthropic_model}")

    # Create any missing tables (safety net — your tables already exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database connection established")
    print("✅ API is ready at http://localhost:8000")
    print("📖 Swagger docs at http://localhost:8000/docs")

    yield  # app runs here — everything above is startup, below is shutdown

    # SHUTDOWN — runs when you stop the server
    print("🛑 Shutting down — closing database connections...")
    await engine.dispose()
    print("✅ Shutdown complete")


# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(
    title="Drug Discovery Dashboard API",
    description="Backend API for exploring ChEMBL and Open Targets data with AI explanations",
    version="1.0.0",
    docs_url="/docs",           # Swagger UI at /docs
    redoc_url="/redoc",         # ReDoc UI at /redoc
    lifespan=lifespan,
)


# --------------------------------------------------
# CORS Middleware
# --------------------------------------------------
# Allows your React frontend to talk to this backend
origins = [
    "http://localhost:3000",    # React dev server
    "http://localhost:5173",    # Vite dev server (if you use Vite)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# In production you would replace above with your actual domain
if settings.app_env == "production":
    origins = ["https://your-production-domain.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE etc.
    allow_headers=["*"],        # Authorization, Content-Type etc.
)


# --------------------------------------------------
# Register all routers
# --------------------------------------------------
# Each router handles a group of related endpoints
# All endpoints are prefixed with /api

app.include_router(search.router,     prefix="/api/search",     tags=["Search"])
app.include_router(compounds.router,  prefix="/api/compounds",  tags=["Compounds"])
app.include_router(targets.router,    prefix="/api/targets",    tags=["Targets"])
app.include_router(diseases.router,   prefix="/api/diseases",   tags=["Diseases"])
app.include_router(ai.router,         prefix="/api/ai",         tags=["AI"])
app.include_router(workspace.router,  prefix="/api/workspace",  tags=["Workspace"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["Comparison"])


# --------------------------------------------------
# Root health check endpoint
# --------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "message": "Drug Discovery Dashboard API is running",
        "environment": settings.app_env,
        "ai_enabled": settings.ai_enabled,
        "docs": "http://localhost:8000/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_enabled": settings.ai_enabled,
        "model": settings.anthropic_model if settings.ai_enabled else "disabled",
    }
