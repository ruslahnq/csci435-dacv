from typing import Optional

from pydantic import BaseModel, field_validator
from web3 import Web3


class IssueRequest(BaseModel):
    student_address: str
    student_name: str
    degree: str
    major: str
    graduation_year: int
    gpa: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("student_address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        if not Web3.is_address(value):
            raise ValueError("Invalid Ethereum address")
        return Web3.to_checksum_address(value)

    @field_validator("graduation_year")
    @classmethod
    def validate_year(cls, value: int) -> int:
        if not (1900 <= value <= 2100):
            raise ValueError("graduation_year must be between 1900 and 2100")
        return value


class RevokeRequest(BaseModel):
    token_id: int


class VerifyRequest(BaseModel):
    student_address: str
    token_id: int

    @field_validator("student_address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        if not Web3.is_address(value):
            raise ValueError("Invalid Ethereum address")
        return Web3.to_checksum_address(value)
