// =============================================================================
// CONTRATO SSE — Agente Turístico Medellín
// =============================================================================
// Este archivo es la ÚNICA fuente de verdad para la comunicación entre
// frontend y backend vía Server-Sent Events (SSE).
//
// - P1 (Frontend) usa estos tipos para parsear y renderizar.
// - P5 (Backend/SSE) usa estos tipos para serializar y emitir.
// - P4 (Agente) produce los datos que P5 empaqueta en estos eventos.
//
// REGLA: Cualquier cambio aquí debe ser acordado entre P1, P4 y P5.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. EVENTOS SSE (Backend → Frontend)
// -----------------------------------------------------------------------------

/**
 * Texto streameado del agente. Llega en fragmentos pequeños.
 * El frontend los concatena y renderiza progresivamente.
 */
export type TextDeltaEvent = {
  type: "text_delta";
  content: string;
};

/**
 * Card de lugar. Se renderiza como componente visual dentro del chat.
 * Llega completa (no streameada), una por evento.
 */
export type PlaceCardEvent = {
  type: "place_card";
  data: PlaceCardData;
};

/**
 * Card de evento. Similar a PlaceCard pero para eventos con fecha.
 */
export type EventCardEvent = {
  type: "event_card";
  data: EventCardData;
};

/**
 * Indicador de que el agente está usando herramientas.
 * El frontend muestra un estado de "pensando" con el texto proporcionado.
 */
export type ThinkingEvent = {
  type: "thinking";
  content: string;
};

/**
 * Error durante el procesamiento. El frontend muestra un mensaje amigable.
 */
export type ErrorEvent = {
  type: "error";
  code: "rate_limit" | "agent_error" | "auth_error" | "server_error";
  message: string;
};

/**
 * Fin del stream. Indica que el agente terminó de responder.
 */
export type DoneEvent = {
  type: "done";
  message_id: string;
  conversation_id: string;
};

/**
 * Unión de todos los eventos posibles.
 * El frontend hace switch(event.type) para decidir qué renderizar.
 */
export type SSEEvent =
  | TextDeltaEvent
  | PlaceCardEvent
  | EventCardEvent
  | ThinkingEvent
  | ErrorEvent
  | DoneEvent;

// -----------------------------------------------------------------------------
// 2. DATOS DE CARDS
// -----------------------------------------------------------------------------

export type PlaceCategory =
  | "restaurante"
  | "bar"
  | "discoteca"
  | "cultura"
  | "deporte";

export type EventCategory =
  | "concierto"
  | "fiesta"
  | "cultural"
  | "deportivo"
  | "gastronomico";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export interface PlaceCardData {
  place_id: string;
  name: string;
  category: PlaceCategory;
  description: string;          // Resumen corto generado por el agente
  vibe_tags: string[];           // Ej: ["rooftop", "romántico", "live music"]
  price_range: PriceRange;
  image_url: string;
  rating: number;                // 1.0 - 5.0
  total_reviews: number;
  address: string;
  zone: string;                  // "El Poblado" | "Laureles" | "Centro" | etc.
  is_open_now?: boolean;
}

export interface EventCardData {
  event_id: string;
  name: string;
  category: EventCategory;
  description: string;
  venue_name: string;
  event_date: string;            // "YYYY-MM-DD"
  start_time?: string;           // "HH:MM"
  end_time?: string;
  price_range?: PriceRange;
  image_url: string;
  ticket_url?: string;
  vibe_tags: string[];
}

// -----------------------------------------------------------------------------
// 3. REQUEST DEL CHAT (Frontend → Backend)
// -----------------------------------------------------------------------------

export interface ChatRequest {
  message: string;
  conversation_id: string | null; // null = nueva conversación
}

// -----------------------------------------------------------------------------
// 4. DATOS DE USUARIO Y PREFERENCIAS
// -----------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferred_language: "es" | "en";
  onboarding_completed: boolean;
}

export interface UserPreferences {
  budget_range: PriceRange | null;
  favorite_cuisines: string[];
  preferred_vibes: string[];
  preferred_zones: string[];
  dietary_restrictions: string[];
  interests: string[];
}

export interface OnboardingRequest {
  budget_range: PriceRange;
  favorite_cuisines: string[];
  preferred_vibes: string[];
  preferred_zones: string[];
  dietary_restrictions: string[];
  interests: string[];
}

// -----------------------------------------------------------------------------
// 5. WISHLIST Y FEEDBACK
// -----------------------------------------------------------------------------

export interface SavedPlace {
  place_id: string;
  saved_at: string;
  place: PlaceCardData;
}

export interface FeedbackRequest {
  rating: number;               // 1-5
  comment: string;
  visited_at?: string;          // "YYYY-MM-DD"
}

export interface FeedbackItem {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  visited_at: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// 6. CONVERSACIONES
// -----------------------------------------------------------------------------

export interface Conversation {
  id: string;
  last_message_preview: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  place_cards?: PlaceCardData[];
  event_cards?: EventCardData[];
  created_at: string;
}

// -----------------------------------------------------------------------------
// 7. RESPUESTAS DE API (REST, no SSE)
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// -----------------------------------------------------------------------------
// 8. ENDPOINTS REFERENCE
// -----------------------------------------------------------------------------
//
// AUTH:
//   POST /api/auth/register    → { email, password, name }
//   POST /api/auth/login       → { email, password } → { token, user }
//
// ONBOARDING:
//   POST /api/onboarding       → OnboardingRequest → UserProfile
//
// USER:
//   GET  /api/me               → UserProfile & { preferences: UserPreferences }
//
// CHAT (SSE):
//   POST /api/chat             → ChatRequest → text/event-stream (SSEEvent[])
//
// CONVERSATIONS:
//   GET  /api/conversations                    → Conversation[]
//   GET  /api/conversations/:id/messages       → ChatMessage[]
//
// PLACES:
//   GET  /api/places/:id                       → PlaceCardData (full details)
//   POST /api/places/:id/save                  → { saved: true }
//   DELETE /api/places/:id/save                → { saved: false }
//   GET  /api/saved-places                     → SavedPlace[]
//   POST /api/places/:id/feedback              → FeedbackRequest → FeedbackItem
//   GET  /api/places/:id/feedback              → FeedbackItem[]
// -----------------------------------------------------------------------------
