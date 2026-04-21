from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.credentials import router as credentials_router
from api.routes.health import router as health_router
import merkle
import zkp_service
from core.config import CONTRACT_ADDRESS
from db.database import get_db
from db.database import init_db

app = FastAPI(title="DACV API", version="1.0.0")


class GpaProofRequest(BaseModel):
    token_id: int
    threshold: int


class TokenProofRequest(BaseModel):
    token_id: int


zkp_router = APIRouter(prefix="/zkp", tags=["zkp"])


async def _get_credential_row(token_id: int, db: AsyncSession):
    result = await db.execute(
        text("SELECT * FROM credentials WHERE token_id = :tid"),
        {"tid": token_id},
    )
    return result.mappings().first()


def _ensure_active_credential(row) -> None:
    if not row:
        raise HTTPException(status_code=404, detail="Credential not found in database")
    if row["is_revoked"]:
        raise HTTPException(status_code=400, detail="Credential is already revoked")


def _credential_hash(metadata_hash: str | None) -> int:
    if not metadata_hash:
        raise HTTPException(
            status_code=400, detail="Credential metadata hash is missing"
        )
    return int(metadata_hash, 16) % (2**254)


def _format_solidity_proof(proof: dict) -> dict:
    p_a, p_b, p_c = zkp_service.format_proof_for_solidity(proof)
    return {
        "pA": list(p_a),
        "pB": [list(p_b[0]), list(p_b[1])],
        "pC": list(p_c),
    }


@zkp_router.post("/prove/gpa")
async def prove_gpa(req: GpaProofRequest, db: AsyncSession = Depends(get_db)):
    row = await _get_credential_row(req.token_id, db)
    _ensure_active_credential(row)

    if row["gpa"] is None:
        raise HTTPException(status_code=400, detail="Credential GPA is missing")

    try:
        gpa_value = float(str(row["gpa"]))
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="Credential GPA is invalid"
        ) from exc

    gpa_int = int(round(gpa_value * 100))
    credential_hash = _credential_hash(row["metadata_hash"])

    result = zkp_service.generate_proof(
        "gpa",
        {
            "gpa": gpa_int,
            "threshold": req.threshold,
            "credentialHash": credential_hash,
        },
    )

    return {
        "proof": _format_solidity_proof(result["proof"]),
        "publicSignals": result["publicSignals"],
        "threshold": req.threshold,
    }


@zkp_router.post("/prove/degree")
async def prove_degree(req: TokenProofRequest, db: AsyncSession = Depends(get_db)):
    row = await _get_credential_row(req.token_id, db)
    _ensure_active_credential(row)

    degree_int = merkle.DEGREE_ENCODING.get(row["degree"])
    if degree_int is None or degree_int not in merkle.GRADUATE_DEGREE_SET:
        raise HTTPException(
            status_code=400, detail="Degree is not in the approved graduate set"
        )

    proof_data = merkle.get_merkle_proof(degree_int, merkle.DEGREE_TREE)
    credential_hash = _credential_hash(row["metadata_hash"])

    result = zkp_service.generate_proof(
        "degree",
        {
            "degree": degree_int,
            "pathElements": proof_data["pathElements"],
            "pathIndices": proof_data["pathIndices"],
            "root": proof_data["root"],
            "credentialHash": credential_hash,
        },
    )

    return {
        "proof": _format_solidity_proof(result["proof"]),
        "publicSignals": result["publicSignals"],
        "root": proof_data["root"],
    }


@zkp_router.post("/prove/existence")
async def prove_existence(req: TokenProofRequest, db: AsyncSession = Depends(get_db)):
    row = await _get_credential_row(req.token_id, db)
    _ensure_active_credential(row)

    if not row["zkp_secret"]:
        raise HTTPException(
            status_code=400, detail="No ZKP secret found for this credential"
        )

    secret = int(str(row["zkp_secret"]), 16) % (2**254)
    nullifier = merkle.poseidon_pair(secret, req.token_id)
    contract_address = int(CONTRACT_ADDRESS, 16)

    result = zkp_service.generate_proof(
        "existence",
        {
            "secret": secret,
            "tokenId": req.token_id,
            "nullifier": nullifier,
            "contractAddress": contract_address,
        },
    )

    return {
        "proof": _format_solidity_proof(result["proof"]),
        "publicSignals": result["publicSignals"],
        "nullifier": nullifier,
    }


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
app.include_router(zkp_router)
