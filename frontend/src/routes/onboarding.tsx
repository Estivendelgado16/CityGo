import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { citygoApi } from "@/lib/citygo-api";
import { AppHeader } from "@/components/AppHeader";
import { VIBE_META, type Vibe } from "@/lib/mock-data";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Empieza tu plan · CityGo" }],
  }),
  component: Onboarding,
});

type Profile = {
  lang: string;
  traveler: string;
  vibes: Vibe[];
  budget: number;
};

const TRAVELERS = [
  { id: "tourist", emoji: "🧳", labelKey: "onb.trav.tourist" },
  { id: "local", emoji: "🏠", labelKey: "onb.trav.local" },
  { id: "expat", emoji: "🌎", labelKey: "onb.trav.expat" },
  { id: "business", emoji: "💼", labelKey: "onb.trav.business" },
];

const VIBES: Vibe[] = ["rumba", "gastro", "cultura", "deporte", "naturaleza", "café"];

function Onboarding() {
  const navigate = useNavigate();
  const { t, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    lang: "es",
    traveler: "tourist",
    vibes: [],
    budget: 2,
  });

  const steps = [t("onb.s.lang"), t("onb.s.traveler"), t("onb.s.vibes"), t("onb.s.budget")];
  const total = steps.length;
  const progress = ((step + 1) / total) * 100;

  const [saving, setSaving] = useState(false);
  const next = async () => {
    if (step < total - 1) { setStep(step + 1); return; }
    setSaving(true);
    try {
      await citygoApi.completeOnboarding({
        lang: profile.lang,
        traveler: profile.traveler,
        vibes: profile.vibes,
        budget: profile.budget,
      });
      toast.success(t("onb.welcome"));
      navigate({ to: "/app/feed" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar perfil");
    } finally {
      setSaving(false);
    }
  };
  const prev = () => step > 0 && setStep(step - 1);

  const canNext =
    (step === 0 && profile.lang) ||
    (step === 1 && profile.traveler) ||
    (step === 2 && profile.vibes.length > 0) ||
    step === 3;

  const toggleVibe = (v: Vibe) =>
    setProfile((p) => ({
      ...p,
      vibes: p.vibes.includes(v) ? p.vibes.filter((x) => x !== v) : [...p.vibes, v],
    }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
            <span>
              {t("onb.step")} {step + 1} {t("onb.of")} {total}
            </span>
            <span>{steps[step]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-sunset transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-10">
          {step === 0 && (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("onb.lang.title")}</h1>
              <p className="mt-2 text-muted-foreground">{t("onb.lang.sub")}</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setProfile({ ...profile, lang: l.code }); setLang(l.code); }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition",
                      profile.lang === l.code
                        ? "border-coral bg-coral/5"
                        : "border-border hover:border-coral/40"
                    )}
                  >
                    <span className="text-3xl">{l.flag}</span>
                    <span className="font-semibold">{l.label}</span>
                    {profile.lang === l.code && (
                      <Check className="ml-auto h-5 w-5 text-coral" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("onb.trav.title")}</h1>
              <p className="mt-2 text-muted-foreground">
                {t("onb.trav.sub")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {TRAVELERS.map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => setProfile({ ...profile, traveler: tr.id })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition",
                      profile.traveler === tr.id
                        ? "border-coral bg-coral/5"
                        : "border-border hover:border-coral/40"
                    )}
                  >
                    <span className="text-4xl">{tr.emoji}</span>
                    <span className="font-semibold">{t(tr.labelKey)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("onb.vibes.title")}</h1>
              <p className="mt-2 text-muted-foreground">
                {t("onb.vibes.sub")}
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {VIBES.map((v) => {
                  const meta = VIBE_META[v];
                  const active = profile.vibes.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVibe(v)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition",
                        active
                          ? "border-coral bg-coral text-coral-foreground shadow-glow"
                          : "border-border bg-card hover:border-coral/40"
                      )}
                    >
                      <span className="text-lg">{meta.emoji}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-3xl font-bold sm:text-4xl">{t("onb.budget.title")}</h1>
              <p className="mt-2 text-muted-foreground">{t("onb.budget.sub")}</p>
              <div className="mt-8 space-y-3">
                {[
                  { v: 1, label: t("budget.eco"), desc: t("onb.budget.eco"), icon: "💸" },
                  { v: 2, label: t("budget.mid"), desc: t("onb.budget.mid"), icon: "💵" },
                  { v: 3, label: t("budget.premium"), desc: t("onb.budget.premium"), icon: "💎" },
                ].map((b) => (
                  <button
                    key={b.v}
                    onClick={() => setProfile({ ...profile, budget: b.v })}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition",
                      profile.budget === b.v
                        ? "border-coral bg-coral/5"
                        : "border-border hover:border-coral/40"
                    )}
                  >
                    <span className="text-3xl">{b.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{b.label}</div>
                      <div className="text-sm text-muted-foreground">{b.desc}</div>
                    </div>
                    {profile.budget === b.v && <Check className="h-5 w-5 text-coral" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-0"
            >
              <ArrowLeft className="h-4 w-4" /> {t("onb.back")}
            </button>
            <button
              onClick={next}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {step === total - 1 ? t("onb.finish") : t("onb.next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
