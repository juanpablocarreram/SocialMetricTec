from dotenv import load_dotenv
import os
import requests

load_dotenv()

BASE_URL = "http://localhost:8000"

# Asegúrate de que estos nombres coincidan con tu .env
USERNAME = os.getenv("ROOT_USERNAME")
PASSWORD = os.getenv("ROOT_PASSWORD") 

def login():
    # Datos en formato de formulario para OAuth2
    data = {
        "username": USERNAME,
        "password": PASSWORD
    }

    try:
        # Cambié /user/login por /auth/login basándome en tu error 404
        # Verifica en tu archivo de rutas cuál es el prefijo correcto
        response = requests.post(
            f"{BASE_URL}/user/login", 
            data=data
        )

        print(f"--- Intento de Login en {BASE_URL} ---")
        print("STATUS:", response.status_code)

        if response.ok:
            json_data = response.json()
            
            # Extraemos el token del JSON
            token = json_data.get("access_token")
            token_type = json_data.get("token_type")

            print("\nLOGIN EXITOSO")
            print("-" * 30)
            print("TOKEN COMPLETO:")
            print(token) # Aquí se imprime el "chorro" de letras del JWT
            print("-" * 30)
            print(f"TIPO DE TOKEN: {token_type}")
            
            return token

        else:
            print("\nERROR EN EL LOGIN")
            print("Detalle del servidor:", response.text)

    except requests.exceptions.ConnectionError:
        print("\nERROR: No se pudo conectar al servidor. ¿Está encendido uvicorn?")
    except Exception as e:
        print("\nOcurrió un error inesperado:", str(e))

if __name__ == "__main__":
    login()