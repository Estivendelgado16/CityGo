from fastapi import Request, HTTPException
from app.services.supabase_client import get_supabase_anon


async def get_current_user(request: Request) -> dict:
    """Valida JWT de Supabase y devuelve datos del usuario."""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")

    token = auth_header.split("Bearer ")[1]

    try:
        supabase = get_supabase_anon()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Token inválido")

        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error de autenticación: {str(e)}")
