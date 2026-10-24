from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User

class Announcement(Base):
    __tablename__ = "tbl_announcement"

    announcement_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    date_posted: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    attachment_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("tbl_users.user_id", ondelete="CASCADE"), nullable=False)

    creator: Mapped[Optional["User"]] = relationship(
        "User",
        primaryjoin="Announcement.created_by == User.user_id"
    )