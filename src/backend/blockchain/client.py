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


def send_transaction(fn):
    web3 = get_web3()
    account = web3.eth.account.from_key(ISSUER_PRIVATE_KEY)
    nonce = web3.eth.get_transaction_count(account.address)

    tx = fn.build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gas": 300_000,
            "gasPrice": web3.eth.gas_price,
        }
    )

    signed = web3.eth.account.sign_transaction(tx, ISSUER_PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    if receipt.status != 1:
        raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")

    return tx_hash.hex(), receipt
