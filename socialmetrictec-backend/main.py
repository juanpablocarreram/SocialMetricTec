from fastapi import FastAPI
from routes.project import router as router_project
from routes.user import router as router_user
from routes.metric import router as router_metric
from routes.testimony import router as router_testimony, export_router as router_testimony_export
from routes.photo import router as router_photo
from routes.milestone import router as router_milestone
from routes.media import router as router_media
import models
from fastapi.middleware.cors import CORSMiddleware

# 1. Definimos los orígenes de confianza
# En desarrollo: localhost. En producción: el dominio del Tec.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://socialmetrictec.tec.mx", # Ejemplo de dominio real futuro
]

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Necesario para que el navegador acepte cabeceras de auth
    allow_methods=["*"], # Métodos explícitos
    allow_headers=["*"], # Headers específicos
)
app.include_router(router_user)
app.include_router(router_project)
app.include_router(router_metric)
app.include_router(router_testimony)
app.include_router(router_testimony_export)
app.include_router(router_photo)
app.include_router(router_milestone)
app.include_router(router_media)

@app.get("/")
def root():
    return {"message": "Welcome to the API"}