import json
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import AsyncGenerator

from app.dependencies import get_current_user
from app.utils.input_validator import (
    is_valid_length,
    is_empty_message,
    has_spam_patterns,
    contains_abusive_language,
)
from app.utils.context_validator import is_out_of_context
from app.services.supabase_client import get_supabase

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    conversation_id = req.conversation_id or str(uuid.uuid4())

    if is_empty_message(req.message):
        return JSONResponse(
            content={"error": "El mensaje no puede estar vacío"},
            status_code=400,
        )
    if not is_valid_length(req.message):
        return JSONResponse(
            content={"error": "Mensaje demasiado largo o corto"},
            status_code=400,
        )
    if contains_abusive_language(req.message):
        return JSONResponse(
            content={"error": "Parce, mantengamos el respeto"},
            status_code=400,
        )
    if has_spam_patterns(req.message):
        return JSONResponse(
            content={"error": "Mensaje repetitivo detectado"},
            status_code=400,
        )
    if is_out_of_context(req.message):
        return JSONResponse(
            content={"error": "Solo puedo ayudarte con planes y lugares en Medellín, parce. Pregúntame sobre restaurantes, eventos, vida nocturna o cultura en la ciudad."},
            status_code=400,
        )

    async def generate() -> AsyncGenerator[str, None]:
        full_response = ""

        try:
            from app.agent.agent_loop import agent_loop

            async for event in agent_loop(
                user_message=req.message,
                user_id=user["id"],
                conversation_id=conversation_id,
            ):
                yield sse_event(event)

                if event.get("type") == "text_delta":
                    full_response += event.get("content", "")

            supabase = get_supabase()

            supabase.table("chat_messages").insert({
                "user_id": user["id"],
                "conversation_id": conversation_id,
                "role": "user",
                "content": req.message,
            }).execute()

            supabase.table("chat_messages").insert({
                "user_id": user["id"],
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": full_response,
            }).execute()

            message_id = str(uuid.uuid4())
            yield sse_event({
                "type": "done",
                "message_id": message_id,
                "conversation_id": conversation_id,
            })

        except Exception as e:
            yield sse_event({
                "type": "error",
                "code": "server_error",
                "message": f"Error interno: {str(e)}",
            })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
