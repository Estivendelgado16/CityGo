from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase

router = APIRouter()


class OnboardingRequest(BaseModel):
    budget_range: str | None = None
    favorite_cuisines: list[str] = []
    preferred_vibes: list[str] = []
    preferred_zones: list[str] = []
    dietary_restrictions: list[str] = []
    interests: list[str] = []


@router.post("/onboarding")
async def save_onboarding(req: OnboardingRequest, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    supabase.table("user_preferences").upsert({
        "user_id": user["id"],
        "budget_range": req.budget_range,
        "favorite_cuisines": req.favorite_cuisines,
        "preferred_vibes": req.preferred_vibes,
        "preferred_zones": req.preferred_zones,
        "dietary_restrictions": req.dietary_restrictions,
        "interests": req.interests,
    }).execute()

    supabase.table("users").update({
        "onboarding_completed": True,
    }).eq("id", user["id"]).execute()

    return {"data": {"onboarding_completed": True}, "error": None}


@router.get("/me")
async def get_profile(user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    user_data = supabase.table("users").select("*").eq("id", user["id"]).single().execute()
    prefs_data = supabase.table("user_preferences").select("*").eq("user_id", user["id"]).single().execute()

    return {
        "data": {
            **(user_data.data or {}),
            "preferences": prefs_data.data,
        },
        "error": None,
    }


@router.get("/me/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    """
    Devuelve solo las preferencias del usuario:
    - Las guardadas manualmente en el onboarding.
    - Las detectadas automáticamente por el agente (agent_detected_preferences).
    """
    supabase = get_supabase()
    prefs = supabase.table("user_preferences").select("*").eq("user_id", user["id"]).single().execute()

    return {"data": prefs.data or {}, "error": None}


@router.patch("/me/preferences")
async def update_preferences(body: dict, user: dict = Depends(get_current_user)):
    """
    Permite actualizar preferencias manualmente desde el frontend
    (ej: cambiar presupuesto o zonas después del onboarding).
    Solo actualiza los campos enviados, no sobreescribe todo el objeto.
    """
    allowed_fields = {
        "budget_range", "favorite_cuisines", "preferred_vibes",
        "preferred_zones", "dietary_restrictions", "interests",
    }
    update_data = {k: v for k, v in body.items() if k in allowed_fields}

    if not update_data:
        return {"data": None, "error": "No se enviaron campos válidos para actualizar"}

    supabase = get_supabase()
    supabase.table("user_preferences").update(update_data).eq("user_id", user["id"]).execute()

    return {"data": {"updated": list(update_data.keys())}, "error": None}
