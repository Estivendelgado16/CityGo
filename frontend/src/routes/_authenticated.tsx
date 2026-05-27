import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Heart, User as UserIcon, Sparkles, LogOut, Loader2, ShieldCheck } from "lucide-react";
import { citygoApi } from "@/lib/citygo-api";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { CityGoLogo } from "@/components/CityGoLogo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedShell,
});

const TABS = [
  { to: "/app/feed", label: "Feed", icon: Compass },
  { to: "/app/chat", label: "Asistente", icon: Sparkles },
  { to: "/app/wishlist", label: "Mis planes", icon: Heart },
  { to: "/app/profile", label: "Perfil", icon: UserIcon },
];

function AuthenticatedShell() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Si terminó de cargar y no hay usuario → al landing
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    citygoApi.getProfile()
      .then(({ data }) => {
        const profile = data as { onboarded?: boolean } | null;
        setNeedsOnboarding(!profile?.onboarded);
      })
      .catch(() => {
        // 401 → citygoApi hace signOut + redirect a "/"
        // Otro error → no redirigir al onboarding
      });
  }, [user]);

  // Forzar onboarding una vez
  useEffect(() => {
    if (
      needsOnboarding &&
      location.pathname !== "/onboarding" &&
      !location.pathname.startsWith("/app/profile")
    ) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [needsOnboarding, location.pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-20">
      {/* Ambient vibrant gradient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_oklab,var(--coral)_22%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_left,_color-mix(in_oklab,var(--magenta)_18%,transparent),transparent_60%),radial-gradient(ellipse_at_center,_color-mix(in_oklab,var(--jungle)_12%,transparent),transparent_70%)]" />
        <div className="blob bg-gradient-sunset h-[520px] w-[520px] -top-40 -right-40 animate-float-slow opacity-70" />
        <div className="blob bg-jungle/55 h-[420px] w-[420px] top-1/3 -left-40 animate-float-slow opacity-60" style={{ animationDelay: "2s" }} />
        <div className="blob bg-magenta/45 h-[360px] w-[360px] bottom-0 right-1/4 animate-float-slow opacity-60" style={{ animationDelay: "4s" }} />
        <div className="blob bg-sun/30 h-[260px] w-[260px] top-1/2 right-10 animate-float-slow opacity-50" style={{ animationDelay: "6s" }} />
        <div aria-hidden className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      </div>

      <header className="sticky top-0 z-30 glass border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/app/feed" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-sunset text-white shadow-glow">
              <CityGoLogo className="h-4 w-4" />
            </div>
            <span className="text-base font-bold">
              City<span className="text-gradient-sunset">Go</span>
            </span>
          </Link>
          <button
            onClick={signOut}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 glass border-t border-white/10">
        <div className={cn("mx-auto grid max-w-3xl", isAdmin ? "grid-cols-5" : "grid-cols-4")}>
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition"
              )}
              activeProps={{ className: "text-coral" }}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/app/admin"
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition"
              activeProps={{ className: "text-coral" }}
            >
              <ShieldCheck className="h-5 w-5" />
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
