from pydantic import BaseModel, EmailStr
from typing import Literal

class EmailRequest(BaseModel):
    recipient: EmailStr
    subject: str
    body: str

class EmailResponse(BaseModel):
    status: str
    message: str

class ActivationEmailRequest(BaseModel):
    username: str
    recipient: EmailStr
    activation_token: str
class OTPRequest(BaseModel):
    user_id: int
    email: EmailStr
    otp_type: Literal["login", "change_password"]
class VerifyOTPRequest(BaseModel):
    user_id: int
    otp: str
class PasswordResetEmail(BaseModel):
    email: EmailStr
    reset_link: str

class UserLockNotification(BaseModel):
    recipient: EmailStr
    username: str

class ViolationLockEmailRequest(BaseModel):
    recipient: EmailStr
    username: str
    ban_duration: str