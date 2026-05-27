import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, MessageCircle, ArrowRight, MapPin, Star, CalendarDays, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { citygoApi } from "@/lib/citygo-api";
import { useAuth } from "@/lib/auth";
import { PlaceCardDb } from "@/components/PlaceCardDb";
import { PosterCard } from "@/components/PosterCard";
import { PlaceModal } from "@/components/PlaceModal";
import { TYPE_LABEL, type DbPlace } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/_authenticated/app/feed")({
  head: () => ({ meta: [{ title: "Tu feed · CityGo" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [vibes, setVibes] = useState<string[]>([]);
  const [forYou, setForYou] = useState<DbPlace[]>([]);
  const [events, setEvents] = useState<DbPlace[]>([]);
  const [trending, setTrending] = useState<DbPlace[]>([]);
  const [active, setActive] = useState<DbPlace | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      citygoApi.getFeed(),
      citygoApi.getProfile(),
    ]).then(([feedRes, profileRes]) => {
      const feed = feedRes.data as { for_you?: DbPlace[]; eventos?: DbPlace[]; trending?: DbPlace[] } | null;
      setForYou((feed?.for_you ?? []) as DbPlace[]);
      setEvents((feed?.eventos ?? []) as DbPlace[]);
      setTrending((feed?.trending ?? []) as DbPlace[]);

      const profile = profileRes.data as { vibes?: string[] } | null;
      setVibes((profile?.vibes ?? []) as string[]);
    }).catch(() => {
      // 401 → citygoApi hace signOut automático
    });
  }, [user]);

  const featured = forYou[0];
  const restForYou = forYou.slice(1);

  return (
    <div className="space-y-10 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Greeting bar */}
      <section className="relative overflow-hidden rounded-3xl glass-strong p-5 sm:p-7 lg:p-9">
        <div className="blob bg-gradient-sunset h-44 w-44 -top-16 -right-12" />
        <div className="blob bg-jungle/40 h-32 w-32 top-16 -left-10" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-coral">{t("feed.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{t("feed.greeting")}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("feed.subtitle")}</p>
          <Link
            to="/app/chat"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
          >
            <MessageCircle className="h-4 w-4" /> {t("feed.cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* For you: featured + small grid side-by-side on desktop */}
      {featured && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <Sparkles className="h-4 w-4 text-coral" /> {t("feed.foryou")}
            {vibes.length > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                · {vibes.slice(0, 3).join(" · ")}
              </span>
            )}
          </h2>
          <div className="columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            <div className="mb-3 sm:mb-4 break-inside-avoid">
              <FeaturedCard place={featured} onOpen={setActive} />
            </div>
            {restForYou.map((p) => (
              <div key={p.id} className="mb-3 sm:mb-4 break-inside-avoid">
                <PlaceCardDb place={p} onClick={() => setActive(p)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events posters carousel */}
      <PosterCarousel
        title={t("feed.events")}
        subtitle={t("feed.events.sub")}
        icon={<CalendarDays className="h-5 w-5 text-magenta" />}
        places={events}
        onOpen={setActive}
      />

      {/* Trending posters carousel */}
      <PosterCarousel
        title={t("feed.trending")}
        subtitle={t("feed.trending.sub")}
        icon={<Flame className="h-5 w-5 text-sun" />}
        places={trending}
        onOpen={setActive}
      />

      <PlaceModal place={active} onClose={() => setActive(null)} />
    </div>
  );
}

function FeaturedCard({ place, onOpen }: { place: DbPlace; onOpen: (p: DbPlace) => void }) {
  return (
    <button
      onClick={() => onOpen(place)}
      className="group relative block w-full overflow-hidden rounded-3xl text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[2/1]">
        <SafeImage
          src={place.image_url}
          alt={place.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        {place.is_event && (
          <span className="absolute top-3 left-3 rounded-full bg-magenta px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
            Evento
          </span>
        )}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Star className="h-3 w-3 fill-sun text-sun" /> {place.rating}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-coral">
            {TYPE_LABEL[place.type]}{place.category ? ` · ${place.category}` : ""}
          </p>
          <h3 className="mt-1 text-xl font-bold leading-tight drop-shadow sm:text-2xl">{place.name}</h3>
          {place.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-white/85">{place.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/85">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {place.neighborhood}
            </span>
            <span className="font-semibold">{"$".repeat(place.price_level)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function PosterCarousel({ title, subtitle, places, onOpen, icon }: { title: string; subtitle?: string; places: DbPlace[]; onOpen: (p: DbPlace) => void; icon?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!places.length) return null;

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Siguiente"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={ref}
          className="-mx-3 sm:-mx-6 lg:-mx-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 sm:px-6 lg:px-8 pb-3 scrollbar-none scroll-smooth"
        >
          {places.map((p) => (
            <div
              key={p.id}
              className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[23%] xl:w-[19%]"
            >
              <PosterCard place={p} onClick={() => onOpen(p)} />
            </div>
          ))}
        </div>
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent sm:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:w-12" />
      </div>
    </section>
  );
}
