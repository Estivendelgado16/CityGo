"""
Script para cargar seed data y generar embeddings.
Uso: python -m scripts.load_seed_data
"""
import os
import json
import asyncio
from datetime import date, timedelta
from openai import AsyncOpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def generate_embedding(text: str) -> list[float]:
    response = await openai_client.embeddings.create(model="text-embedding-3-small", input=text)
    return response.data[0].embedding


def build_place_embedding_text(place: dict) -> str:
    """
    Texto enriquecido para embedding de lugares.
    Incluye campos relevantes para matching de intereses, restricciones
    alimentarias y preferencias de ambiente del usuario.
    """
    parts = [
        place.get("name", ""),
        place.get("category", ""),
        place.get("description", ""),
        place.get("short_description", ""),
        f"zona: {place.get('zone', '')}",
        f"precio: {place.get('price_range', '')}",
    ]
    vibe_tags = place.get("vibe_tags", [])
    if vibe_tags:
        parts.append(f"ambiente: {', '.join(vibe_tags)}")
    # Incluir opciones dietéticas e intereses embebidos en description/tags
    dietary = place.get("dietary_options", [])
    if dietary:
        parts.append(f"opciones dietéticas: {', '.join(dietary)}")
    interests = place.get("interests", [])
    if interests:
        parts.append(f"ideal para: {', '.join(interests)}")
    return " | ".join(p for p in parts if p)


def build_event_embedding_text(event: dict) -> str:
    parts = [
        event.get("name", ""),
        event.get("category", ""),
        event.get("description", ""),
        f"lugar: {event.get('venue_name', '')}",
        f"precio: {event.get('price_range', '')}",
    ]
    vibe_tags = event.get("vibe_tags", [])
    if vibe_tags:
        parts.append(f"ambiente: {', '.join(vibe_tags)}")
    return " | ".join(p for p in parts if p)


def load_places():
    path = os.path.join(os.path.dirname(__file__), "seed_data", "places.json")
    with open(path, "r", encoding="utf-8") as f:
        places = json.load(f)

    print(f"📍 Cargando {len(places)} lugares (upsert idempotente)...")
    for place in places:
        # Upsert por name + address + category para evitar duplicados
        existing = (
            supabase.table("places")
            .select("id")
            .eq("name", place["name"])
            .eq("address", place.get("address", ""))
            .eq("category", place["category"])
            .execute()
        )
        if existing.data:
            place_id = existing.data[0]["id"]
            supabase.table("places").update(place).eq("id", place_id).execute()
            print(f"  🔄 {place['name']} (actualizado)")
        else:
            supabase.table("places").insert(place).execute()
            print(f"  ✅ {place['name']} (creado)")
    print(f"\n🎉 {len(places)} lugares procesados\n")


def load_events():
    path = os.path.join(os.path.dirname(__file__), "seed_data", "events.json")
    if not os.path.exists(path):
        print("⚠️  events.json no encontrado, omitiendo eventos.")
        return

    with open(path, "r", encoding="utf-8") as f:
        events = json.load(f)

    today = date.today()
    print(f"🎭 Cargando {len(events)} eventos (upsert idempotente)...")
    for event in events:
        # Convertir days_from_now a event_date real
        days = event.pop("days_from_now", 7)
        event_date = (today + timedelta(days=days)).isoformat()
        event["event_date"] = event_date

        # Upsert por name + venue_name para evitar duplicados
        existing = (
            supabase.table("events")
            .select("id")
            .eq("name", event["name"])
            .eq("venue_name", event.get("venue_name", ""))
            .execute()
        )
        if existing.data:
            event_id = existing.data[0]["id"]
            supabase.table("events").update(event).eq("id", event_id).execute()
            print(f"  🔄 {event['name']} (actualizado, fecha: {event_date})")
        else:
            supabase.table("events").insert(event).execute()
            print(f"  ✅ {event['name']} (creado, fecha: {event_date})")
    print(f"\n🎉 {len(events)} eventos procesados\n")


async def generate_place_embeddings():
    response = supabase.table("places").select("id, name, category, description, short_description, zone, price_range, vibe_tags").is_("embedding", "null").execute()
    places = response.data
    print(f"🧠 Generando embeddings para {len(places)} lugares...")

    for i, place in enumerate(places):
        text = build_place_embedding_text(place)
        embedding = await generate_embedding(text)
        supabase.table("places").update({"embedding": embedding}).eq("id", place["id"]).execute()
        print(f"  ✅ [{i+1}/{len(places)}] {place['name']}")
        await asyncio.sleep(0.1)

    print(f"\n🎉 Embeddings de lugares generados!\n")


async def generate_event_embeddings():
    response = supabase.table("events").select("id, name, category, description, venue_name, price_range, vibe_tags").is_("embedding", "null").execute()
    events = response.data
    print(f"🧠 Generando embeddings para {len(events)} eventos...")

    for i, event in enumerate(events):
        text = build_event_embedding_text(event)
        embedding = await generate_embedding(text)
        supabase.table("events").update({"embedding": embedding}).eq("id", event["id"]).execute()
        print(f"  ✅ [{i+1}/{len(events)}] {event['name']}")
        await asyncio.sleep(0.1)

    print(f"\n🎉 Embeddings de eventos generados!\n")


async def main():
    print("🚀 Cargando seed data y generando embeddings...\n")
    load_places()
    load_events()
    await generate_place_embeddings()
    await generate_event_embeddings()
    print("✅ Todo listo!")


if __name__ == "__main__":
    asyncio.run(main())

