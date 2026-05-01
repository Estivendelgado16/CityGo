// =============================================================================
// MOCK SSE SERVICE — Para desarrollo frontend sin backend
// =============================================================================
// Simula el comportamiento exacto del endpoint POST /api/chat
// incluyendo streaming progresivo, eventos de "thinking", y cards.
//
// USO:
//   import { mockChatStream } from "./mock-sse";
//   const stream = mockChatStream("Quiero comer algo rico esta noche");
//   for await (const event of stream) {
//     switch (event.type) { ... }
//   }
//
// Cuando el backend real esté listo (semana 2), se reemplaza esta función
// por la conexión real al endpoint /api/chat sin cambiar nada en los componentes.
// =============================================================================

import type {
  SSEEvent,
  PlaceCardData,
  EventCardData,
  UserProfile,
  UserPreferences,
  SavedPlace,
  FeedbackItem,
  Conversation,
  ChatMessage,
} from "../types/sse-contract";

// -----------------------------------------------------------------------------
// MOCK DATA: Lugares reales de Medellín
// -----------------------------------------------------------------------------

export const MOCK_PLACES: PlaceCardData[] = [
  {
    place_id: "place_001",
    name: "El Cielo",
    category: "restaurante",
    description:
      "Restaurante de autor del chef Juan Manuel Barrientos. Cocina colombiana contemporánea con técnicas de vanguardia y experiencia multisensorial.",
    vibe_tags: ["fine dining", "experiencia", "innovador"],
    price_range: "$$$$",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
    rating: 4.8,
    total_reviews: 234,
    address: "Cra. 40 #10A-22, El Poblado",
    zone: "El Poblado",
    is_open_now: true,
  },
  {
    place_id: "place_002",
    name: "Mondongos",
    category: "restaurante",
    description:
      "El clásico de la cocina paisa. Bandeja paisa generosa, mondongo tradicional y ambiente familiar. Llevan más de 40 años en Medellín.",
    vibe_tags: ["tradicional", "familiar", "abundante"],
    price_range: "$",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
    rating: 4.5,
    total_reviews: 1893,
    address: "Cra. 70 #44B-41, Laureles",
    zone: "Laureles",
    is_open_now: true,
  },
  {
    place_id: "place_003",
    name: "Alambique",
    category: "bar",
    description:
      "Coctelería artesanal con ingredientes colombianos. Ambiente íntimo con terraza y vista a la ciudad. Los bartenders preparan cócteles personalizados según tu gusto.",
    vibe_tags: ["rooftop", "cócteles", "romántico", "vista"],
    price_range: "$$$",
    image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600",
    rating: 4.6,
    total_reviews: 312,
    address: "Cra. 37 #8A-37, El Poblado",
    zone: "El Poblado",
    is_open_now: true,
  },
  {
    place_id: "place_004",
    name: "Salon Malaga",
    category: "bar",
    description:
      "Tanguería legendaria en el centro de Medellín. Más de 60 años sirviendo aguardiente y poniendo tangos. Patrimonio cultural de la ciudad.",
    vibe_tags: ["tango", "histórico", "auténtico", "centro"],
    price_range: "$",
    image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600",
    rating: 4.3,
    total_reviews: 567,
    address: "Cra. 51 #45-80, Centro",
    zone: "Centro",
    is_open_now: false,
  },
  {
    place_id: "place_005",
    name: "Museo de Antioquia",
    category: "cultura",
    description:
      "Museo principal de la ciudad con la colección más grande de obras de Fernando Botero. Ubicado en la Plaza Botero con sus icónicas esculturas al aire libre.",
    vibe_tags: ["arte", "Botero", "histórico", "imperdible"],
    price_range: "$",
    image_url: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600",
    rating: 4.7,
    total_reviews: 2341,
    address: "Cra. 52 #52-43, Centro",
    zone: "Centro",
    is_open_now: true,
  },
  {
    place_id: "place_006",
    name: "Parque Arví",
    category: "deporte",
    description:
      "Reserva natural a 30 minutos en metrocable desde el centro. Senderos ecológicos, avistamiento de aves, y mercado campesino los domingos.",
    vibe_tags: ["naturaleza", "senderismo", "aire libre", "metrocable"],
    price_range: "$",
    image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
    rating: 4.6,
    total_reviews: 1456,
    address: "Corregimiento de Santa Elena",
    zone: "Santa Elena",
    is_open_now: true,
  },
];

export const MOCK_EVENTS: EventCardData[] = [
  {
    event_id: "event_001",
    name: "Salsa al Parque",
    category: "concierto",
    description:
      "Noche de salsa en vivo con orquestas locales. Pista de baile al aire libre y clase de salsa para principiantes a las 7pm.",
    venue_name: "Parque de los Deseos",
    event_date: new Date().toISOString().split("T")[0],
    start_time: "19:00",
    end_time: "23:00",
    price_range: "$",
    image_url: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600",
    vibe_tags: ["salsa", "baile", "en vivo", "al aire libre"],
  },
  {
    event_id: "event_002",
    name: "Feria Gastronómica del Poblado",
    category: "gastronomico",
    description:
      "Más de 30 restaurantes locales con platos de degustación a precios especiales. Cocina fusión, paisa, japonesa y más.",
    venue_name: "Parque Lleras",
    event_date: new Date().toISOString().split("T")[0],
    start_time: "12:00",
    end_time: "22:00",
    price_range: "$$",
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    vibe_tags: ["comida", "degustación", "variado", "familiar"],
  },
];

// -----------------------------------------------------------------------------
// MOCK USER DATA
// -----------------------------------------------------------------------------

export const MOCK_USER: UserProfile = {
  id: "user_mock_001",
  email: "test@parcero.app",
  name: "Carlos",
  preferred_language: "es",
  onboarding_completed: true,
};

export const MOCK_PREFERENCES: UserPreferences = {
  budget_range: "$$",
  favorite_cuisines: ["colombiana", "japonesa", "italiana"],
  preferred_vibes: ["tranquilo", "rooftop", "live music"],
  preferred_zones: ["El Poblado", "Laureles"],
  dietary_restrictions: [],
  interests: ["gastronomía", "vida nocturna", "cultura"],
};

export const MOCK_SAVED_PLACES: SavedPlace[] = [
  {
    place_id: "place_001",
    saved_at: "2026-04-28T10:00:00Z",
    place: MOCK_PLACES[0],
  },
  {
    place_id: "place_003",
    saved_at: "2026-04-27T15:30:00Z",
    place: MOCK_PLACES[2],
  },
];

export const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: "fb_001",
    user_name: "María L.",
    rating: 5,
    comment: "Increíble experiencia. Los cócteles con lulo estaban espectaculares.",
    visited_at: "2026-04-20",
    created_at: "2026-04-21T10:00:00Z",
  },
  {
    id: "fb_002",
    user_name: "Juan P.",
    rating: 4,
    comment: "Muy buen ambiente, la terraza tiene una vista brutal. Un poco caro pero vale la pena para ocasiones especiales.",
    visited_at: "2026-04-15",
    created_at: "2026-04-16T09:00:00Z",
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_001",
    last_message_preview: "¡Encontré unos bares increíbles para esta noche!",
    updated_at: "2026-04-28T22:00:00Z",
  },
  {
    id: "conv_002",
    last_message_preview: "El Parque Arví es perfecto para lo que buscas...",
    updated_at: "2026-04-27T14:00:00Z",
  },
];

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: "msg_001",
    role: "user",
    content: "Quiero salir esta noche pero no sé qué hacer",
    created_at: "2026-04-28T20:00:00Z",
  },
  {
    id: "msg_002",
    role: "assistant",
    content:
      "¡Ey parce! Esta noche hay varias opciones buenísimas. Encontré un evento de salsa en vivo y un bar con terraza que te va a encantar. Mira esto:",
    place_cards: [MOCK_PLACES[2]],
    event_cards: [MOCK_EVENTS[0]],
    created_at: "2026-04-28T20:00:05Z",
  },
];

// -----------------------------------------------------------------------------
// MOCK SSE STREAM
// -----------------------------------------------------------------------------

/**
 * Simula el stream SSE del endpoint /api/chat.
 * Devuelve un AsyncGenerator que emite eventos con delays realistas.
 *
 * Escenarios que simula:
 * - Siempre empieza con un evento "thinking"
 * - Luego streemea texto palabra por palabra
 * - Intercala cards de lugares/eventos cuando es relevante
 * - Termina con un evento "done"
 */
export async function* mockChatStream(
  userMessage: string
): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const msgLower = userMessage.toLowerCase();

  // 1. Thinking
  yield { type: "thinking", content: "Buscando las mejores opciones para ti..." };
  await delay(1200);

  // 2. Decidir escenario según el mensaje
  if (msgLower.includes("comer") || msgLower.includes("restaurante") || msgLower.includes("comida")) {
    yield* streamRestaurantResponse();
  } else if (msgLower.includes("noche") || msgLower.includes("bar") || msgLower.includes("salir")) {
    yield* streamNightlifeResponse();
  } else if (msgLower.includes("cultura") || msgLower.includes("museo") || msgLower.includes("arte")) {
    yield* streamCultureResponse();
  } else if (msgLower.includes("deporte") || msgLower.includes("caminar") || msgLower.includes("naturaleza")) {
    yield* streamSportsResponse();
  } else {
    yield* streamGenericResponse();
  }

  // 3. Done
  await delay(300);
  yield {
    type: "done",
    message_id: `msg_${Date.now()}`,
    conversation_id: "conv_mock_001",
  };
}

// --- Escenarios de respuesta ---

async function* streamRestaurantResponse(): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const words = "¡Parce, tengo unas recomendaciones que te van a encantar! 🍽️ Como te gusta la buena mesa, mira estas dos opciones que van desde lo más auténtico paisa hasta alta cocina:".split(" ");
  for (const word of words) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }

  await delay(200);
  yield { type: "place_card", data: MOCK_PLACES[1] }; // Mondongos
  await delay(300);
  yield { type: "place_card", data: MOCK_PLACES[0] }; // El Cielo
  await delay(200);

  const words2 = "Mondongos es el clásico que no falla — bandeja paisa generosa y precios súper accesibles. Si quieres algo más especial, El Cielo es una experiencia gastronómica de otro nivel. ¿Te interesa ver el menú de alguno? 😊".split(" ");
  for (const word of words2) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }
}

async function* streamNightlifeResponse(): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  yield { type: "thinking", content: "Revisando eventos de esta noche y bares populares..." };
  await delay(800);

  const words = "¡Esta noche hay plan! 🎶 Encontré un evento de salsa en vivo y un bar con terraza que tiene vista a toda la ciudad:".split(" ");
  for (const word of words) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }

  await delay(200);
  yield { type: "event_card", data: MOCK_EVENTS[0] }; // Salsa al Parque
  await delay(300);
  yield { type: "place_card", data: MOCK_PLACES[2] }; // Alambique
  await delay(200);

  const words2 = "Si te gusta el baile, la salsa en el Parque de los Deseos es gratis y tiene clase para principiantes. Si prefieres algo más chill, Alambique tiene unos cócteles con ingredientes colombianos que son una locura. ¿Cuál te llama más?".split(" ");
  for (const word of words2) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }
}

async function* streamCultureResponse(): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const words = "¡Medellín tiene una escena cultural increíble! 🎨 Te recomiendo arrancar por acá:".split(" ");
  for (const word of words) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }

  await delay(200);
  yield { type: "place_card", data: MOCK_PLACES[4] }; // Museo de Antioquia
  await delay(200);

  const words2 = "El Museo de Antioquia es imperdible — tiene la colección de Botero más grande del mundo y en la plaza de afuera hay esculturas enormes que son íconicas. La entrada es súper económica. ¿Quieres que busque más opciones culturales?".split(" ");
  for (const word of words2) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }
}

async function* streamSportsResponse(): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const words = "¡Dale que Medellín tiene naturaleza de sobra! 🌿 Mira esta joya:".split(" ");
  for (const word of words) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }

  await delay(200);
  yield { type: "place_card", data: MOCK_PLACES[5] }; // Parque Arví
  await delay(200);

  const words2 = "Parque Arví es brutal — llegas en metrocable desde Santo Domingo y el viaje ya es una experiencia con vistas increíbles del valle. Allá hay senderos para todos los niveles y los domingos hay mercado campesino con productos orgánicos. ¿Te busco más opciones de senderismo?".split(" ");
  for (const word of words2) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }
}

async function* streamGenericResponse(): AsyncGenerator<SSEEvent> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const words = "¡Hola parce! 👋 Estoy aquí para ayudarte a descubrir lo mejor de Medellín. Puedo recomendarte restaurantes, bares, eventos, planes culturales o actividades al aire libre. ¿Qué se te antoja hoy?".split(" ");
  for (const word of words) {
    yield { type: "text_delta", content: word + " " };
    await delay(40 + Math.random() * 30);
  }
}

// -----------------------------------------------------------------------------
// MOCK API FUNCTIONS (para reemplazar con fetch real en semana 2)
// -----------------------------------------------------------------------------

export const mockApi = {
  async login(_email: string, _password: string) {
    return { token: "mock_jwt_token", user: MOCK_USER };
  },

  async getProfile() {
    return { ...MOCK_USER, preferences: MOCK_PREFERENCES };
  },

  async saveOnboarding(_prefs: Partial<UserPreferences>) {
    return MOCK_USER;
  },

  async getSavedPlaces() {
    return MOCK_SAVED_PLACES;
  },

  async toggleSavePlace(placeId: string) {
    const exists = MOCK_SAVED_PLACES.find((s) => s.place_id === placeId);
    return { saved: !exists };
  },

  async submitFeedback(_placeId: string, _rating: number, _comment: string) {
    return MOCK_FEEDBACK[0];
  },

  async getFeedback(_placeId: string) {
    return MOCK_FEEDBACK;
  },

  async getConversations() {
    return MOCK_CONVERSATIONS;
  },

  async getMessages(_conversationId: string) {
    return MOCK_CHAT_HISTORY;
  },
};
