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
        orm_mode = True

class ChatSessionCreate(BaseModel):
    user_id: int
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
        orm_mode = True

# ========== Full Chat History ==========

class ChatHistoryOut(BaseModel):
    chat_session: ChatSessionOut
    messages: List[MessageOut]
