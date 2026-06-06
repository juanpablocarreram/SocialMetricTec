from fastapi import APIRouter, Depends, HTTPException, Response, Request
from schemas.user import UserCreate, UserOut, UserUpdate, PasswordReset, SelfProfileUpdate, SelfPasswordChange
from schemas.project import ProjectSummary
from schemas.token import Token
from models.user import User
from routes.deps import get_current_user_from_token, get_admin_user
from fastapi.security import OAuth2PasswordRequestForm
from services.auth.auth_service import authenticate_user, refresh_access_token
from sqlalchemy.orm import Session
from db.database import get_db
from services.crud.user import (
    create_user_in_db,
    get_users_preview as fetch_users_preview,
    delete_user_from_db,
    update_user_in_db,
    update_own_profile,
    change_own_password,
    reset_password_in_db,
    get_user_projects,
    assign_user_to_project,
    remove_user_from_project,
)

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/register", dependencies=[Depends(get_admin_user)], response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user_in_db(db, user)


@router.post("/login", response_model=Token)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return authenticate_user(
        db=db,
        username_ingresado=form_data.username,
        password_ingresada=form_data.password,
        response=response,
    )


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: UserOut = Depends(get_current_user_from_token)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    data: SelfProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    return update_own_profile(db, current_user, data)


@router.patch("/me/password", response_model=UserOut)
def change_my_password(
    body: SelfPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    result = change_own_password(db, current_user, body.current_password, body.new_password)
    if result == "password_incorrecto":
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
    return result


@router.post("/refresh", response_model=Token)
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    return refresh_access_token(request=request, response=response, db=db)


@router.get("/users-preview", response_model=list[UserOut], dependencies=[Depends(get_admin_user)])
def get_users_preview(db: Session = Depends(get_db)):
    return fetch_users_preview(db)


@router.patch("/{username}", dependencies=[Depends(get_admin_user)], response_model=UserOut)
def update_user(username: str, update_data: UserUpdate, db: Session = Depends(get_db)):
    return update_user_in_db(db, username, update_data)


@router.patch("/{username}/password", dependencies=[Depends(get_admin_user)], response_model=UserOut)
def reset_user_password(username: str, body: PasswordReset, db: Session = Depends(get_db)):
    return reset_password_in_db(db, username, body.new_password)


@router.get("/{username}/projects", dependencies=[Depends(get_admin_user)], response_model=list[ProjectSummary])
def list_user_projects(username: str, db: Session = Depends(get_db)):
    return get_user_projects(db, username)


@router.post("/{username}/projects/{project_id}", dependencies=[Depends(get_admin_user)], status_code=201)
def add_user_to_project(username: str, project_id: int, db: Session = Depends(get_db)):
    assign_user_to_project(db, username, project_id)
    return {"message": f"{username} asignado al proyecto {project_id}."}


@router.delete("/{username}/projects/{project_id}", dependencies=[Depends(get_admin_user)], status_code=204)
def remove_user_from_project_route(username: str, project_id: int, db: Session = Depends(get_db)):
    result = remove_user_from_project(db, username, project_id)
    if result == "no_encontrado":
        raise HTTPException(status_code=404, detail="El usuario no gestiona ese proyecto.")


@router.delete("/{username}", dependencies=[Depends(get_admin_user)], status_code=204)
def delete_user(username: str, db: Session = Depends(get_db)):
    result = delete_user_from_db(db, username)
    if result == "no_encontrado":
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")