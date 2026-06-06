from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os
from db.database import get_db
from models.user import User
from services.auth.security import SECRET_KEY, ALGORITHM
from schemas.user import UserOut
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")

def get_current_user_from_token(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. Decodificamos el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # 2. Buscamos al usuario en la DB usando el 'username' que viene en el token
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# 2. Esta usa la anterior para verificar permisos
async def get_admin_user(current_user: User = Depends(get_current_user_from_token)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes."
        )
    return current_user
