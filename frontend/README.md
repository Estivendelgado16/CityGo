# Parcero Frontend — Agente Turístico de Medellín

## Setup Rápido

```bash
cd parcero-frontend
npm install
npm run dev
```

La app arranca en `http://localhost:5173` con mock data — no necesitas backend.

## Variables de Entorno

```bash
VITE_USE_MOCK=true              # true = usa mocks, false = backend real
VITE_API_URL=http://localhost:8000   # URL del backend (cuando USE_MOCK=false)
```

## Estructura

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Routing + layout
├── index.css                # Tailwind + animaciones
├── vite-env.d.ts            # Tipos de env vars
│
├── types/
│   └── sse-contract.ts      # 🔒 CONTRATO — No modificar sin coordinar
│
├── hooks/
│   └── useChat.ts           # Hook principal del chat (mock + real)
│
├── mocks/
│   └── mock-sse.ts          # Backend falso con datos de Medellín
│
├── components/
│   ├── BottomNav.tsx         # Navegación inferior (Chat, Guardados, Perfil)
│   ├── ChatInput.tsx         # Input de texto del chat
│   ├── PlaceCard.tsx         # Card de lugar (reutilizable en chat y wishlist)
│   ├── EventCard.tsx         # Card de evento
│   └── ThinkingIndicator.tsx # Indicador "pensando" del agente
│
├── pages/
│   ├── ChatPage.tsx          # Pantalla principal del chat
│   ├── SavedPage.tsx         # Wishlist de lugares guardados
│   ├── ProfilePage.tsx       # Perfil y preferencias
│   └── OnboardingPage.tsx    # Onboarding (placeholder)
│
└── lib/                      # Utilidades (vacío por ahora)
```

## Cómo Probar

Escribe cualquier mensaje en el chat. El mock responde diferente según palabras clave:

| Palabra clave | Escenario |
|--------------|-----------|
| "comer", "restaurante" | Recomendaciones de comida |
| "noche", "bar", "salir" | Vida nocturna |
| "cultura", "museo" | Planes culturales |
| "deporte", "naturaleza" | Actividades al aire libre |
| Cualquier otra cosa | Saludo genérico |

## Conexión con Backend Real

Cuando P5 tenga los endpoints listos:

1. Cambiar `.env`: `VITE_USE_MOCK=false`
2. Poner la URL real: `VITE_API_URL=https://parcero-api.onrender.com`
3. El hook `useChat` cambia automáticamente de mock a fetch real

## Para Claude Code

Ver `CLAUDE_CODE_INSTRUCTIONS.md` en la raíz del proyecto. Contiene todas las instrucciones para que Claude Code construya y mejore la interfaz.
