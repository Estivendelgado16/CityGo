import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Heart, MessageCircle, Compass, Globe } from "lucide-react";
import heroImg from "@/assets/medellin-hero.jpg";
import comuna13Img from "@/assets/street-comuna13.jpg";
import nightImg from "@/assets/street-night.jpg";
import mountainsImg from "@/assets/street-mountains.jpg";
import vibeRumba from "@/assets/vibe-rumba.jpg";
import vibeGastro from "@/assets/vibe-gastro.jpg";
import vibeCultura from "@/assets/vibe-cultura.jpg";
import vibeDeporte from "@/assets/vibe-deporte.jpg";
import vibeNaturaleza from "@/assets/vibe-naturaleza.jpg";
import vibeCafe from "@/assets/vibe-cafe.jpg";
import vibeBaseImg from "@/assets/scene-vibe-base.jpg";
import { AppHeader } from "@/components/AppHeader";
import { CityGoLogo } from "@/components/CityGoLogo";
import { LoginModal } from "@/components/LoginModal";
import { PlaceCard } from "@/components/PlaceCard";
import { SafeImage } from "@/components/SafeImage";
import { PLACES, VIBE_META, type Vibe } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CityGo — Cuéntanos qué se te antoja y arma tu plan en segundos" },
      {
        name: "description",
        content:
          "CityGo te ayuda a descubrir Medellín de la mano de nuestro equipo local. Cuéntanos qué se te antoja y en segundos tienes tu ruta: gastro, rumba, cultura, naturaleza.",
      },
      { property: "og:title", content: "CityGo — Cuéntanos qué se te antoja" },
      {
        property: "og:description",
        content: "Nuestro equipo local te arma tu plan en segundos.",
      },
    ],
  }),
  component: Landing,
});

const VIBES: Vibe[] = ["rumba", "gastro", "cultura", "deporte", "naturaleza", "café"];

const VIBE_GALLERY: Record<Vibe, { hero: string; tagline: string; spots: { name: string; img: string; tag: string }[] }> = {
  rumba: {
    hero: vibeRumba,
    tagline: "La 70 prendida, Provenza con sabor a salsa y rooftops con vista al valle.",
    spots: [
      { name: "Provenza", img: vibeRumba, tag: "Bares & rooftops" },
      { name: "La 70", img: nightImg, tag: "Salsa & cerveza" },
      { name: "Salón Amador", img: PLACES[0].image, tag: "Techno · El Poblado" },
    ],
  },
  gastro: {
    hero: vibeGastro,
    tagline: "Cocina de autor paisa, mercados creativos y bandeja reinventada.",
    spots: [
      { name: "Carmen", img: PLACES[1].image, tag: "Autor · El Poblado" },
      { name: "Mercado del Río", img: vibeGastro, tag: "Food hall" },
      { name: "Pergamino", img: PLACES[3].image, tag: "Café paisa" },
    ],
  },
  cultura: {
    hero: vibeCultura,
    tagline: "Plaza Botero, Comuna 13 y los museos que cuentan la transformación.",
    spots: [
      { name: "Plaza Botero", img: vibeCultura, tag: "Esculturas icónicas" },
      { name: "Comuna 13", img: comuna13Img, tag: "Graffiti tour" },
      { name: "MAMM", img: PLACES[2].image, tag: "Museo de arte" },
    ],
  },
  deporte: {
    hero: vibeDeporte,
    tagline: "MTB en las laderas, parapente en San Félix y running por el Río.",
    spots: [
      { name: "Cerro Nutibara", img: vibeDeporte, tag: "Running · trail" },
      { name: "San Félix", img: mountainsImg, tag: "Parapente" },
      { name: "Vía Las Palmas", img: PLACES[4].image, tag: "Ciclismo" },
    ],
  },
  naturaleza: {
    hero: vibeNaturaleza,
    tagline: "Bosque de niebla en Arví, jardines secretos y aire puro a 2.500 m.",
    spots: [
      { name: "Parque Arví", img: vibeNaturaleza, tag: "Bosque · Metrocable" },
      { name: "Jardín Botánico", img: PLACES[4].image, tag: "Jardín urbano" },
      { name: "Cerro El Volador", img: mountainsImg, tag: "Mirador 360°" },
    ],
  },
  café: {
    hero: vibeCafe,
    tagline: "Microlotes paisas, baristas premiados y patios para quedarse horas.",
    spots: [
      { name: "Pergamino", img: vibeCafe, tag: "Tostador local" },
      { name: "Hija Mía", img: PLACES[3].image, tag: "Specialty bar" },
      { name: "Café Velvet", img: vibeGastro, tag: "Brunch & filtrado" },
    ],
  },
};

/** Sección con imagen de fondo cinematográfica (parallax suave + fade entre escenas). */
function Scene({
  image,
  alt,
  chapter,
  className = "",
  children,
  overlay = "from-background via-background/40 to-background",
  align = "center",
  staticBg = false,
}: {
  image: string;
  alt: string;
  chapter?: string;
  className?: string;
  children: React.ReactNode;
  overlay?: string;
  align?: "start" | "center" | "end";
  staticBg?: boolean;
}) {
  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      <div
        key={image}
        className={`absolute inset-0 -z-20 bg-cover bg-center transition-[background-image] duration-700 animate-fade-in ${
          staticBg ? "" : "bg-fixed"
        }`}
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={alt}
      />
      <div className={`absolute inset-0 -z-10 bg-gradient-to-b ${overlay}`} />
      <div
        className={`relative mx-auto flex min-h-[90vh] max-w-6xl flex-col px-4 py-24 ${
          align === "center" ? "justify-center" : align === "end" ? "justify-end" : "justify-start"
        }`}
      >
        {chapter && (
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            {chapter}
          </span>
        )}
        {children}
      </div>
    </section>
  );
}

function VibeRing({
  vibes,
  active,
  onSelect,
}: {
  vibes: Vibe[];
  active: Vibe | null;
  onSelect: (v: Vibe) => void;
}) {
  // circular layout, ring keeps spinning; chips counter-spin so emojis stay upright
  const radius = 150;
  return (
    <div className="vibe-ring relative mx-auto h-[360px] w-[360px] sm:h-[400px] sm:w-[400px]">
      {/* center hint */}
      <div className="pointer-events-none absolute inset-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass-strong text-center text-[10px] font-semibold uppercase tracking-widest text-white/80">
        {active ? VIBE_META[active].label : "vibe"}
      </div>
      {/* faint orbit ring */}
      <div className="absolute inset-6 rounded-full border border-dashed border-white/15" />
      <div className="absolute inset-0 animate-spin-slow">
        {vibes.map((v, i) => {
          const angle = (i / vibes.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const meta = VIBE_META[v];
          const isActive = v === active;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              aria-label={meta.label}
            >
              <span
                className={`animate-spin-counter inline-flex flex-col items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold backdrop-blur-md transition ${
                  isActive
                    ? "border-coral bg-coral text-white shadow-glow scale-110"
                    : "border-white/20 bg-white/10 text-white hover:border-coral/60 hover:bg-coral/20"
                }`}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <span>{meta.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Landing() {
  const { t } = useI18n();
  const [loginOpen, setLoginOpen] = useState(false);
  
  const [activeVibe, setActiveVibe] = useState<Vibe | null>(null);
  const gallery = activeVibe ? VIBE_GALLERY[activeVibe] : null;
  const sceneImage = gallery?.hero ?? vibeBaseImg;
  const sceneAlt = activeVibe
    ? `Escena de ${VIBE_META[activeVibe].label} en Medellín`
    : "Plaza paisa al atardecer";

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión (post-login), llevar al feed una sola vez
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/app/feed", replace: true });
    }
  }, [user, loading, navigate]);

  // "Empezar el recorrido" → suave scroll por la landing (cap. 2)
  const startTour = () => {
    document.getElementById("vibe-chapter")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-background">
      <AppHeader floating onLoginClick={() => setLoginOpen(true)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* CHAPTER 1 — Skyline / atardecer */}
      <Scene
        image={heroImg}
        alt="Skyline de Medellín al atardecer"
        chapter={t("landing.ch1")}
        align="center"
        overlay="from-black/40 via-black/30 to-background"
        className="-mt-16 min-h-screen pt-16"
      >
        <div className="max-w-2xl space-y-6 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <CityGoLogo className="h-3.5 w-3.5" /> CityGo · Medellín
          </span>
          <h1 className="text-3xl font-bold leading-[1.15] text-white drop-shadow-2xl sm:text-4xl md:text-5xl">
            CityGo,{" "}
            <span className="bg-gradient-to-r from-sun via-coral to-magenta bg-clip-text text-transparent">
              {t("landing.hero.verb")}
            </span>{" "}
            {t("landing.hero.rest")}
          </h1>


          <p className="max-w-md text-base text-white/85 drop-shadow sm:text-lg">
            {t("landing.hero.sub")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={startTour}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-6 py-3.5 text-base font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
            >
              {t("landing.cta.start")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" /> {t("landing.cta.chat")}
            </button>
          </div>
          <div className="flex items-center gap-6 pt-4 text-sm text-white/80">
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> {t("landing.langs")}
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> {t("landing.places")}
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-white/70">
          <span className="text-xs uppercase tracking-widest">{t("landing.scrollcue")}</span>
          <div className="h-10 w-6 rounded-full border-2 border-white/40 p-1">
            <div className="mx-auto h-2 w-1 animate-bounce rounded-full bg-white/80" />
          </div>
        </div>
      </Scene>

      {/* CHAPTER 2 — Vibe selector con carrusel rotativo */}
      <div id="vibe-chapter">
      <Scene
        image={sceneImage}
        alt={sceneAlt}
        chapter={t("landing.ch2")}
        align="center"
        overlay="from-background/70 via-black/40 to-background"
        staticBg
      >
        <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:items-center">
          <div className="space-y-6 text-white">
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              {t("landing.vibe.title1")}{" "}
              <span className="text-gradient-sunset">{t("landing.vibe.title2")}</span>{" "}
              {t("landing.vibe.title3")}
            </h2>
            <p className="text-white/85">{t("landing.vibe.sub")}</p>

            {activeVibe && gallery ? (
              <p
                key={activeVibe}
                className="rounded-2xl border border-white/15 bg-black/45 p-4 text-sm text-white/90 backdrop-blur-md animate-fade-in"
              >
                <span className="font-semibold text-coral">{VIBE_META[activeVibe].label}:</span>{" "}
                {gallery.tagline}
              </p>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 backdrop-blur-md">
                {t("landing.vibe.hint")}
              </p>
            )}

            {activeVibe && gallery ? (
              <div key={activeVibe} className="grid grid-cols-3 gap-3 animate-fade-in">
                {gallery.spots.map((spot, i) => (
                  <div
                    key={spot.name}
                    className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-card backdrop-blur-md ${
                      i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[3/4]"
                    }`}
                  >
                    <SafeImage
                      src={spot.img}
                      alt={spot.name}
                      category={spot.tag}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-coral">
                        {spot.tag}
                      </p>
                      <p className="text-sm font-bold text-white drop-shadow">{spot.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Rotating vibe ring */}
          <div className="flex items-center justify-center">
            <VibeRing vibes={VIBES} active={activeVibe} onSelect={setActiveVibe} />
          </div>
        </div>
      </Scene>
      </div>

      {/* CHAPTER 3 — Comuna 13 */}
      <Scene
        image={comuna13Img}
        alt="Escaleras eléctricas y graffitis de la Comuna 13"
        chapter={t("landing.ch3")}
        align="center"
        overlay="from-background/70 via-background/30 to-background"
      >
        <div className="mx-auto max-w-3xl text-center text-white">
          <h2 className="text-4xl font-bold drop-shadow-lg sm:text-5xl md:text-6xl">
            {t("landing.how.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">{t("landing.how.sub")}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { step: "01", title: t("landing.how.s1.title"), desc: t("landing.how.s1.desc"), accent: "text-coral" },
            { step: "02", title: t("landing.how.s2.title"), desc: t("landing.how.s2.desc"), accent: "text-magenta" },
            { step: "03", title: t("landing.how.s3.title"), desc: t("landing.how.s3.desc"), accent: "text-jungle" },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-3xl border border-white/15 bg-black/60 p-6 text-white shadow-card backdrop-blur-md"
            >
              <div className={`text-5xl font-bold opacity-80 ${s.accent}`}>{s.step}</div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/75">{s.desc}</p>
            </div>
          ))}
        </div>
      </Scene>

      {/* CHAPTER 4 — Vida nocturna */}
      <Scene
        image={nightImg}
        alt="Rooftop bar nocturno con vista a Medellín"
        chapter={t("landing.ch4")}
        align="start"
        overlay="from-black/60 via-black/30 to-background"
      >
        <div className="max-w-2xl text-white">
          <h2 className="text-4xl font-bold drop-shadow-lg sm:text-5xl">
            {t("landing.night.title1")}{" "}
            <span className="text-gradient-sunset">{t("landing.night.title2")}</span>
          </h2>
          <p className="mt-3 max-w-md text-white/80">{t("landing.night.sub")}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLACES.slice(0, 6).map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            {t("landing.night.cta")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Scene>

      {/* CHAPTER 5 — Cierre */}
      <Scene
        image={mountainsImg}
        alt="Metrocable sobre las montañas de Medellín"
        chapter={t("landing.ch5")}
        align="center"
        overlay="from-background/40 via-background/20 to-background"
      >
        <div className="mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-12 w-12 text-coral drop-shadow-lg" />
          <h2 className="mt-6 text-4xl font-bold text-white drop-shadow-2xl sm:text-6xl md:text-7xl">
            {t("landing.end.title")}
            <br />
            <span className="bg-gradient-to-r from-sun via-coral to-magenta bg-clip-text text-transparent">
              {t("landing.end.title2")}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">{t("landing.end.sub")}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-8 py-4 text-base font-semibold text-white shadow-glow transition-transform hover:scale-105"
            >
              {t("landing.end.cta")} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              {t("landing.end.have")}
            </button>
          </div>
        </div>
      </Scene>

      <footer className="border-t border-border/60 bg-background py-8 text-center text-sm text-muted-foreground">
        <p>{t("landing.footer")}</p>
      </footer>
    </div>
  );
}

