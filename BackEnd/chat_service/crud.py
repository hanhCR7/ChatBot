import uuid
from db_config import db_dependency
from models import ChatSession, ChatHistory
from schemas import ChatSessionCreate, ChatSessionUpdate, ChatSessionOut, AddMessage, ChatHistoryOut, MessageOut
from typing import List

# tạo mới một phiên chat mới
def create_chat_session(db: db_dependency, chat_session: ChatSessionCreate) -> ChatSessionOut:
    db_chat_session = ChatSession(id=uuid.uuid4(), user_id=chat_session.user_id, title=chat_session.title)
    db.add(db_chat_session)
    db.commit()
    db.refresh(db_chat_session)
    return ChatSessionOut.from_orm(db_chat_session)
# Hàm để thêm tin nhắn vào phiên chat
def add_message_to_chat(db: db_dependency, message_data: AddMessage) -> MessageOut:
    db_message = ChatHistory(
        id=uuid.uuid4(), 
        chat_id=message_data.chat_id, 
        role=message_data.role, 
        content=message_data.content,
        created_at=message_data.timestamp if message_data.timestamp else None
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return MessageOut.from_orm(db_message)
# Hàm để lấy tất cả các phiên chat của người dùng
def get_chat_sessions(db: db_dependency, user_id: int) -> List[ChatSessionOut]:
    chat_sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).all()
    return [ChatSessionOut.from_orm(chat_session) for chat_session in chat_sessions]
# Hàm để lấy tất cả các tin nhắn trong một phiên chat
def get_chat_history(db: db_dependency, chat_id: uuid.UUID) -> ChatHistoryOut:
    chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id).first()
    if not chat_session:
        return None
    messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).order_by(ChatHistory.created_at.asc()).all()
    return ChatHistoryOut(chat_session=ChatSessionOut.from_orm(chat_session), messages=[MessageOut.from_orm(message) for message in messages])
# Hàm để cập nhật tiêu đề của một phiên chat
def update_chat_session(db: db_dependency, chat_id: uuid.UUID, chat_session_update: ChatSessionUpdate) -> ChatSessionOut:
    db_chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id).first()
    if not db_chat_session:
        return None
    if chat_session_update.title:
        db_chat_session.title = chat_session_update.title
    db.commit()
    db.refresh(db_chat_session)
    return ChatSessionOut.from_orm(db_chat_session)
# Hàm để xóa một phiên chat
def delete_chat_session(db: db_dependency, chat_id: uuid.UUID) -> bool:
    db_chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id).first()
    if not db_chat_session:
        return False
    db.delete(db_chat_session)
    db.commit()
    return True
# Hàm để xóa một tin nhắn trong một phiên chat
def delete_message(db: db_dependency, message_id: uuid.UUID) -> bool:
    db_message = db.query(ChatHistory).filter(ChatHistory.id == message_id).first()
    if not db_message:
        return False
    db.delete(db_message)
    db.commit()
    return True
# Hàm để xóa tất cả các tin nhắn trong một phiên chat
def delete_all_messages(db: db_dependency, chat_id: uuid.UUID) -> bool:
    db_messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).all()
    if not db_messages:
        return False
    for message in db_messages:
        db.delete(message)
    db.commit()
    return True

