export type TextDeltaEvent = {
  type: "text_delta";
  content: string;
};

export type PlaceCardData = {
  place_id: string;
  name: string;
  category: "restaurante" | "bar" | "discoteca" | "cultura" | "deporte";
  description: string;
  vibe_tags: string[];
  price_range: "$" | "$$" | "$$$" | "$$$$";
  price_min?: number;
  price_max?: number;
  image_url: string;
  rating: number;
  total_reviews: number;
  address: string;
  zone: string;
  is_open_now?: boolean;
};

export type EventCardData = {
  event_id: string;
  name: string;
  category: "concierto" | "fiesta" | "cultural" | "deportivo" | "gastronomico";
  description: string;
  venue_name: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  price_range?: string;
  image_url: string;
  ticket_url?: string;
  vibe_tags: string[];
};

export type PlaceCardEvent = { type: "place_card"; data: PlaceCardData };
export type EventCardEvent = { type: "event_card"; data: EventCardData };
export type ThinkingEvent = { type: "thinking"; content: string };
export type ErrorEvent = {
  type: "error";
  code: string;
  message: string;
};
export type DoneEvent = {
  type: "done";
  message_id: string;
  conversation_id: string;
};

export type SSEEvent =
  | TextDeltaEvent
  | PlaceCardEvent
  | EventCardEvent
  | ThinkingEvent
  | ErrorEvent
  | DoneEvent;
