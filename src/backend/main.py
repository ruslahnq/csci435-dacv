from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.credentials import router as credentials_router
from api.routes.health import router as health_router
from db.database import init_db

app = FastAPI(title="DACV API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await init_db()


app.include_router(health_router)
app.include_router(credentials_router)
