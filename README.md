# CityGo — Tu Guía en Medellín

Asistente conversacional con IA para descubrir restaurantes, bares, eventos y cultura en Medellín. El agente "Parcero" responde en lenguaje natural, hace búsqueda semántica vectorial y transmite las respuestas en tiempo real (SSE).

---

## Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | TanStack Router (file-based), React 18, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **IA** | OpenAI GPT-4o-mini + text-embedding-3-small, agente ReAct |
| **Base de datos** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Supabase Auth (JWT — email/password + Google OAuth) |
| **Package manager** | pnpm (frontend) · pip + venv (backend) |

---

## Estructura del proyecto

```
CityGo/
├── frontend/                   # App TanStack Router + Lovable UI
│   ├── src/
│   │   ├── routes/             # Rutas file-based (feed, chat, wishlist, profile, admin)
│   │   ├── components/         # PlaceCard, PlaceModal, AppHeader, etc.
│   │   ├── lib/                # citygo-api.ts, auth.tsx, i18n, tipos
│   │   └── integrations/       # Cliente Supabase (auto-generado)
│   ├── .env.example            # ← copia a .env y rellena
│   └── package.json
├── backend/                    # API FastAPI + agente IA
│   ├── app/
│   │   ├── agent/              # ReAct loop + tool executor
│   │   ├── routers/            # chat, places, onboarding, wishlist, admin, etc.
│   │   ├── services/           # supabase_client, embedding_service
│   │   └── prompts/            # System prompt del agente
│   ├── scripts/                # Migraciones SQL (ejecutar en Supabase)
│   ├── .env.example            # ← copia a .env y rellena
│   └── requirements.txt
└── README.md
```

---

## Configuración rápida

### 1. Clonar el repo

```bash
git clone https://github.com/Estivendelgado16/CityGo.git
cd CityGo
git checkout US-01-US-02-front-integration   # rama activa de integración
```

### 2. Backend

**Requisitos:** Python 3.11+

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edita .env con tus credenciales de Supabase y OpenAI
```

Variables necesarias en `backend/.env`:

| Variable | Dónde conseguirla |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

Iniciar el servidor:

```bash
uvicorn app.main:app --reload --port 8000
```

Verificar que funciona:

```bash
curl http://localhost:8000/health
# → {"status":"ok","service":"CityGo-api"}
```

### 3. Frontend

**Requisitos:** Node.js 18+ y pnpm

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

cd frontend
pnpm install

cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

Variables necesarias en `frontend/.env`:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key de Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID del proyecto (slug en la URL de Supabase) |
| `SUPABASE_URL` | Igual que `VITE_SUPABASE_URL` (para SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | Igual que `VITE_SUPABASE_PUBLISHABLE_KEY` (para SSR) |
| `VITE_API_URL` | `http://localhost:8000` (o la URL del backend desplegado) |
| `VITE_USE_MOCK` | `false` para datos reales, `true` para mock sin backend |

Iniciar en desarrollo:

```bash
pnpm dev
# → http://localhost:5173
```

> **Sin backend:** Cambia `VITE_USE_MOCK=true` en `.env` para usar datos de prueba locales sin necesitar el FastAPI corriendo.

---

## Base de datos (Supabase)

Si es la primera vez que configuras la BD, ejecuta los scripts en orden desde el Supabase SQL Editor:

```
backend/scripts/migrate_frontend_tables.sql   # tablas: profiles, conversations, messages, wishlist, user_roles, n8n_webhooks
backend/scripts/add_frontend_place_columns.sql # columnas extra en places
```

Las tablas base (`users`, `places`, `events`, `user_preferences`, `user_feedback`) ya deben existir en el proyecto Supabase del equipo.

---

## Endpoints principales del backend

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/chat` | Chat con el agente IA (SSE streaming) |
| `GET` | `/api/me` | Perfil del usuario autenticado |
| `PATCH` | `/api/me` | Actualizar perfil |
| `POST` | `/api/onboarding/complete` | Guardar preferencias del onboarding |
| `GET` | `/api/feed` | Feed personalizado (for_you, eventos, trending) |
| `GET/POST/DELETE/PATCH` | `/api/wishlist/{place_id}` | Gestión de wishlist |
| `GET/DELETE` | `/api/conversations` | Historial de conversaciones |
| `GET` | `/api/admin/metrics` | Métricas (rol admin requerido) |
| `GET` | `/health` | Health check |

Documentación interactiva disponible en `http://localhost:8000/docs` cuando el backend está corriendo.

---

## Rutas del frontend

| Ruta | Descripción |
|---|---|
| `/` | Landing page |
| `/onboarding` | Configuración inicial de preferencias |
| `/app/feed` | Feed personalizado de lugares |
| `/app/chat` | Chat con el agente IA |
| `/app/wishlist` | Lugares guardados |
| `/app/profile` | Perfil y preferencias |
| `/app/admin` | Panel admin (solo usuarios con rol admin) |

---

## Formato SSE del agente

El endpoint `/api/chat` devuelve un stream de eventos con este formato:

```
data: {"type": "thinking", "content": "Buscando restaurantes..."}
data: {"type": "text_delta", "content": "¡Hola parce! "}
data: {"type": "place_card", "data": {"place_id": "...", "name": "...", ...}}
data: {"type": "done", "message_id": "uuid", "conversation_id": "uuid"}
data: {"type": "error", "code": "server_error", "message": "..."}
```

---

## Ramas activas

| Rama | Propósito |
|---|---|
| `QA` | Backend estable — NO tocar sin PR |
| `US-01-US-02-front-integration` | Integración frontend + backend (rama actual) |

---

## Comandos útiles

```bash
# Backend — correr tests
cd backend && pytest

# Frontend — build de producción
cd frontend && pnpm build

# Frontend — verificar tipos
cd frontend && pnpm tsc --noEmit
```
