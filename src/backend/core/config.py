import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/dacv"
)
WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
ISSUER_PRIVATE_KEY = os.getenv("ISSUER_PRIVATE_KEY", "")
CONTRACT_ABI_PATH = os.getenv("CONTRACT_ABI_PATH", "./abi/CredentialSBT.json")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
