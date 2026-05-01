"""
Script para cargar seed data y generar embeddings.
Uso: python -m scripts.load_seed_data
"""
import os
import json
import asyncio
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


def build_embedding_text(place: dict) -> str:
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
    return " | ".join(p for p in parts if p)


def load_places():
    path = os.path.join(os.path.dirname(__file__), "seed_data", "places.json")
    with open(path, "r", encoding="utf-8") as f:
        places = json.load(f)

    print(f"📍 Cargando {len(places)} lugares...")
    for place in places:
        response = supabase.table("places").insert(place).execute()
        print(f"  ✅ {place['name']}")
    print(f"\n🎉 {len(places)} lugares cargados\n")


async def generate_all_embeddings():
    response = supabase.table("places").select("*").is_("embedding", "null").execute()
    places = response.data
    print(f"🧠 Generando embeddings para {len(places)} lugares...")

    for i, place in enumerate(places):
        text = build_embedding_text(place)
        embedding = await generate_embedding(text)
        supabase.table("places").update({"embedding": embedding}).eq("id", place["id"]).execute()
        print(f"  ✅ [{i+1}/{len(places)}] {place['name']}")
        await asyncio.sleep(0.1)

    print(f"\n🎉 Embeddings generados!")


async def main():
    print("🚀 Cargando seed data y generando embeddings...\n")
    load_places()
    await generate_all_embeddings()
    print("\n✅ Todo listo!")


if __name__ == "__main__":
    asyncio.run(main())
