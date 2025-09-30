from pathlib import Path
from databases import db_dependency
from service.email_service import send_email

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

def load_templates(name: str, **kwargs) -> str:
    """Tải file HTML và thay biến {{var}}"""
    path = TEMPLATE_DIR / name
    html = path.read_text(encoding="utf-8")
    for k, v in kwargs.items():
        html = html.replace(f"{{{{{k}}}}}", str(v))
    return html

async def send_activation_email(db: db_dependency, to: str, username:str,activation_link:str):
    body = load_templates("activation.html", username=username, activation_link=activation_link)
    return await send_email(db, to, "JarVis AI - Kích hoạt tài khoản", body)
                            
async def send_password_reset_email(db: db_dependency, to: str, email: str, reset_link: str):
    body = load_templates("password_reset.html", email=email, reset_link=reset_link)
    return await send_email(db, to, "JarVis AI - Đặt lại mật khẩu", body)

async def send_otp_login_email(db: db_dependency, to: str, username: str, otp_code: str):
    body = load_templates("otp_login.html", username=username, otp_code=otp_code)
    return await send_email(db, to, "JarVis AI - Mã OTP đăng nhập", body)

async def send_otp_change_pass_email(db: db_dependency, to: str, username: str, otp_code: str):
    body = load_templates("otp_password.html", username=username, otp_code=otp_code)
    return await send_email(db, to, "JarVis AI - Mã OTP đổi mật khẩu", body)

async def send_violation_lock_email(db: db_dependency, to: str, username: str, duration: str):
    body = load_templates("violation_lock.html", username=username, duration=duration)
    return await send_email(db, to, "JarVis AI - Tài khoản bị tạm khóa do vi phạm", body)

async def send_user_lock_email(db: db_dependency, to: str, username: str, support_link: str):
    body = load_templates("user_lock.html", username=username, support_link=support_link)
    return await send_email(db, to, "JarVis AI - Thông báo tài khoản bị khóa", body) 