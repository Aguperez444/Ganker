import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from app.infrastructure.database.seed_data import seed_database

from app.domain.exceptions.domain_exception import DomainException
from app.infrastructure.config.settings import settings
from app.infrastructure.database.base import Base

import app.infrastructure.database.models

from app.infrastructure.database.unit_of_work.uow_factory import engine

from app.infrastructure.api.controllers.user_controller import router as player_router
from app.infrastructure.api.controllers.auth_controller import router as auth_router
from app.infrastructure.api.controllers.game_profile_controller import router as game_profile_router
from app.infrastructure.api.controllers.videogame_controller import router as videogame_router
from app.infrastructure.api.controllers.role_controller import router as role_router
from app.infrastructure.api.controllers.rank_controller import router as rank_router
from app.infrastructure.api.controllers.character_controller import router as character_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea tablas en Postgres (Docker) o SQLite (Local)
    Base.metadata.create_all(bind=engine)
    # 2. Poblar datos iniciales si las tablas están vacías
    with Session(engine) as session:
        seed_database(session)

    yield
    # Cierra adecuadamente el pool de conexiones de la aplicación
    engine.dispose()

app = FastAPI(title="Ganker", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SERVIR MEDIOS EN MODO LOCAL (Solo si NO estamos dentro de Docker)
# En Docker definimos UPLOAD_DIR=/app/media; en local esa variable no existe
IS_DOCKER = os.getenv("UPLOAD_DIR") is not None

if not IS_DOCKER:
    # Asegurar que la carpeta local exista antes de montarla para evitar errores
    settings.media_dir.mkdir(parents=True, exist_ok=True)

    # FastAPI atiende las peticiones a /media directamente desde la carpeta física
    app.mount("/media", StaticFiles(directory=str(settings.media_dir)), name="media")
    print(f"[*] Modo Local: FastAPI está sirviendo estáticos desde {settings.media_dir}")


# EXCEPTION HANDLERS
@app.exception_handler(DomainException)
async def domain_exception_handler(
    request: Request,
    exc: DomainException
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message
        }
    )

# ROUTERS
app.include_router(player_router)
app.include_router(game_profile_router)
app.include_router(auth_router)
app.include_router(videogame_router)
app.include_router(role_router)
app.include_router(rank_router)
app.include_router(character_router)


host = "127.0.0.1"
port = 8000

if __name__ == "__main__":
    print("Starting FastAPI server...")
    print(f"docs: http://{host}:{port}/docs")
    uvicorn.run("app.infrastructure.start.main:app", host=host, port=port,reload=True)