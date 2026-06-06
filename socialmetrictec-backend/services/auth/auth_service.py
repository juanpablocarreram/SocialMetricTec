from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response, Request
from datetime import timedelta
from jose import jwt, JWTError
import os

# Importamos las herramientas de tu archivo central de seguridad
from services.auth.security import validate_refresh_token, verify_password, create_access_token, create_refresh_token
# Importamos tu modelo de usuario
from models.user import User

# Configuraciones que vienen de tu .env
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

def authenticate_user(db: Session, username_ingresado: str, password_ingresada: str, response:Response):
    """
    Lógica de negocio para validar credenciales y entregar un token.
    """
    # 1. Buscar al usuario en la base de datos
    user = db.query(User).filter(User.username == username_ingresado).first()
    
    # 2. Si el usuario no existe, lanzamos un error 401
    # Nota: Por seguridad, usamos el mismo mensaje para usuario o pass incorrectos
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Verificar si la contraseña coincide usando el hash de la DB
    if not verify_password(password_ingresada, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Preparar la información que viajará dentro del Token (Payload)
    # No pongas datos sensibles aquí (como la contraseña), solo identidad y roles.
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token_data = {
        "sub": user.username,
        "email": user.email,
        "is_admin": user.is_admin
    }
    
    # 5. Generar el JWT firmado
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
        httponly=True,   # <--- Clave: Bloquea el acceso desde JavaScript (React no lo ve)
        secure=False,     # Solo viaja por HTTPS (puedes apagarlo en desarrollo local si te da lata)
        samesite="lax",   # Evita ataques de redirección maliciosa (CSRF)
        max_age=7 * 24 * 60 * 60 # Tiempo de vida de la cookie en segundos (7 días)
    )
    # 6. Devolver la respuesta en el formato estándar de OAuth2
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }
def refresh_access_token(request:Request, response: Response, db: Session):
    # 1. Intentar extraer la cookie llamada 'refresh_token'
    refresh_token = request.cookies.get("refresh_token")
    # Si el navegador no envió la cookie, denegamos el acceso de inmediato
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró el token de refresco. Inicia sesión de nuevo.",
        )
        
    try:
        username: str = validate_refresh_token(refresh_token)   
    except JWTError:
        # Si el token expiró (pasaron los 7 días) o fue alterado, la firma fallará aquí
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de refresco ha expirado o es inválido. Inicia sesión.",
        )
    
    # 3. Buscar al usuario en la DB para asegurarnos de que siga existiendo/activo
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuario no encontrado en el sistema."
        )
    
    # 4. Generar un ACCESS TOKEN nuevo de paquete (duración de 15 minutos)
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