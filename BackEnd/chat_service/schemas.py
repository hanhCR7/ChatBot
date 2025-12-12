from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ========== Chat Session ==========

class ChatSessionBase(BaseModel):
    user_id: int
    title: str = "New Chat"
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

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

    model_config = {
        "from_attributes": True
    }

# ========== Full Chat History ==========

class ChatHistoryOut(BaseModel):
    chat_session: ChatSessionOut
    messages: List[MessageOut]

class BannedKeywordOut(BaseModel):
    id: int
    keyword: str
    model_config = {
        "from_attributes": True
    }
class BannedKeywordCreate(BaseModel):
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

    model_config = {
        "from_attributes": True
    }

class ViolationStrikeOut(BaseModel):
    id: int
    user_id: int
    strike_count: int
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }
class ViolationStrikeCreate(BaseModel):
    user_id: int
    strike_count: int
    last_updated: Optional[datetime] = None

class ImageCreate(BaseModel):
    user_id: int
    url: str
    description: Optional[str] = None

class ImageOut(BaseModel):
    id: int
    user_id: int
    url: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
class UpdateImageDescription(BaseModel):
    description: str

class SessionSummary(BaseModel):
    chat_id: UUID
    title: str
    created_at: datetime
    message_count: int

class AllChatUsersOut(BaseModel):
    user_id: int
    username: Optional[str] = None
    email: Optional[str] = None
    sessions: List[SessionSummary]

class Pagination(BaseModel):
    total: int
    page: int
    limit: int

class AllChatUsersResponse(BaseModel):
    data: List[AllChatUsersOut]
    pagination: Pagination

class SessionWithMessageOut(BaseModel):
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    message: List[MessageOut]
    model_config = {
        "from_attributes": True
    }

class UserDetailOut(BaseModel):
    user_id: int
    username: Optional[str] = None
    email: Optional[str] = None
    sessions: List[SessionWithMessageOut]
    model_config = {
        "from_attributes": True
    }

