from sqlalchemy import Column, String, Boolean, JSON
from db.database import Base #

class User(Base):
    __tablename__ = "user"
    username = Column(String(100), primary_key=True, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    profile = Column(JSON, nullable=True)
