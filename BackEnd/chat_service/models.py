from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from db_config import Base
import datetime

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False, default="New Chat")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    chat_history = relationship("ChatHistory", back_populates="chat_session", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    chat_session = relationship("ChatSession", back_populates="chat_history")

class BannedKeywords(Base):
    __tablename__ = 'baned_keywords'
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, nullable=False)

class ViolationLog(Base):
    __tablename__ = 'violation_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
    level = Column(Integer, default=1)  # Mức độ vi phạm
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
class ViolationStrike(Base):
    __tablename__ = 'violation_strikes'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)
    strike_count = Column(Integer, default=1)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class Image(Base):
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
