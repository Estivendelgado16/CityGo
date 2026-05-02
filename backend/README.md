# CityGo Backend — API del Agente Turístico de Medellín

API asíncrona en Python que impulsa un agente conversacional con IA para descubrir lugares y eventos en Medellín. Arquitectura basada en FastAPI + Supabase + OpenAI, con búsqueda semántica vectorial y streaming de respuestas vía SSE.

---

## Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **Python** | ≥ 3.11 | Lenguaje base |
| **FastAPI** | 0.115.0 | Framework web asíncrono con validación automática y docs interactivos |
| **Uvicorn** | 0.30.0 | Servidor ASGI con soporte HTTP/1.1 y WebSocket |
| **Pydantic** | 2.9.0 | Validación de datos en requests/responses |
| **pydantic-settings** | 2.5.0 | Gestión tipada de variables de entorno |
| **Supabase** | 2.9.0 | BaaS: base de datos PostgreSQL, autenticación, RLS |
| **OpenAI** | 1.50.0 | Cliente oficial para GPT-4o-mini (agente) y text-embedding-3-small (búsqueda semántica) |
| **httpx** | 0.27.0 | Cliente HTTP asíncrono |
| **python-dotenv** | 1.0.1 | Carga de variables de entorno desde `.env` |
| **PostgreSQL + pgvector** | — | Base de datos relacional + extension de vectores para búsqueda por similitud |
| **Docker** | — | Contenedor para producción |

---

## Arquitectura general

```
Cliente (React)                    CityGo Backend (FastAPI)
    │                                     │
    │  POST /api/chat (SSE)               │
    │────────────────────────────────────►│
    │                                     │
    │         ┌───────────────────────┐   │
    │         │   Agent Loop (ReAct)  │   │
    │         │  GPT-4o-mini + Tools  │   │
    │         └───────┬───────────────┘   │
    │                 │                    │
    │         ┌───────▼───────────────┐   │
    │         │  Tool Executor         │   │
    │         │  buscar_lugares()      │   │
    │         │  consultar_feedback()  │   │
    │         │  obtener_detalles()    │   │
    │         │  buscar_eventos()      │   │
    │         │  actualizar_prefs()    │   │
    │         └───────┬───────────────┘   │
    │                 │                    │
    │         ┌───────▼───────────────┐   │
    │         │   Supabase (BaaS)      │   │
    │         │   · PostgreSQL +       │   │
    │         │     pgvector           │   │
    │         │   · Auth (JWT)         │   │
    │         │   · RLS (Row Security) │   │
    │         └───────────────────────┘   │
    │                                     │
    │  ◄─── SSE stream (text + cards) ───│
```

---

## Requisitos previos

- **Python** ≥ 3.11
- **pip** ≥ 23.x
- **Git**

Verifica tu instalación:

```bash
python --version    # Python 3.11+
pip --version       # pip 23.x+
```

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd CityGo/backend
```

### 2. Crear y activar entorno virtual

#### Ubuntu / macOS / WSL

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows (PowerShell)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> Si PowerShell bloquea la ejecución de scripts, ejecuta:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

#### Windows (CMD)

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus credenciales reales:

```bash
cp .env.example .env
```

Edita `.env` con los siguientes valores (reemplaza los valores de ejemplo):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...     # anon key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...  # service_role key
OPENAI_API_KEY=sk-proj-...                     # OpenAI API key
ENVIRONMENT=development
MAX_AGENT_ITERATIONS=5
FRONTEND_URL=http://localhost:5173
```

> **⚠️ Seguridad**: El archivo `.env` contiene credenciales sensibles. No lo versiones (`.gitignore` ya lo excluye). Las claves de Supabase y OpenAI deben mantenerse confidenciales.

### 5. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `scripts/supabase_setup.sql`
4. Ejecuta todo el script (crea tablas, índices, funciones vectoriales, políticas RLS y triggers)

Esto configurará:
- Tablas: `users`, `user_preferences`, `places`, `events`, `saved_places`, `user_feedback`, `chat_messages`
- Extensión `pgvector` para búsqueda semántica
- Funciones `search_places_with_feedback` y `search_events_by_date_and_similarity`
- Trigger que crea perfil automáticamente al registrarse
- Políticas de seguridad Row Level Security (RLS)

### 6. Cargar datos de semilla

```bash
python -m scripts.load_seed_data
```

Este script:
1. Inserta lugares y eventos desde `scripts/seed_data/places.json`
2. Genera embeddings vectoriales con OpenAI (`text-embedding-3-small`)
3. Almacena los embeddings en la columna `embedding` de cada registro

### 7. Iniciar el servidor de desarrollo

```bash
uvicorn app.main:app --reload --port 8000
```

La API arranca en **`http://localhost:8000`** con recarga automática.

### 8. Explorar la documentación interactiva

Abre en tu navegador:

| Documentación | URL |
|---|---|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## Solución de problemas comunes

### Ubuntu / WSL

- **Error `pip: command not found`**:
  ```bash
  sudo apt update && sudo apt install python3-pip -y
  ```

- **Error `externally-managed-environment`** (Python 3.12+ en Ubuntu):
  Usa el entorno virtual (no instales globalmente). Si aparece, asegúrate de tener el venv activado.

- **Error de conexión a Supabase**: verifica que `SUPABASE_URL` y `SUPABASE_KEY` en `.env` sean correctos y que el proyecto no esté en pausa.

- **Error de OpenAI** (`401 Unauthorized`): confirma que `OPENAI_API_KEY` es válida y tiene crédito disponible.

### Windows

- **Error `pip no se reconoce como un comando interno`**: asegúrate de que Python esté agregado al PATH durante la instalación.

- **Error `Fatal error in launcher: Unable to create process`**:
  ```powershell
  python -m pip install --upgrade pip
  ```

- **Error al activar el venv**:
  ```powershell
  # Si falla ExecutionPolicy:
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  # Luego activa:
  .\venv\Scripts\Activate.ps1
  ```

- **Error de permisos en Windows**: ejecuta PowerShell o CMD como Administrador.

- **Error de pgvector en Supabase**: verifica que la extensión `vector` se haya habilitado correctamente desde el SQL Editor (línea `CREATE EXTENSION IF NOT EXISTS vector;`).

---

## Despliegue con Docker

```bash
docker build -t citygo-backend .
docker run -p 8000:8000 --env-file .env citygo-backend
```

El `Dockerfile` usa `python:3.12-slim` y expone el puerto `8000`.

---

## Estructura del proyecto

```
backend/
├── .env                           # Variables de entorno (no versionado)
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore
├── requirements.txt               # Dependencias Python
├── Dockerfile                     # Imagen para producción
│
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, CORS, registro de routers, health check
│   ├── config.py                  # Config tipada con pydantic-settings
│   ├── dependencies.py            # Middleware de autenticación JWT (Supabase)
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # POST /register, POST /login
│   │   ├── onboarding.py          # POST /onboarding, GET /me
│   │   ├── chat.py                # POST /chat (SSE stream)
│   │   ├── places.py              # GET /places/:id, POST/DELETE /places/:id/save, GET /saved-places
│   │   ├── feedback.py            # POST /places/:id/feedback, GET /places/:id/feedback
│   │   └── conversations.py       # GET /conversations, GET /conversations/:id/messages
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent_loop.py          # Loop ReAct con GPT-4o-mini y control de herramientas
│   │   ├── tools.py               # Definición de herramientas (function calling de OpenAI)
│   │   └── tool_executor.py       # Ejecución de herramientas contra Supabase
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_client.py     # Singleton de cliente Supabase (service + anon)
│   │   └── embedding_service.py   # Generación de embeddings y búsqueda vectorial
│   │
│   └── prompts/
│       ├── __init__.py
│       └── system_prompt.py       # System prompt del agente Parcero
│
├── scripts/
│   ├── supabase_setup.sql         # DDL completo: tablas, índices, RLS, funciones vectoriales, trigger
│   ├── load_seed_data.py          # Script para cargar datos de semilla y generar embeddings
│   └── seed_data/
│       └── places.json            # Datos de lugares y eventos de Medellín
│
└── venv/                          # Entorno virtual (no versionado)
```

---

## Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Registro de usuario (email, password, name) |
| `POST` | `/api/auth/login` | No | Inicio de sesión → devuelve JWT |

### Onboarding y perfil

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/onboarding` | Sí | Guardar preferencias del usuario (rango de precio, comidas, zonas, intereses) |
| `GET` | `/api/me` | Sí | Obtener perfil + preferencias del usuario autenticado |

### Chat (SSE)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/chat` | Sí | Enviar mensaje → recibe stream SSE con eventos: `text_delta`, `place_card`, `event_card`, `thinking`, `error`, `done` |

### Lugares

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/places/:id` | No | Detalle completo de un lugar |
| `POST` | `/api/places/:id/save` | Sí | Guardar lugar en wishlist |
| `DELETE` | `/api/places/:id/save` | Sí | Quitar lugar de wishlist |
| `GET` | `/api/saved-places` | Sí | Listar lugares guardados por el usuario |

### Feedback

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/places/:id/feedback` | Sí | Dejar reseña (rating 1-5, comentario, fecha de visita) |
| `GET` | `/api/places/:id/feedback` | No | Ver reseñas de un lugar |

### Conversaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/conversations` | Sí | Listar conversaciones del usuario |
| `GET` | `/api/conversations/:id/messages` | Sí | Historial de mensajes de una conversación |

### Health check

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | No | Estado del servicio |

---

## Flujo del agente (ReAct Loop)

1. El usuario envía un mensaje a `POST /api/chat`
2. El router crea un `StreamingResponse` SSE y delega al `agent_loop`
3. El agente construye el contexto: preferencias del usuario + historial de la conversación
4. El loop ReAct itera (máx. `MAX_AGENT_ITERATIONS`):
   - Llama a GPT-4o-mini con las herramientas definidas en `tools.py`
   - Si el modelo responde (`finish_reason="stop"`), parsea el texto en eventos SSE
   - Si el modelo llama a una herramienta (`finish_reason="tool_calls"`):
     - Emite un evento `thinking` con el progreso
     - Ejecuta la herramienta contra Supabase
     - Retorna el resultado al modelo para la siguiente iteración
5. Cuando termina, emite un evento `done` con `message_id` y `conversation_id`
6. Los mensajes se persisten automáticamente en `chat_messages`

### Herramientas del agente

| Herramienta | Descripción |
|---|---|
| `buscar_lugares` | Búsqueda semántica de lugares por query + categoría |
| `consultar_feedback_comunitario` | Obtener reseñas de otros usuarios sobre un lugar |
| `obtener_detalles_lugar` | Información detallada (menú, horarios, dirección, redes) |
| `buscar_eventos_por_fecha` | Búsqueda de eventos en un rango de fechas |
| `actualizar_preferencias_usuario` | Detectar y guardar patrones de preferencias |
