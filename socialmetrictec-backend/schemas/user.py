from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserProfile(BaseModel):
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    is_admin: bool
    profile: Optional[UserProfile] = None
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    email: Optional[str] = None
    is_admin: Optional[bool] = None

class SelfProfileUpdate(BaseModel):
    email: Optional[str] = None
    profile: Optional[UserProfile] = None

class SelfPasswordChange(BaseModel):
    current_password: str
    new_password: str

class PublicLeader(BaseModel):
    username: str
    email: str
    profile: Optional[UserProfile] = None
    model_config = ConfigDict(from_attributes=True)

class PasswordReset(BaseModel):
    new_password: str