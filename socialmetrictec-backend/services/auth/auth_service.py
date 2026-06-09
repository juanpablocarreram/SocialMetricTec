from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response, Request
from datetime import timedelta
from jose import jwt, JWTError
import os

from services.auth.security import validate_refresh_token, verify_password, create_access_token, create_refresh_token
from models.user import User

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

def authenticate_user(db: Session, username_ingresado: str, password_ingresada: str, response:Response):
    user = db.query(User).filter(User.username == username_ingresado).first()

    # mismo mensaje para usuario o contraseña incorrectos para no revelar cuál falla
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(password_ingresada, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    access_token_data = {
        "sub": user.username,
        "email": user.email,
        "is_admin": user.is_admin
    }

    access_token = create_access_token(
        data=access_token_data,
        expires_delta=access_token_expires
    )
    refresh_token_data = {"sub": user.username}
    refresh_token = create_refresh_token(
        data=refresh_token_data,
        expires_delta=refresh_token_expires
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,   # impide acceso desde JavaScript
        secure=False,    # cambiar a True en producción (requiere HTTPS)
        samesite="lax",  # mitiga CSRF
        max_age=7 * 24 * 60 * 60
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

def refresh_access_token(request:Request, response: Response, db: Session):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró el token de refresco. Inicia sesión de nuevo.",
        )

    try:
        username: str = validate_refresh_token(refresh_token)
    except JWTError:
        # el token expiró o fue alterado
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de refresco ha expirado o es inválido. Inicia sesión.",
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado en el sistema."
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token_data = {
        "sub": user.username,
        "email": user.email,
        "is_admin": user.is_admin
    }

    new_access_token = create_access_token(
        data=new_access_token_data,
        expires_delta=access_token_expires
    )
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }
