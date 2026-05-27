import { useEffect, useState } from "react";
import { X, MapPin, Star, Heart, ExternalLink, Instagram, Globe, Phone, Calendar } from "lucide-react";
import type { DbPlace } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";

export function PlaceModal({ place, onClose }: { place: DbPlace | null; onClose: () => void }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!place || !user) return;
    supabase.from("wishlist").select("place_id").eq("user_id", user.id).eq("place_id", place.id).maybeSingle().then(({ data }) => setSaved(!!data));
  }, [place, user]);

  useEffect(() => {
    if (!place) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [place, onClose]);

  if (!place) return null;

  const toggle = async () => {
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-card shadow-glow sm:rounded-3xl animate-scale-in">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[5/3] w-full overflow-hidden">
          <SafeImage src={place.image_url} alt={place.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          {place.is_event && (
            <span className="absolute top-3 left-3 rounded-full bg-magenta px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow">Evento</span>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-coral">{TYPE_LABEL[place.type]}{place.category ? ` · ${place.category}` : ""}</p>
              <h2 className="mt-1 text-2xl font-bold leading-tight">{place.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {place.neighborhood}
                <span className="mx-2">·</span>
                <Star className="h-3.5 w-3.5 fill-sun text-sun" /> {place.rating}
                <span className="mx-2">·</span>
                <span className="font-semibold">{"$".repeat(place.price_level)}</span>
              </p>
            </div>
            <button onClick={toggle} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full transition", saved ? "bg-coral text-white" : "bg-muted text-foreground hover:bg-muted/80")}>
              <Heart className={cn("h-5 w-5", saved && "fill-current")} />
            </button>
          </div>

          {place.description && <p className="text-sm leading-relaxed text-foreground/85">{place.description}</p>}

          {place.is_event && (place.starts_at || place.ends_at) && (
            <div className="flex items-center gap-2 rounded-2xl bg-magenta/10 px-3 py-2 text-sm">
              <Calendar className="h-4 w-4 text-magenta" />
              <span>{new Date(place.starts_at!).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}{place.ends_at && ` — ${new Date(place.ends_at).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {place.maps_url && <Action href={place.maps_url} label="Cómo llegar" icon={<MapPin className="h-4 w-4" />} primary />}
            {place.website && <Action href={place.website} label="Sitio web" icon={<Globe className="h-4 w-4" />} />}
            {place.instagram && <Action href={place.instagram} label="Instagram" icon={<Instagram className="h-4 w-4" />} />}
            {place.tiktok && <Action href={place.tiktok} label="TikTok" icon={<ExternalLink className="h-4 w-4" />} />}
            {place.phone && <Action href={`tel:${place.phone}`} label={place.phone} icon={<Phone className="h-4 w-4" />} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Action({ href, label, icon, primary }: { href: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition", primary ? "bg-gradient-sunset text-white shadow-glow hover:scale-[1.02]" : "border border-border text-foreground hover:bg-muted")}>
      {icon} {label}
    </a>
  );
}
