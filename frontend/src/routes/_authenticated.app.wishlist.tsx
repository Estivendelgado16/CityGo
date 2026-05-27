import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Compass, Star, MessageSquare, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PlaceModal } from "@/components/PlaceModal";
import { TYPE_LABEL, type DbPlace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/_authenticated/app/wishlist")({
  head: () => ({ meta: [{ title: "Mis planes · CityGo" }] }),
  component: WishlistPage,
});

type Row = { place: DbPlace; rating: number | null; note: string | null };

function WishlistPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState<DbPlace | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wishlist")
      .select("place_id, rating, note, places(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const list: Row[] = (data ?? [])
      .map((r: any) => ({ place: r.places as DbPlace, rating: r.rating, note: r.note }))
      .filter((r) => r.place);
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-5 px-3 py-4 sm:px-4 sm:py-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="h-5 w-5 text-coral fill-coral" /> {t("wishlist.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("wishlist.subtitle")}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("wishlist.empty")}</p>
          <Link
            to="/app/feed"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            <Compass className="h-4 w-4" /> {t("wishlist.empty.cta")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <WishlistItem
              key={r.place.id}
              row={r}
              userId={user!.id}
              onOpen={() => setActive(r.place)}
              onChanged={(rating, note) =>
                setRows((cur) => cur.map((x) => (x.place.id === r.place.id ? { ...x, rating, note } : x)))
              }
              t={t}
            />
          ))}
        </div>
      )}

      <PlaceModal
        place={active}
        onClose={() => {
          setActive(null);
          load();
        }}
      />
    </div>
  );
}

function WishlistItem({
  row,
  userId,
  onOpen,
  onChanged,
  t,
}: {
  row: Row;
  userId: string;
  onOpen: () => void;
  onChanged: (rating: number | null, note: string | null) => void;
  t: (k: string) => string;
}) {
  const { place } = row;
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(row.rating);
  const [note, setNote] = useState(row.note ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("wishlist")
      .update({ rating, note: note || null })
      .eq("user_id", userId)
      .eq("place_id", place.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChanged(rating, note || null);
    setOpen(false);
    toast.success(t("wishlist.saved"));
  };

  return (
    <article className="group overflow-hidden rounded-3xl glass shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden">
          <SafeImage
            src={place.image_url}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-coral">
              {TYPE_LABEL[place.type]}
            </p>
            <h3 className="truncate text-base font-bold drop-shadow">{place.name}</h3>
            <p className="text-xs text-white/85">{place.neighborhood}</p>
          </div>
        </div>
      </button>

      <div className="space-y-2 p-3">
        {/* Rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (rating ?? 0) >= n;
              return (
                <button
                  key={n}
                  onClick={() => {
                    const next = rating === n ? null : n;
                    setRating(next);
                    setOpen(true);
                  }}
                  aria-label={`${n} estrellas`}
                  className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-muted"
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition",
                      filled ? "fill-sun text-sun" : "text-muted-foreground/50"
                    )}
                  />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
              row.note
                ? "bg-coral/15 text-coral"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            {row.note ? t("wishlist.note.your") : t("wishlist.note.label")}
          </button>
        </div>

        {open && (
          <div className="space-y-2 pt-1">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("wishlist.note.placeholder")}
              rows={2}
              className="w-full resize-none rounded-2xl border border-border bg-background/60 p-2.5 text-xs leading-snug placeholder:text-muted-foreground focus:border-coral/60 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRating(row.rating);
                  setNote(row.note ?? "");
                  setOpen(false);
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              >
                {t("wishlist.cancel")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {t("wishlist.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
