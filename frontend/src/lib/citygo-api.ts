import type { SSEEvent } from "@/types/sse-contract";
import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken(): string | null {
  const keys = Object.keys(localStorage);
  const authKey = keys.find(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
  );
  if (authKey) {
    try {
      const data = JSON.parse(localStorage.getItem(authKey) || "{}");
      return data.access_token || null;
    } catch {
      return null;
    }
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/";
      throw new Error("Sesión expirada");
    }
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || error.message || `Error ${response.status}`);
  }
  return response.json();
}

export async function* streamChat(
  message: string,
  conversationId: string | null,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent> {
  const token = getToken();
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  });

  if (!response.ok) throw new Error(`Chat error: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No stream");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
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
            yield event;
          } catch {}
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const citygoApi = {
  getProfile: () => request<{ data: unknown }>("/api/me"),

  completeOnboarding: (data: {
    lang: string;
    traveler: string;
    vibes: string[];
    budget: number;
  }) =>
    request("/api/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getFeed: () => request<{ data: unknown }>("/api/feed"),

  getConversations: () => request<{ data: unknown[] }>("/api/conversations"),

  deleteConversation: (id: string) =>
    request(`/api/conversations/${id}`, { method: "DELETE" }),

  getMessages: (conversationId: string) =>
    request<{ data: unknown[] }>(`/api/conversations/${conversationId}/messages`),

  getWishlist: () => request<{ data: unknown[] }>("/api/wishlist"),

  addToWishlist: (placeId: string) =>
    request(`/api/wishlist/${placeId}`, { method: "POST" }),

  removeFromWishlist: (placeId: string) =>
    request(`/api/wishlist/${placeId}`, { method: "DELETE" }),

  updateWishlist: (placeId: string, data: { note?: string; rating?: number }) =>
    request(`/api/wishlist/${placeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  submitFeedback: (placeId: string, rating: number, comment: string) =>
    request(`/api/places/${placeId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  getFeedback: (placeId: string) =>
    request<{ data: unknown[] }>(`/api/places/${placeId}/feedback`),
};
