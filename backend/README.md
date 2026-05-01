# Parcero Backend — API del Agente Turístico de Medellín

## Setup Rápido

```bash
# 1. Clonar e instalar
cd parcero-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys de Supabase y OpenAI

# 3. Setup de Supabase
# Copiar el contenido de scripts/supabase_setup.sql
# y ejecutarlo en Supabase → SQL Editor

# 4. Cargar seed data (después de tener las 50 places en places.json)
python -m scripts.load_seed_data

# 5. Correr el servidor
uvicorn app.main:app --reload --port 8000
```

## Estructura

```
app/
├── main.py              # FastAPI app + CORS + routers
├── config.py            # Settings desde .env
├── dependencies.py      # Auth middleware
├── routers/
│   ├── auth.py          # POST /register, /login
│   ├── onboarding.py    # POST /onboarding, GET /me
│   ├── chat.py          # POST /chat (SSE stream)
│   ├── places.py        # CRUD places + wishlist
│   ├── feedback.py      # CRUD feedback
│   └── conversations.py # GET conversations + messages
├── services/
│   ├── supabase_client.py  # Singleton Supabase
│   └── embedding_service.py # OpenAI embeddings + pgvector search
├── agent/
│   ├── agent_loop.py    # ReAct loop principal
│   ├── tools.py         # Definición de herramientas (function calling)
│   └── tool_executor.py # Ejecuta herramientas contra Supabase
└── prompts/
    └── system_prompt.py # System prompt del agente
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login → JWT |
| POST | `/api/onboarding` | Sí | Guardar preferencias |
| GET | `/api/me` | Sí | Perfil + preferencias |
| POST | `/api/chat` | Sí | Chat SSE stream |
| GET | `/api/conversations` | Sí | Listar conversaciones |
| GET | `/api/conversations/:id/messages` | Sí | Historial |
| GET | `/api/places/:id` | No | Detalle lugar |
| POST | `/api/places/:id/save` | Sí | Guardar en wishlist |
| DELETE | `/api/places/:id/save` | Sí | Quitar de wishlist |
| GET | `/api/saved-places` | Sí | Mis guardados |
| POST | `/api/places/:id/feedback` | Sí | Dejar feedback |
| GET | `/api/places/:id/feedback` | No | Ver feedback |

## Quién trabaja dónde

- **P2**: `main.py`, `config.py`, `dependencies.py`, `supabase_client.py`, deploy
- **P3**: `embedding_service.py`, `scripts/`, funciones SQL en Supabase
- **P4**: `agent/` (agent_loop, tools, tool_executor), `prompts/`
- **P5**: `routers/` (todos los endpoints)
