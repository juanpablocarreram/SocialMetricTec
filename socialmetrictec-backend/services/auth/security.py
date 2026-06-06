from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os



# DEFINICIÓN ÚNICA DEL CONTEXTO
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "clave_secreta")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "clave_secreta") # <-- IMPORTANTE
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))


def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    # 1. Calcular el tiempo de expiración (por defecto 7 días si no se envía uno personalizado)
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # 2. Añadir la fecha de expiración al Payload
    to_encode.update({"exp": expire})
    # 3. Firmar el token usando la REFRESH_SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
def validate_refresh_token(token: str):
    payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("sub")
    if username is None:
            raise JWTError("Sub no encontrado en el token")
    return username