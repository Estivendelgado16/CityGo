import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import ChatInput from "../components/ChatInput";
import PlaceCard from "../components/PlaceCard";
import EventCard from "../components/EventCard";
import { ThinkingIndicator } from "../components/ThinkingIndicator";

export default function ChatPage() {
  const { messages, isLoading, isThinking, thinkingText, error, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-display font-bold text-sm">
          P
        </div>
        <div>
          <h1 className="font-semibold text-sm text-gray-900">Parcero</h1>
          <p className="text-xs text-gray-400">Tu guía en Medellín</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <span className="text-3xl">🏔️</span>
            </div>
            <h2 className="font-display text-xl font-bold text-gray-800 mb-2">
              ¡Hola parce!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Soy tu guía local en Medellín. Pregúntame por restaurantes, bares,
              eventos, planes culturales o actividades al aire libre.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                "¿Dónde comer algo rico?",
                "¿Qué hay esta noche?",
                "Quiero hacer senderismo",
                "Plan cultural para hoy",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Texto del mensaje */}
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.isStreaming && msg.content && (
                  <span className="inline-block w-1.5 h-4 bg-primary-400 rounded-sm ml-0.5 animate-pulse" />
                )}
              </div>
            </div>

            {/* Cards de lugares */}
            {msg.place_cards.map((place) => (
              <PlaceCard key={place.place_id} place={place} />
            ))}

            {/* Cards de eventos */}
            {msg.event_cards.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && <ThinkingIndicator text={thinkingText} />}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
