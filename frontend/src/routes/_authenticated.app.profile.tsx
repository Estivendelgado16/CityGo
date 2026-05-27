import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Image as ImageIcon, Loader2, LogOut, Save, Sparkles, Heart, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { VIBE_META, type Vibe } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/medellin-hero.jpg";
import provenzaImg from "@/assets/street-provenza.jpg";
import comuna13Img from "@/assets/street-comuna13.jpg";
import nightImg from "@/assets/street-night.jpg";
import mountainsImg from "@/assets/street-mountains.jpg";
import vibeBaseImg from "@/assets/scene-vibe-base.jpg";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({ meta: [{ title: "Perfil · CityGo" }] }),
  component: ProfilePage,
});

const VIBES: Vibe[] = ["rumba", "gastro", "cultura", "deporte", "naturaleza", "café"];

const COVER_PRESETS = [
  { id: "hero", url: heroImg, label: "Skyline" },
  { id: "provenza", url: provenzaImg, label: "Provenza" },
  { id: "comuna13", url: comuna13Img, label: "Comuna 13" },
  { id: "night", url: nightImg, label: "Noche" },
  { id: "mountains", url: mountainsImg, label: "Montañas" },
  { id: "vibe", url: vibeBaseImg, label: "Vibe" },
];

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [budget, setBudget] = useState(2);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("wishlist").select("place_id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (profile) {
        setName(profile.display_name ?? "");
        setVibes(profile.vibes ?? []);
        setBudget(profile.budget ?? 2);
        setAvatarUrl(profile.avatar_url ?? null);
        setCoverUrl(profile.cover_url ?? null);
      }
      setSavedCount(count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, vibes, budget, onboarded: true })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("profile.saved"));
  };

  const setCoverPreset = async (url: string) => {
    if (!user) return;
    setCoverUrl(url);
    setCoverPickerOpen(false);
    const { error } = await supabase.from("profiles").update({ cover_url: url }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success(t("profile.saved"));
  };

  const upload = async (kind: "avatar" | "cover", file: File) => {
    if (!user) return;
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      const update = kind === "avatar" ? { avatar_url: url } : { cover_url: url };
      const { error: pErr } = await supabase.from("profiles").update(update).eq("id", user.id);
      if (pErr) throw pErr;
      if (kind === "avatar") setAvatarUrl(url);
      else {
        setCoverUrl(url);
        setCoverPickerOpen(false);
      }
      toast.success(t("profile.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("profile.upload.error"));
    } finally {
      setUploading(null);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    setAvatarUrl(null);
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  const initials = (name || user?.email || "?").slice(0, 2).toUpperCase();
  const cover = coverUrl || heroImg;

  return (
    <div className="relative space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* Vibrant ambient background — coherent with landing */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="blob animate-float-slow" style={{ top: "-10%", left: "-10%", width: 420, height: 420, background: "var(--coral)" }} />
        <div className="blob animate-float-slow" style={{ top: "30%", right: "-10%", width: 360, height: 360, background: "var(--magenta)", animationDelay: "2s" }} />
        <div className="blob animate-float-slow" style={{ bottom: "-15%", left: "20%", width: 380, height: 380, background: "var(--jungle)", animationDelay: "4s" }} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass-strong shadow-card">
        <div className="relative h-44 w-full sm:h-60">
          <img src={cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-coral/20 via-transparent to-magenta/20 mix-blend-overlay" />
          <button
            onClick={() => setCoverPickerOpen((v) => !v)}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md transition hover:bg-black/75"
          >
            {uploading === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {uploading === "cover" ? t("profile.uploading") : t("profile.cover.change")}
          </button>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload("cover", e.target.files[0])}
          />
        </div>

        {/* Cover picker dropdown */}
        {coverPickerOpen && (
          <div className="border-b border-white/10 bg-black/40 p-4 backdrop-blur-md animate-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-coral">
                {t("profile.cover.choose")}
              </p>
              <button
                onClick={() => coverInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-white/10"
              >
                <Upload className="h-3.5 w-3.5" /> {t("profile.cover.upload")}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COVER_PRESETS.map((p) => {
                const active = coverUrl === p.url;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCoverPreset(p.url)}
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition",
                      active ? "border-coral shadow-glow scale-[1.03]" : "border-white/10 hover:border-coral/50"
                    )}
                  >
                    <img src={p.url} alt={p.label} className="h-full w-full object-cover transition group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold text-white drop-shadow">{p.label}</span>
                    {active && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-coral text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative -mt-16 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-sunset text-2xl font-bold text-white shadow-glow ring-4 ring-card">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => avatarInput.current?.click()}
                aria-label={t("profile.avatar.change")}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-coral text-white shadow-glow transition hover:scale-110"
              >
                {uploading === "avatar" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              {avatarUrl && (
                <button
                  onClick={removeAvatar}
                  aria-label={t("profile.avatar.remove")}
                  className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white backdrop-blur-md transition hover:bg-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload("avatar", e.target.files[0])}
              />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-coral">
                {t("profile.eyebrow")}
              </p>
              <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">
                {name || t("profile.title")}
              </h1>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label={t("profile.stats.vibes")} value={vibes.length} />
            <Stat icon={<Heart className="h-3.5 w-3.5" />} label={t("profile.stats.saved")} value={savedCount} />
            <Stat
              icon={<span className="text-sm">{["💸", "💵", "💎"][budget - 1] ?? "💵"}</span>}
              label={t("profile.budget.label")}
              value={[t("budget.eco"), t("budget.mid"), t("budget.premium")][budget - 1] ?? "—"}
            />
          </div>
        </div>
      </section>

      {/* Nombre */}
      <section className="space-y-2 rounded-3xl glass p-5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("profile.name.label")}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("profile.name.placeholder")}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:border-coral focus:outline-none"
        />
      </section>

      {/* Vibes */}
      <section className="space-y-3 rounded-3xl glass p-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("profile.vibes.label")}
          </label>
          <p className="text-xs text-muted-foreground/70">{t("profile.vibes.help")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const meta = VIBE_META[v];
            const active = vibes.includes(v);
            return (
              <button
                key={v}
                onClick={() => setVibes(active ? vibes.filter((x) => x !== v) : [...vibes, v])}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition",
                  active
                    ? "border-coral bg-coral text-white shadow-glow scale-105"
                    : "border-white/15 bg-white/5 hover:border-coral/40"
                )}
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Presupuesto */}
      <section className="space-y-3 rounded-3xl glass p-5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("profile.budget.label")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 1, icon: "💸", label: t("budget.eco") },
            { v: 2, icon: "💵", label: t("budget.mid") },
            { v: 3, icon: "💎", label: t("budget.premium") },
          ].map((b) => (
            <button
              key={b.v}
              onClick={() => setBudget(b.v)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                budget === b.v
                  ? "border-coral bg-coral/10 shadow-glow"
                  : "border-white/15 bg-white/5 hover:border-coral/40"
              )}
            >
              <span className="text-2xl">{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-sunset py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("profile.save")}
        </button>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-muted-foreground backdrop-blur-md transition hover:bg-white/10 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> {t("profile.signout")}
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-md">
      <div className="flex items-center justify-center gap-1 text-coral">{icon}</div>
      <div className="mt-1 text-base font-bold leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
