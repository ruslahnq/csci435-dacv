from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class CredentialRecord(Base):
    """Off-chain metadata for a credential. PII lives here, not on-chain."""

    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    token_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, nullable=True)
    student_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    degree: Mapped[str] = mapped_column(String(255), nullable=False)
    major: Mapped[str] = mapped_column(String(255), nullable=False)
    graduation_year: Mapped[int] = mapped_column(Integer, nullable=False)
    gpa: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    metadata_hash: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    tx_hash: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
