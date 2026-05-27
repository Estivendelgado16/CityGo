import { useEffect, useState } from "react";
import { Mail, Sparkles, X, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
  /** redirige aquí tras login exitoso por email/password */
  redirectTo?: string;
};

type Mode = "signin" | "signup";

export function LoginModal({ open, onClose, redirectTo = "/app/feed" }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error("No pudimos iniciar con Google");
      setLoading(false);
    }
    // Si no hay error el browser navega a Google — no se necesita más código aquí
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
        });
        if (error) throw error;
        toast.success("¡Bienvenido a CityGo! 🧡");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("De vuelta a CityGo ✨");
      }
      onClose();
      navigate({ to: redirectTo });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo falló");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-fade-in" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl glass-strong p-8 shadow-glow animate-scale-in">
        <div className="blob bg-gradient-sunset h-40 w-40 -top-10 -right-10" />
        <div className="blob bg-jungle/40 h-32 w-32 -bottom-10 -left-10" />

        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/30 text-white/80 transition hover:bg-black/60" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>

        <div className="relative space-y-6">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-sunset shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">
                {mode === "signin" ? "Vuelve a" : "Únete a"} <span className="text-gradient-sunset">CityGo</span>
              </h2>
              <p className="text-xs text-muted-foreground">Guarda tus planes y deja que CityGo aprenda lo que te gusta.</p>
            </div>
          </div>

          <button type="button" disabled={loading} onClick={handleGoogle} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
            <GoogleG /> Continuar con Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-3 focus-within:border-coral/60">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mín. 6)" className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-coral/60 focus:outline-none" />
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-sunset py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-coral hover:underline">
              {mode === "signin" ? "Crear una" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.6 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.1 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
