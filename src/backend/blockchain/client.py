import json
from typing import Optional

from web3 import Web3

from core.config import (
    CONTRACT_ABI_PATH,
    CONTRACT_ADDRESS,
    ISSUER_PRIVATE_KEY,
    WEB3_PROVIDER_URL,
)

_w3: Optional[Web3] = None
_contract = None


def get_web3() -> Web3:
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))
        if not _w3.is_connected():
            raise RuntimeError(
                "Cannot connect to Ethereum node. Check WEB3_PROVIDER_URL."
            )
    return _w3


def get_contract():
    global _contract
    if _contract is None:
        web3 = get_web3()
        with open(CONTRACT_ABI_PATH, encoding="utf-8") as f:
            abi = json.load(f)
        _contract = web3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=abi,
        )
    return _contract


def build_metadata_hash(record: dict) -> str:
    canonical = json.dumps(record, sort_keys=True, ensure_ascii=True)
    raw = Web3.keccak(text=canonical)
    return raw.hex()
