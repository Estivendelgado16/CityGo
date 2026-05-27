import { Heart, MapPin, Star } from "lucide-react";
import { type Place, VIBE_META } from "@/lib/mock-data";
import { useWishlist } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";

const VIBE_CLASSES: Record<string, string> = {
  coral: "bg-coral/15 text-coral border-coral/30",
  jungle: "bg-jungle/15 text-jungle border-jungle/30",
  magenta: "bg-magenta/15 text-magenta border-magenta/30",
};

export function PlaceCard({ place }: { place: Place }) {
  const { has, toggle } = useWishlist();
  const saved = has(place.id);

  return (
    <article className="group relative overflow-hidden rounded-3xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage
          src={place.image}
          alt={place.name}
          category={`${place.category} ${place.vibes.join(" ")}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <button
          onClick={() => toggle(place.id)}
          aria-label={saved ? "Quitar de mis planes" : "Guardar en mis planes"}
          className={cn(
            "absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition-all",
            saved
              ? "bg-coral text-coral-foreground scale-110"
              : "bg-white/80 text-foreground hover:bg-white"
          )}
        >
          <Heart className={cn("h-5 w-5", saved && "fill-current")} />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-sun text-sun" />
          {place.rating}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight">{place.name}</h3>
            <span className="shrink-0 text-sm font-semibold text-muted-foreground">
              {"$".repeat(place.priceLevel)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {place.neighborhood} · {place.category}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{place.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {place.vibes.map((v) => {
            const meta = VIBE_META[v];
            return (
              <span
                key={v}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  VIBE_CLASSES[meta.color]
                )}
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>
    </article>
  );
}
