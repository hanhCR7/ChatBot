import datetime
import uuid
from fastapi import HTTPException, logger, status
from sqlalchemy.exc import SQLAlchemyError
from db_config import db_dependency
from models import ChatSession, ChatHistory, Image
from schemas import ChatSessionCreate, ChatSessionUpdate, ChatSessionOut, AddMessage, ChatHistoryOut, MessageOut, ImageCreate, ImageOut
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
    try:
        chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id).first()
        if not chat_session:
            return None
        messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).order_by(ChatHistory.created_at.asc()).all()
        chat_session_out = ChatSessionOut.from_orm(chat_session)
        messages_out = [MessageOut.from_orm(message) for message in messages]
        return ChatHistoryOut(chat_session=chat_session_out, messages=messages_out)
    except Exception as e:
        logger.error(f"Lỗi trong get_chat_history với chat_id={chat_id}: {e}", exc_info=True)
        raise

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
def save_messages_to_db(db: db_dependency, chat_id: uuid.UUID, role: str, content: str):
    message = ChatHistory(
        chat_id=chat_id,
        role=role,
        content=content,
        created_at=datetime.utcnow()
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def create_image(db, image: ImageCreate) -> ImageOut:
    db_image = Image(**image.model_dump())
    try:
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        return ImageOut.model_validate(db_image)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu ảnh: {str(e)}"
        )

def get_images_by_user(db, user_id: int) -> List[ImageOut]:
    images = (
        db.query(Image)
        .filter(Image.user_id == user_id)
        .order_by(Image.created_at.desc())
        .all()
    )
    return [ImageOut.model_validate(img) for img in images]

def update_image_description(db, image_id: int, user_id: int, new_description: str) -> ImageOut:
    img = db.query(Image).filter(Image.id == image_id, Image.user_id == user_id).first()
    if not img:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy ảnh hoặc không có quyền sửa"
        )
    img.description = new_description
    db.commit()
    db.refresh(img)
    return ImageOut.model_validate(img)

def delete_image(db, image_id: int, user_id: int) -> ImageOut:
    img = db.query(Image).filter(Image.id == image_id, Image.user_id == user_id).first()
    if not img:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy ảnh hoặc không có quyền xóa"
        )
    db.delete(img)
    db.commit()
    return ImageOut.model_validate(img)

def get_all_images(db) -> List[ImageOut]:
    images = db.query(Image).order_by(Image.created_at.desc()).all()
    return [ImageOut.model_validate(img) for img in images]
