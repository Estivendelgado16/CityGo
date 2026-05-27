import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";
import { CityGoLogo } from "@/components/CityGoLogo";

type Props = {
  onLoginClick?: () => void;
  /** Si es true, el header empieza transparente y se vuelve glass al hacer scroll. */
  floating?: boolean;
};

export function AppHeader({ onLoginClick, floating = false }: Props) {
  const { lang, setLang, t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!floating) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [floating]);

  const isGlass = !floating || scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isGlass
          ? "glass shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-sunset text-white shadow-glow">
            <CityGoLogo className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow">
            City<span className="text-gradient-sunset">Go</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {onLoginClick && (
            <button
              type="button"
              onClick={onLoginClick}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-105"
            >
              <LogIn className="h-4 w-4" /> {t("header.signin")}
            </button>
          )}

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="ml-2 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 text-sm font-medium text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Idioma"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="text-foreground">
                {l.flag} {l.code.toUpperCase()}
              </option>
            ))}
          </select>
        </nav>
      </div>
    </header>
  );
}
