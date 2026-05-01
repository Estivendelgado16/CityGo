// =============================================================================
// useChat Hook — Consume el stream SSE (mock o real)
// =============================================================================
// Este hook maneja toda la lógica del chat:
// - Enviar mensajes
// - Consumir el stream SSE evento por evento
// - Acumular texto, cards, y estados de "pensando"
//
// En desarrollo usa mockChatStream. En producción usa el endpoint real.
// El switch se hace con la variable de entorno VITE_USE_MOCK.
// =============================================================================

import { useState, useCallback, useRef } from "react";
import type {
  SSEEvent,
  PlaceCardData,
  EventCardData,
} from "../types/sse-contract";
import { mockChatStream } from "../mocks/mock-sse";

// Determina si usar mock o backend real
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ChatMessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  place_cards: PlaceCardData[];
  event_cards: EventCardData[];
  isStreaming: boolean;
}

interface UseChatReturn {
  messages: ChatMessageUI[];
  isLoading: boolean;
  isThinking: boolean;
  thinkingText: string;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  conversationId: string | null;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);
      setIsThinking(false);

      // Agregar mensaje del usuario
      const userMsg: ChatMessageUI = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text,
        place_cards: [],
        event_cards: [],
        isStreaming: false,
      };

      // Crear placeholder para la respuesta del asistente
      const assistantMsg: ChatMessageUI = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
        place_cards: [],
        event_cards: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        if (USE_MOCK) {
          await consumeMockStream(text, assistantMsg.id);
        } else {
          await consumeRealStream(text, assistantMsg.id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al conectar con el agente"
        );
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        setThinkingText("");
        // Marcar que el stream terminó
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
          )
        );
      }
    },
    [isLoading, conversationId]
  );

  // --- MOCK STREAM ---
  async function consumeMockStream(text: string, assistantMsgId: string) {
    const stream = mockChatStream(text);
    for await (const event of stream) {
      handleSSEEvent(event, assistantMsgId);
    }
  }

  // --- REAL STREAM (SSE via fetch) ---
  async function consumeRealStream(text: string, assistantMsgId: string) {
    abortRef.current = new AbortController();

    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: text,
        conversation_id: conversationId,
      }),
      signal: abortRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No se pudo abrir el stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event: SSEEvent = JSON.parse(line.slice(6));
            handleSSEEvent(event, assistantMsgId);
          } catch {
            // Ignorar líneas que no son JSON válido
          }
        }
      }
    }
  }

  // --- MANEJAR CADA EVENTO SSE ---
  function handleSSEEvent(event: SSEEvent, assistantMsgId: string) {
    switch (event.type) {
      case "text_delta":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + event.content }
              : m
          )
        );
        setIsThinking(false);
        break;

      case "place_card":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, place_cards: [...m.place_cards, event.data] }
              : m
          )
        );
        break;

      case "event_card":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, event_cards: [...m.event_cards, event.data] }
              : m
          )
        );
        break;

      case "thinking":
        setIsThinking(true);
        setThinkingText(event.content);
        break;

      case "error":
        setError(event.message);
        break;

      case "done":
        setConversationId(event.conversation_id);
        break;
    }
  }

  return {
    messages,
    isLoading,
    isThinking,
    thinkingText,
    error,
    sendMessage,
    conversationId,
  };
}
