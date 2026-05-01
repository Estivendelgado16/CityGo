import { Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";
import type { PlaceCardData } from "../types/sse-contract";

interface Props {
  place: PlaceCardData;
  compact?: boolean;
}

export default function PlaceCard({ place, compact = false }: Props) {
  const [saved, setSaved] = useState(false);

  const categoryEmoji: Record<string, string> = {
    restaurante: "🍽️",
    bar: "🍸",
    discoteca: "🪩",
    cultura: "🎨",
    deporte: "🏃",
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${compact ? "" : "my-3"}`}>
      {/* Imagen */}
      <div className="relative">
        <img
          src={place.image_url}
          alt={place.name}
          className={`w-full object-cover ${compact ? "h-32" : "h-44"}`}
        />
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90"
        >
          <Heart
            size={18}
            className={saved ? "fill-red-500 text-red-500" : "text-gray-600"}
          />
        </button>
        {place.is_open_now !== undefined && (
          <span
            className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${
              place.is_open_now
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {place.is_open_now ? "Abierto" : "Cerrado"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">
              {categoryEmoji[place.category] || "📍"} {place.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <MapPin size={13} />
              <span>{place.zone}</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-accent-600">{place.price_range}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-lg shrink-0">
            <Star size={13} className="fill-primary-500 text-primary-500" />
            <span className="text-sm font-semibold text-primary-700">{place.rating}</span>
            <span className="text-xs text-primary-500">({place.total_reviews})</span>
          </div>
        </div>

        {!compact && place.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Vibe tags */}
        {place.vibe_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {place.vibe_tags.slice(0, compact ? 2 : 4).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
