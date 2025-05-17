from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ========== Chat Session ==========

class ChatSessionBase(BaseModel):
    user_id: int
    title: str = "New Chat"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatSessionCreate(BaseModel):
    user_id: Optional[int] = None
    title: Optional[str] = "New Chat"

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None

class ChatSessionOut(ChatSessionBase):
    id: UUID

# ========== Chat Message ==========

class AddMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    chat_id: UUID
    timestamp: Optional[datetime] = None

class MessageOut(BaseModel):
    id: UUID
    chat_id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# ========== Full Chat History ==========

class ChatHistoryOut(BaseModel):
    chat_session: ChatSessionOut
    messages: List[MessageOut]

class BanedKeywordOut(BaseModel):
    id: int
    keyword: str
    class Config:
        from_attributes = True
class BanedKeywordCreate(BaseModel):
    keyword: str

class ViolationLogCreate(BaseModel):
    usser_id: int
    message: str
    level: int

class ViolationLogOut(BaseModel):
    id: int
    user_id: int
    message: str
    level: int
    created_at: datetime

    class Config:
        from_attributes = True

class ViolationStrikeOut(BaseModel):
    id: int
    user_id: int
    strike_count: int
    last_updated: datetime

    class Config:
        from_attributes = True
class ViolationStrikeCreate(BaseModel):
    user_id: int
    strike_count: int
    last_updated: Optional[datetime] = None
