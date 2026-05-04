from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase

router = APIRouter()


class FeedbackRequest(BaseModel):
    rating: int
    comment: str = ""
    visited_at: str | None = None


@router.post("/places/{place_id}/feedback")
async def submit_feedback(place_id: str, req: FeedbackRequest, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    feedback = supabase.table("user_feedback").insert({
        "user_id": user["id"],
        "place_id": place_id,
        "rating": req.rating,
        "comment": req.comment,
        "visited_at": req.visited_at,
    }).execute()

    # Update place average rating
    all_feedback = supabase.table("user_feedback").select("rating").eq("place_id", place_id).execute()
    ratings = [f["rating"] for f in all_feedback.data]
    avg = sum(ratings) / len(ratings) if ratings else 0

    supabase.table("places").update({
        "average_rating": round(avg, 1),
        "total_reviews": len(ratings),
    }).eq("id", place_id).execute()

    # Generate comment embedding for RAG (P3)
    # Minimum 3 chars to capture short but valid comments ("Ok", "Good")
    if req.comment and len(req.comment.strip()) >= 3:
        if not feedback.data:
            # Insert returned no data — skip embedding update
            print(f"[feedback] WARNING: insert returned no data for place_id={place_id}, embedding skipped")
        else:
            try:
                from app.services.embedding_service import generate_embedding
                embedding = await generate_embedding(req.comment)
                supabase.table("user_feedback").update({
                    "embedding": embedding,
                }).eq("id", feedback.data[0]["id"]).execute()
            except Exception as e:
                # Do not block user response, but log the error for debugging
                print(f"[feedback] ERROR generating embedding for feedback {feedback.data[0]['id']}: {e}")

    return {"data": feedback.data[0], "error": None}


@router.get("/places/{place_id}/feedback")
async def get_feedback(place_id: str):
    supabase = get_supabase()
    response = (
        supabase.table("user_feedback")
        .select("id, rating, comment, visited_at, created_at")
        .eq("place_id", place_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return {"data": response.data, "error": None}
