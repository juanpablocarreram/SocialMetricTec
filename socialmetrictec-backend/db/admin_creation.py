import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, engine, Base
from models.user import User
# Importamos la función desde tu nuevo archivo central de seguridad
from services.auth.security import get_password_hash 

load_dotenv()

def create_root_user():
    # Creamos las tablas si aún no existen
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        username = os.getenv("ROOT_USERNAME", "root_user")
        email = os.getenv("ROOT_EMAIL", "juanpacm2511@gmail.com")
        
        root_exists = db.query(User).filter(User.username == username).first()
        mail_used = db.query(User).filter(User.email == email).first()
        
        if not root_exists and not mail_used:
            print(f"Creando usuario {username}...")
            
            raw_password = os.getenv("ROOT_PASSWORD", "admin12345")
            
            # USAMOS LA FUNCIÓN IMPORTADA
            # Ya no llamamos a pwd_context.hash, sino a nuestra función modular
            hashed_password = get_password_hash(raw_password) 
            
            new_root = User(
                username=username,
                password_hash=hashed_password,
                email=email,
                is_admin=True
            )
            
            db.add(new_root)
            db.commit()
            print("Usuario root insertado exitosamente.")
        else:
            print("El usuario o email ya existen.")
            
    except Exception as e:
        print(f"Error al insertar el root: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_root_user()