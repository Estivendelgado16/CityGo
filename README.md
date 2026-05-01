<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</div>

<br>

<div align="center">
  <h1>🏔️ Parcero</h1>
  <h3><em>Tu Guía en Medellín</em></h3>
  <p><strong>El asistente de viaje con inteligencia artificial que transforma la forma de descubrir Medellín.</strong></p>
  <br>
  <p>
    <b>🌎 <a href="#español">Español</a></b>
  </p>
</div>

<br>

---

<a id="español"></a>

<div align="center">
  <h2>✨ Descubre Medellín como nunca antes</h2>
</div>

**Parcero** es un asistente conversacional impulsado por inteligencia artificial que actúa como un amigo local experto en Medellín. Olvídate de buscar en mil sitios web — Parcero entiende lo que buscas en lenguaje natural y te recomienda los mejores lugares, eventos y experiencias en la ciudad.

<p align="center">
  <i>"Cálido y cercano, como un amigo local que conoce todos los secretos de la ciudad."</i>
</p>

<br>

## 🎯 ¿Qué hace Parcero?

| | |
|---|---|
| 🍽️ **Recomendaciones inteligentes** | Restaurantes, bares, vida nocturna, cultura, naturaleza y más |
| 🗣️ **Lenguaje natural** | Habla como lo harías con un amigo: *"¿Qué hay para hacer hoy?"*, *"Quiero algo tranquilo para comer"*, *"Planes culturales"* |
| ⚡ **Respuestas en tiempo real** | Conversaciones fluidas con streaming de texto y tarjetas visuales |
| 🧠 **Agente con memoria** | Parcero aprende tus gustos y se adapta a tus preferencias |
| ❤️ **Guarda tus favoritos** | Crea una lista de lugares que quieras visitar |
| 🎭 **Eventos en vivo** | Entérate de conciertos, ferias y actividades culturales |

<br>

## 🧠 Cómo funciona

<div align="center">

```
     Tú                                          
       │                                        
       ▼                                        
  ┌─────────────┐     ┌──────────────────┐     
  │  Chat UI     │────▶│  Agente IA       │     
  │  React + TS  │     │  ReAct Loop      │     
  └─────────────┘     │  GPT-4o-mini     │     
       ▲              └────────┬─────────┘     
       │                       │                
       │              ┌────────▼─────────┐     
       │              │  Herramientas     │     
       │              │  ─────────────    │     
       └──────────────┤ • Buscar lugares  │     
         Streaming    │ • Ver feedback    │     
         SSE          │ • Detalles lugar  │     
                      │ • Eventos x fecha │     
                      │ • Actualizar pref │     
                      └────────┬─────────┘     
                               │                
                      ┌────────▼─────────┐     
                      │  Supabase +      │     
                      │  pgvector        │     
                      │  búsqueda        │     
                      │  semántica       │     
                      └──────────────────┘     
```

</div>

<br>

## ✨ Características destacadas

### 🤖 Agente IA con ReAct Loop
Parcero no es un chatbot común. Usa un ciclo **Razonamiento + Acción** (ReAct) con 5 herramientas especializadas para buscar lugares, consultar opiniones de la comunidad, obtener detalles, buscar eventos y hasta aprender tus preferencias sobre la marcha.

### 🔍 Búsqueda semántica
Gracias a **embeddings de OpenAI + pgvector en PostgreSQL**, Parcero entiende el significado detrás de tus palabras. No importa cómo lo digas — él te entiende.

### ⚡ Streaming en tiempo real
Las respuestas fluyen carácter por carácter vía **Server-Sent Events (SSE)**. La conversación se siente viva, natural e inmediata.

### 📱 Diseño mobile-first
Interfaz limpia, moderna y completamente responsive construida con **React + Tailwind CSS**. Pensada para el viajero que está en movimiento.

### 🔐 Tu información, segura
Autenticación mediante **Supabase Auth** con JWT y políticas de seguridad a nivel de fila (RLS).

<br>

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **Inteligencia Artificial** | OpenAI GPT-4o-mini, text-embedding-3-small |
| **Base de Datos** | Supabase (PostgreSQL + pgvector) |
| **Autenticación** | Supabase Auth (JWT) |
| **Despliegue** | Docker, Render |

<br>

## 📸 Capturas de pantalla

<div align="center">
  <p><em>Próximamente — así se ve Parcero en acción</em></p>
  <br>
  <table>
    <tr>
      <td align="center"><b>💬 Chat</b></td>
      <td align="center"><b>❤️ Favoritos</b></td>
      <td align="center"><b>👤 Perfil</b></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/280x560/2D6A4F/FFFFFF?text=Chat+Parcero" alt="Chat" width="280"></td>
      <td><img src="https://via.placeholder.com/280x560/FEFAE0/2D6A4F?text=Tus+Favoritos" alt="Favoritos" width="280"></td>
      <td><img src="https://via.placeholder.com/280x560/E76F51/FFFFFF?text=Tu+Perfil" alt="Perfil" width="280"></td>
    </tr>
  </table>
</div>

<br>

## 🚀 Primeros pasos

### Requisitos
- Node.js 18+
- Python 3.12+
- Una cuenta en [Supabase](https://supabase.com)
- Una API key de [OpenAI](https://platform.openai.com)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Configura tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # Modo desarrollo (usa datos mock por defecto)
```

> **¿Quieres probar sin backend?** El frontend incluye datos mock. Solo corre `npm run dev` y listo.

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate  # o .\venv\Scripts\activate en Windows
pip install -r requirements.txt
# Configura tu .env con las credenciales de Supabase y OpenAI
uvicorn app.main:app --reload
```

> 📖 Consulta las guías detalladas:
> - [Frontend README](./frontend/README.md)
> - [Backend README](./backend/README.md)

<br>

## 📁 Estructura del proyecto

```
CityGo/
├── frontend/          # Aplicación React + TypeScript
│   ├── src/
│   │   ├── pages/     # Chat, Favoritos, Perfil, Onboarding
│   │   ├── components/# PlaceCard, EventCard, ChatInput, etc.
│   │   ├── hooks/     # useChat (consumo SSE y mock)
│   │   └── types/     # Contrato compartido TypeScript
│   └── ...
├── backend/           # API FastAPI con agente IA
│   ├── app/
│   │   ├── agent/     # ReAct loop, herramientas, ejecutor
│   │   ├── routers/   # auth, chat, places, feedback, etc.
│   │   ├── services/  # Supabase client, embeddings
│   │   └── prompts/   # System prompt del agente
│   ├── scripts/       # Setup DB, seed data con 50+ lugares
│   └── ...
└── README.md          ← Estás aquí
```

<br>

## 👥 Equipo

| Rol | Integrante |
|---|---|
| 🎨 Frontend | P1 |
| ⚙️ Backend Core | P2 |
| 🧠 Embeddings & Datos | P3 |
| 🤖 Agente IA | P4 |
| 🔌 API & SSE | P5 |

<br>

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de demostración.

---

<div align="center">
  <br>
  <p>Hecho con 💚 por el equipo Parcero</p>
  <p>
    <a href="https://parcero-api.onrender.com">🌐 Web</a> ·
    <a href="./frontend/README.md">📱 Frontend</a> ·
    <a href="./backend/README.md">⚙️ Backend</a>
  </p>
  <br>
  <p>
    <sub>🏔️ <em>Medellín — La ciudad de la eterna primavera</em></sub>
  </p>
</div>
