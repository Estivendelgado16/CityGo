from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    response = (
        supabase.table("chat_messages")
        .select("conversation_id, content, created_at")
        .eq("user_id", user["id"])
        .eq("role", "assistant")
        .order("created_at", desc=True)
        .execute()
    )

    conversations = {}
    for msg in response.data or []:
        conv_id = msg["conversation_id"]
        if conv_id not in conversations:
            preview = msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
            conversations[conv_id] = {
                "id": conv_id,
                "last_message_preview": preview,
                "updated_at": msg["created_at"],
            }

    return {"data": list(conversations.values()), "error": None}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("chat_messages")
        .select("*")
        .eq("user_id", user["id"])
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    return {"data": response.data, "error": None}
