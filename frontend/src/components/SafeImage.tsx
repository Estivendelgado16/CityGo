import { useState } from "react";
import fallbackHero from "@/assets/medellin-hero.jpg";
import fallbackGastro from "@/assets/vibe-gastro.jpg";
import fallbackRumba from "@/assets/vibe-rumba.jpg";
import fallbackCultura from "@/assets/vibe-cultura.jpg";
import fallbackNaturaleza from "@/assets/vibe-naturaleza.jpg";
import fallbackCafe from "@/assets/vibe-cafe.jpg";
import fallbackDeporte from "@/assets/vibe-deporte.jpg";
import fallbackNight from "@/assets/street-night.jpg";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Optional category/type/vibe used to pick a smart fallback. */
  category?: string | null;
};

/** Pick a thematic fallback by category keyword. */
function pickFallback(category?: string | null) {
  const c = (category || "").toLowerCase();
  if (/(restaurant|food|gastro|comida|cafe|brunch|bakery|bar.*food)/.test(c)) return fallbackGastro;
  if (/(café|coffee|cafeter)/.test(c)) return fallbackCafe;
  if (/(bar|night|club|rumba|disco|cocktail)/.test(c)) return fallbackRumba;
  if (/(museum|museo|cultur|art|gallery|teatro)/.test(c)) return fallbackCultura;
  if (/(park|parque|nature|natural|jardín|jardin|hike|trail|montaña|mountain)/.test(c)) return fallbackNaturaleza;
  if (/(sport|deporte|gym|fitness|cicl|run)/.test(c)) return fallbackDeporte;
  if (/(event|festival|concierto|concert|show)/.test(c)) return fallbackNight;
  return fallbackHero;
}

/** <img> with onError fallback to a thematic city photo. */
export function SafeImage({ src, alt = "", className, category, ...rest }: Props) {
  const [errored, setErrored] = useState(false);
  const fb = pickFallback(category);
  const finalSrc = !src || errored ? fb : src;
  return (
    <img
      {...rest}
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      loading={rest.loading ?? "lazy"}
    />
  );
}
