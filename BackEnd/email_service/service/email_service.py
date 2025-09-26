import aiosmtplib
import asyncio
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from models import EmailLogs
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_FROM = os.getenv("SMTP_FROM")

async def send_email(db: Session, recipient: str, subject: str, body: str):
    """Gửi email bất đồng bộ - tạo SMTP client mỗi lần để tránh lỗi kết nối"""
    msg = MIMEMultipart()
    msg["From"] = SMTP_FROM
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    status = "Unknown"
    try:
        smtp_client = aiosmtplib.SMTP(
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            start_tls=False,
            timeout=15  # Giới hạn mỗi lần gửi
        )
        await smtp_client.connect()
        await smtp_client.login(SMTP_USERNAME, SMTP_PASSWORD)
        await smtp_client.send_message(msg)
        status = "Success"
    except aiosmtplib.errors.SMTPServerDisconnected:
        status = "Lỗi: Server bị ngắt kết nối"
    except asyncio.TimeoutError:
        status = "Lỗi: Timeout khi gửi email"
    except aiosmtplib.SMTPException as e:
        status = f"Lỗi SMTP: {str(e)}"
    except Exception as e:
        status = f"Lỗi khác: {str(e)}"
    finally:
        try:
            await smtp_client.quit()
        except:
            pass

    # Lưu log
    email_log = EmailLogs(
        recipient=recipient,
        subject=subject,
        body=body,
        status=status,
        created_at=datetime.utcnow()
    )
    db.add(email_log)
    db.commit()

    print(f"[EMAIL] Sent to: {recipient} | Status: {status}")
    if status != "Success":
        raise Exception(status)  # raise lỗi để tầng gọi xử lý đúng
    return True

