from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.supabase_client import get_supabase_anon

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(req: RegisterRequest):
    try:
        supabase = get_supabase_anon()
        response = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {"data": {"name": req.name}},
        })

        if response.user:
            return {
                "data": {
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "name": req.name,
                    },
                    "token": response.session.access_token if response.session else None,
                },
                "error": None,
            }
        raise HTTPException(status_code=400, detail="No se pudo crear el usuario")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: LoginRequest):
    try:
        supabase = get_supabase_anon()
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        return {
            "data": {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "name": response.user.user_metadata.get("name", ""),
                },
                "token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            },
            "error": None,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
