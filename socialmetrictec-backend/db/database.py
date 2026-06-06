import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
load_dotenv()

# Configuración para MySQL
class MySQLSettings:
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci",
    }

# Definimos Base de forma limpia
Base = declarative_base(cls=MySQLSettings)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependencia para las rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 7. Test de conexión
if __name__ == "__main__":
    print(f"Intentando conectar a: {SQLALCHEMY_DATABASE_URL}")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("¡Conexión exitosa a la base de datos!")
    except OperationalError as e:
        print(f"No se pudo conectar. Error de operación: {e}")
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")