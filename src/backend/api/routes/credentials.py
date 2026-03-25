from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3

from blockchain.client import (
    build_metadata_hash,
    get_contract,
    send_transaction,
)
from core.config import API_BASE_URL
from db.database import get_db
from db.models import CredentialRecord
from schemas.credentials import IssueRequest, RevokeRequest

router = APIRouter(prefix="/credentials", tags=["credentials"])


@router.post("/issue")
async def issue_credential(req: IssueRequest, db: AsyncSession = Depends(get_db)):
    record = CredentialRecord(
        student_address=req.student_address,
        student_name=req.student_name,
        degree=req.degree,
        major=req.major,
        graduation_year=req.graduation_year,
        gpa=req.gpa,
        notes=req.notes,
    )
    db.add(record)
    await db.flush()

    metadata_uri = f"{API_BASE_URL}/credentials/{record.id}/metadata"

    metadata_blob = {
        "db_id": record.id,
        "student_address": req.student_address,
        "student_name": req.student_name,
        "degree": req.degree,
        "major": req.major,
        "graduation_year": req.graduation_year,
        "gpa": req.gpa,
        "notes": req.notes,
    }
    metadata_hash_hex = build_metadata_hash(metadata_blob)
    if not metadata_hash_hex.startswith("0x"):
        metadata_hash_hex = "0x" + metadata_hash_hex
    if len(metadata_hash_hex) != 66:
        raise HTTPException(status_code=500, detail="Invalid metadata hash length")

    record.metadata_hash = metadata_hash_hex

    try:
        contract = get_contract()
        fn = contract.functions.issueCredential(
            req.student_address,
            metadata_uri,
            metadata_hash_hex,
        )
        tx_hash, receipt = send_transaction(fn)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=502, detail=f"Contract call failed: {exc}")

    try:
        logs = contract.events.CredentialIssued().process_receipt(receipt)
        token_id = logs[0]["args"]["tokenId"]
    except Exception:
        token_id = None

    record.token_id = token_id
    record.tx_hash = tx_hash
    await db.commit()

    return {
        "success": True,
        "db_id": record.id,
        "token_id": token_id,
        "tx_hash": tx_hash,
        "metadata_uri": metadata_uri,
        "metadata_hash": metadata_hash_hex,
    }


@router.post("/revoke")
async def revoke_credential(req: RevokeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM credentials WHERE token_id = :tid"),
        {"tid": req.token_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Credential not found in database")
    if row["is_revoked"]:
        raise HTTPException(status_code=400, detail="Credential is already revoked")

    try:
        contract = get_contract()
        fn = contract.functions.revokeCredential(req.token_id)
        tx_hash, _ = send_transaction(fn)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Contract call failed: {exc}")

    await db.execute(
        text(
            """
            UPDATE credentials
            SET is_revoked = TRUE, revoked_at = :now
            WHERE token_id = :tid
            """
        ),
        {"now": datetime.now(timezone.utc), "tid": req.token_id},
    )
    await db.commit()

    return {
        "success": True,
        "token_id": req.token_id,
        "tx_hash": tx_hash,
    }


@router.get("/verify")
async def verify_credential(
    student_address: str,
    token_id: int,
    db: AsyncSession = Depends(get_db),
):
    if not Web3.is_address(student_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    student_address = Web3.to_checksum_address(student_address)

    try:
        contract = get_contract()
        valid, revoked, uri, on_chain_hash = contract.functions.verifyCredential(
            student_address, token_id
        ).call()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Contract call failed: {exc}")

    on_chain_hash_hex = "0x" + on_chain_hash.hex()

    result = await db.execute(
        text("SELECT * FROM credentials WHERE token_id = :tid"),
        {"tid": token_id},
    )
    row = result.mappings().first()

    metadata = None
    hash_match = False

    if row:
        metadata = {
            "student_name": row["student_name"],
            "degree": row["degree"],
            "major": row["major"],
            "graduation_year": row["graduation_year"],
            "issued_at": row["created_at"].isoformat() if row["created_at"] else None,
            "revoked_at": row["revoked_at"].isoformat() if row["revoked_at"] else None,
        }
        hash_match = row["metadata_hash"] == on_chain_hash_hex

    return {
        "valid": valid,
        "revoked": revoked,
        "on_chain_hash": on_chain_hash_hex,
        "metadata_uri": uri,
        "hash_match": hash_match,
        "metadata": metadata,
        "student_address": student_address,
        "token_id": token_id,
    }


@router.get("/{db_id}/metadata")
async def get_metadata(db_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM credentials WHERE id = :id"),
        {"id": db_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Credential not found")

    return {
        "db_id": row["id"],
        "token_id": row["token_id"],
        "student_name": row["student_name"],
        "degree": row["degree"],
        "major": row["major"],
        "graduation_year": row["graduation_year"],
        "gpa": row["gpa"],
        "metadata_hash": row["metadata_hash"],
        "is_revoked": row["is_revoked"],
        "issued_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


@router.get("/student/{address}")
async def get_student_credentials(address: str, db: AsyncSession = Depends(get_db)):
    if not Web3.is_address(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    address = Web3.to_checksum_address(address)

    result = await db.execute(
        text(
            "SELECT * FROM credentials WHERE student_address = :addr ORDER BY created_at DESC"
        ),
        {"addr": address},
    )
    rows = result.mappings().all()

    return [
        {
            "db_id": row["id"],
            "token_id": row["token_id"],
            "student_name": row["student_name"],
            "degree": row["degree"],
            "major": row["major"],
            "graduation_year": row["graduation_year"],
            "gpa": row["gpa"],
            "is_revoked": row["is_revoked"],
            "tx_hash": row["tx_hash"],
            "issued_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]


@router.get("")
async def list_credentials(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            "SELECT * FROM credentials ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        ),
        {"lim": limit, "off": offset},
    )
    rows = result.mappings().all()

    return [
        {
            "db_id": row["id"],
            "token_id": row["token_id"],
            "student_address": row["student_address"],
            "student_name": row["student_name"],
            "degree": row["degree"],
            "major": row["major"],
            "graduation_year": row["graduation_year"],
            "is_revoked": row["is_revoked"],
            "tx_hash": row["tx_hash"],
            "issued_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]
