from fastapi import FastAPI
from routes.project import router as router_project
from routes.user import router as router_user
from routes.metric import router as router_metric
from routes.testimony import router as router_testimony, export_router as router_testimony_export
from routes.photo import router as router_photo
from routes.milestone import router as router_milestone
from routes.media import router as router_media
import models
import os
from fastapi.middleware.cors import CORSMiddleware

_raw = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in _raw.split(",") if o.strip()]

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # requerido para que el navegador envíe cabeceras de autenticación
    allow_methods=["*"],
    allow_headers=["*"],
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