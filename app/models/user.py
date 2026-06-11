import uuid
from sqlalchemy import Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    saved_entities: Mapped[list["SavedEntity"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    comparisons: Mapped[list["Comparison"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
