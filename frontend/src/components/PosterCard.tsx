import { Heart, MapPin, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DbPlace } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { useI18n } from "@/lib/i18n";

const DAY_ES = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const DAY_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDateBadge(start: string | null, end: string | null, lang: "es" | "en") {
  if (!start) return null;
  const days = lang === "es" ? DAY_ES : DAY_EN;
  const s = new Date(start);
  const startStr = `${days[s.getDay()]}\n${String(s.getDate()).padStart(2, "0")}/${String(s.getMonth() + 1).padStart(2, "0")}`;
  if (!end) return { single: true as const, startStr };
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) return { single: true as const, startStr };
  const endStr = `${String(e.getDate()).padStart(2, "0")}/${String(e.getMonth() + 1).padStart(2, "0")}`;
  return { single: false as const, startStr, endStr };
}

export function PosterCard({ place, onClick }: { place: DbPlace; onClick?: () => void }) {
  const { user } = useAuth();
  const { lang } = useI18n();
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

  const date = formatDateBadge(place.starts_at, place.ends_at, lang);
  const typeLabel = TYPE_LABEL[place.type]?.toUpperCase() ?? "";

  return (
    <article
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-white/10 transition-all hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <SafeImage
          src={place.image_url}
          alt={place.name}
          category={place.category || place.type}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Date badge */}
        {date && (
          <div className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-extrabold leading-none text-foreground shadow-md backdrop-blur">
            {date.single ? (
              <span className="block whitespace-pre text-center">{date.startStr}</span>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="whitespace-pre text-center">{date.startStr}</span>
                <span className="text-[8px] text-muted-foreground">—</span>
                <span className="text-center">{date.endStr}</span>
              </div>
            )}
          </div>
        )}
        {/* Heart */}
        <button
          onClick={toggle}
          aria-label={saved ? "Quitar" : "Guardar"}
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition",
            saved ? "bg-coral text-white scale-110" : "bg-black/30 text-white hover:bg-black/50"
          )}
        >
          <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        </button>

        {/* Type chip bottom-right of image */}
        {typeLabel && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <Link2 className="h-3 w-3" />
            {typeLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="px-3 py-3 text-center">
        <h3 className="line-clamp-2 text-sm font-extrabold uppercase leading-tight tracking-wide">
          {place.name}
        </h3>
      </div>

      {/* Footer with venue */}
      <div className="mt-auto border-t border-white/10 bg-white/[0.03] px-3 py-2 text-center">
        <p className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{place.neighborhood ?? place.category ?? ""}</span>
        </p>
      </div>
    </article>
  );
}
