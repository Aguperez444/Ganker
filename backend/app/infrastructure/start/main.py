from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

from fastapi.middleware.cors import CORSMiddleware

from app.domain.exceptions.domain_exception import DomainException

from app.infrastructure.api.controllers.player_controller import router as player_router

app = FastAPI(title="Ganker", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTERS
app.include_router(player_router)


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


if __name__ == "__main__":
    uvicorn.run("app.infrastructure.start.main:app", host="127.0.0.1", port=8000,reload=True)