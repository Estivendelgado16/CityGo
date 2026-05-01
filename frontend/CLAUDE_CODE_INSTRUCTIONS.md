# Instrucciones para Claude Code — Frontend Parcero App

## Qué es este proyecto
App web mobile-first para recomendar lugares en Medellín. Un agente de IA (backend en FastAPI) responde vía streaming SSE con texto + cards visuales de lugares y eventos.

## Stack
- React 18+ con Vite
- TypeScript
- Tailwind CSS
- React Router DOM

## Archivos clave que ya existen
- `src/types/sse-contract.ts` — Tipos TypeScript para TODA la comunicación con el backend. No modificar sin coordinar con el equipo.
- `src/mocks/mock-sse.ts` — Mock del backend con datos reales de Medellín. Usa esto para desarrollar sin depender del backend.
- `src/hooks/useChat.ts` — Hook que consume el stream SSE (mock o real). Cambia automáticamente con la env var `VITE_USE_MOCK`.

## Variables de entorno
```
VITE_USE_MOCK=true          # Usar mock (default, para desarrollo)
VITE_API_URL=http://localhost:8000  # URL del backend real (semana 2+)
```

## Vistas a construir

### 1. Onboarding (primera vez)
- Formulario multi-step donde el usuario define:
  - Presupuesto preferido ($, $$, $$$, $$$$)
  - Tipos de cocina favorita (colombiana, japonesa, italiana, etc.)
  - Vibes que le gustan (tranquilo, fiesta, romántico, rooftop, etc.)
  - Zonas preferidas (El Poblado, Laureles, Centro, etc.)
  - Restricciones alimentarias (opcional)
  - Intereses (gastronomía, vida nocturna, cultura, deportes)
- Usar el tipo `OnboardingRequest` de `sse-contract.ts`
- Guardar con `mockApi.saveOnboarding()` (luego será el endpoint real)

### 2. Chat (pantalla principal)
- Input de texto abajo (estilo WhatsApp/iMessage)
- Mensajes del usuario a la derecha, del agente a la izquierda
- El texto del agente aparece progresivamente (streaming)
- Entre el texto aparecen PlaceCards y EventCards
- Indicador de "pensando" con animación y el texto del thinking event
- Usar el hook `useChat()` — ya maneja todo el estado
- Auto-scroll al último mensaje

### 3. PlaceCard (componente)
- Imagen del lugar arriba
- Nombre, categoría, zona
- Rating con estrellas + total de reviews
- Vibe tags como chips/badges
- Rango de precio
- Indicador de abierto/cerrado si `is_open_now` viene
- Botón de corazón para guardar (wishlist)
- Usar el tipo `PlaceCardData` de `sse-contract.ts`

### 4. EventCard (componente)
- Similar a PlaceCard pero con:
  - Fecha y hora del evento
  - Nombre del venue
  - Botón de "Ver tickets" si hay `ticket_url`
- Usar el tipo `EventCardData` de `sse-contract.ts`

### 5. Perfil / Wishlist
- Lista de lugares guardados
- Cada item es un PlaceCard compacto
- Poder quitar de guardados
- Datos del usuario (nombre, email)
- Enlace para editar preferencias

### 6. Feedback (modal o drawer)
- Se abre desde un PlaceCard guardado
- Calificación 1-5 estrellas (tappable)
- Comentario breve (textarea)
- Botón de enviar

## Diseño y UX

### Paleta sugerida (Medellín-inspired)
- Primario: Verde montaña (#2D6A4F o similar)
- Acento: Naranja cálido (#E76F51)
- Background: Cream suave (#FEFAE0) o blanco
- Texto: Gris oscuro (#1B1B1B)
- Cards: Blanco con sombra suave

### Principios
- **Mobile-first**: diseñar para 375px y escalar hacia arriba
- **Touch-friendly**: botones mínimo 44px, spacing generoso
- **Chat es el centro**: el 80% del tiempo el usuario está en la vista de chat
- **Cards destacan**: son el diferenciador visual, deben verse hermosas con fotos grandes
- **Personalidad paisa**: el diseño debe sentirse cálido y acogedor, no corporativo

### Navegación
- Bottom tab bar con 3 tabs: Chat (principal), Guardados, Perfil
- El chat se abre por defecto

## Cómo probar
1. `npm run dev`
2. La app arranca con mock data automáticamente
3. Escribe cualquier mensaje en el chat — el mock responde con escenarios diferentes según las palabras clave:
   - "comer" / "restaurante" → recomendaciones de comida
   - "noche" / "bar" → vida nocturna
   - "cultura" / "museo" → planes culturales
   - "deporte" / "naturaleza" → actividades al aire libre
   - Cualquier otra cosa → respuesta genérica de bienvenida

## Reglas importantes
- NUNCA modificar `sse-contract.ts` sin avisar al equipo
- Los componentes PlaceCard y EventCard deben ser reutilizables (se usan en chat Y en wishlist)
- El hook `useChat` ya maneja toda la lógica del stream — los componentes solo leen estado
- Cuando el backend esté listo, solo hay que cambiar `VITE_USE_MOCK=false` y poner la URL real
