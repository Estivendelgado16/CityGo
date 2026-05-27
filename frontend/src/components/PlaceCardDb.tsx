import { Heart, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { DbPlace } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";

export function PlaceCardDb({ place, onClick }: { place: DbPlace; onClick?: () => void }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wishlist")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("place_id", place.id)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, place.id]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (saved) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("place_id", place.id);
      setSaved(false);
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, place_id: place.id });
      setSaved(true);
    }
  };

  return (
    <article onClick={onClick} className="group relative cursor-pointer overflow-hidden rounded-3xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage src={place.image_url} alt={place.name} category={place.category || place.type} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <button onClick={toggle} aria-label={saved ? "Quitar" : "Guardar"} className={cn("absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition", saved ? "bg-coral text-white scale-110" : "bg-white/85 text-foreground hover:bg-white")}>
          <Heart className={cn("h-5 w-5", saved && "fill-current")} />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold backdrop-blur">
          <Star className="h-3 w-3 fill-sun text-sun" />{place.rating}
        </div>
        {place.is_event && (
          <span className="absolute top-3 left-3 rounded-full bg-magenta px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow">Evento</span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-bold">{place.name}</h3>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">{"$".repeat(place.price_level)}</span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {place.neighborhood} · {TYPE_LABEL[place.type]}
        </p>
      </div>
    </article>
  );
}
