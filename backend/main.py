from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import battles, creatures

app = FastAPI(
    title = "CreatureDex API",
    version = "1.0.0",
    description = "Photograph wildlife, build your collection, battle other trainers"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(creatures.router)
app.include_router(battles.router)

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}