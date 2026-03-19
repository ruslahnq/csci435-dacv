from fastapi import APIRouter

from blockchain.client import get_web3
from core.config import CONTRACT_ADDRESS

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    web3 = get_web3()
    return {
        "status": "ok",
        "chain_id": web3.eth.chain_id,
        "connected": web3.is_connected(),
        "contract": CONTRACT_ADDRESS,
    }
