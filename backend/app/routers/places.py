from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/places/{place_id}")
async def get_place(place_id: str):
    supabase = get_supabase()
    response = supabase.table("places").select("*").eq("id", place_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Lugar no encontrado")

    return {"data": response.data, "error": None}


@router.post("/places/{place_id}/save")
async def save_place(place_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    try:
        supabase.table("saved_places").insert({
            "user_id": user["id"],
            "place_id": place_id,
        }).execute()
    except Exception:
        pass  # UNIQUE constraint — ya estaba guardado
    return {"data": {"saved": True}, "error": None}


@router.delete("/places/{place_id}/save")
async def unsave_place(place_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("saved_places").delete().eq("user_id", user["id"]).eq("place_id", place_id).execute()
    return {"data": {"saved": False}, "error": None}


@router.get("/saved-places")
async def get_saved_places(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("saved_places")
        .select("*, places(*)")
        .eq("user_id", user["id"])
        .order("saved_at", desc=True)
        .execute()
    )
    return {"data": response.data, "error": None}
