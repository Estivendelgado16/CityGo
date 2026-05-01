import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { EventCardData } from "../types/sse-contract";

interface Props {
  event: EventCardData;
}

export default function EventCard({ event }: Props) {
  const categoryEmoji: Record<string, string> = {
    concierto: "🎵",
    fiesta: "🎉",
    cultural: "🎭",
    deportivo: "⚽",
    gastronomico: "🍴",
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden my-3">
      <div className="relative">
        <img src={event.image_url} alt={event.name} className="w-full h-36 object-cover" />
        <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-accent-100 text-accent-700">
          {categoryEmoji[event.category] || "🎉"} {event.category}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-gray-900">{event.name}</h3>

        <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{formatDate(event.event_date)}</span>
            {event.start_time && (
              <>
                <Clock size={13} className="ml-1" />
                <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ""}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} />
            <span>{event.venue_name}</span>
            {event.price_range && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-medium text-accent-600">{event.price_range}</span>
              </>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          {event.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.vibe_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Tickets <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
