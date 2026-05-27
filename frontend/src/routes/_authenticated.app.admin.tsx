import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Play, Trash2, Edit2, Save, X, Webhook, Users, MapPin, BarChart3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({ meta: [{ title: "Admin · CityGo" }] }),
  component: AdminPage,
});

type Tab = "scrapers" | "places" | "users" | "metrics";

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("scrapers");

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/app/feed" />;

  const TABS: { id: Tab; label: string; icon: typeof Webhook }[] = [
    { id: "scrapers", label: "Scrapers n8n", icon: Webhook },
    { id: "places", label: "Lugares", icon: MapPin },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "metrics", label: "Métricas", icon: BarChart3 },
  ];

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-sunset text-white shadow-glow">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Panel de administración</h1>
          <p className="text-sm text-muted-foreground">Gestiona scrapers, lugares y usuarios</p>
        </div>
      </div>

      <div className="glass mb-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-gradient-sunset text-white shadow-glow"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scrapers" && <ScrapersTab />}
      {tab === "places" && <PlacesTab />}
      {tab === "users" && <UsersTab />}
      {tab === "metrics" && <MetricsTab />}
    </div>
  );
}

/* ============================ SCRAPERS / WEBHOOKS ============================ */

type WebhookItem = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  enabled: boolean;
  last_triggered_at: string | null;
  last_status: string | null;
};

function ScrapersTab() {
  const [items, setItems] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", url: "" });
  const [triggering, setTriggering] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("n8n_webhooks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as WebhookItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!draft.name.trim() || !draft.url.trim()) {
      toast.error("Nombre y URL son requeridos");
      return;
    }
    const { error } = await supabase.from("n8n_webhooks").insert({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      url: draft.url.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Webhook creado");
    setDraft({ name: "", description: "", url: "" });
    setCreating(false);
    load();
  };

  const trigger = async (wh: WebhookItem) => {
    setTriggering(wh.id);
    let status = "ok";
    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "citygo-admin", triggered_at: new Date().toISOString() }),
      });
      status = `${res.status}`;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${wh.name} disparado correctamente`);
    } catch (e: any) {
      status = `error: ${e?.message ?? "fail"}`;
      toast.error(`Error: ${e?.message ?? "no se pudo disparar"}`);
    } finally {
      await supabase
        .from("n8n_webhooks")
        .update({ last_triggered_at: new Date().toISOString(), last_status: status })
        .eq("id", wh.id);
      setTriggering(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este webhook?")) return;
    const { error } = await supabase.from("n8n_webhooks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const toggleEnabled = async (wh: WebhookItem) => {
    await supabase.from("n8n_webhooks").update({ enabled: !wh.enabled }).eq("id", wh.id);
    load();
  };

  const saveEdit = async (wh: WebhookItem) => {
    const { error } = await supabase
      .from("n8n_webhooks")
      .update({ name: wh.name, description: wh.description, url: wh.url })
      .eq("id", wh.id);
    if (error) return toast.error(error.message);
    toast.success("Actualizado");
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configura los workflows de n8n y dispáralos con un botón.
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-gradient-sunset px-3 py-2 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo webhook
        </button>
      </div>

      {creating && (
        <div className="glass space-y-3 rounded-xl border border-white/10 p-4">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nombre (ej: Scraper restaurantes)"
            className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
          />
          <input
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            placeholder="https://n8n.tudominio.com/webhook/..."
            className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={create}
              className="flex items-center gap-2 rounded-lg bg-gradient-sunset px-3 py-2 text-sm font-medium text-white"
            >
              <Save className="h-4 w-4" /> Guardar
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-coral" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
          Aún no tienes webhooks configurados. Crea el primero para empezar.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((wh) => (
            <div key={wh.id} className="glass rounded-xl border border-white/10 p-4">
              {editingId === wh.id ? (
                <div className="space-y-2">
                  <input
                    value={wh.name}
                    onChange={(e) => setItems((arr) => arr.map((x) => (x.id === wh.id ? { ...x, name: e.target.value } : x)))}
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
                  />
                  <input
                    value={wh.url}
                    onChange={(e) => setItems((arr) => arr.map((x) => (x.id === wh.id ? { ...x, url: e.target.value } : x)))}
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={wh.description ?? ""}
                    onChange={(e) => setItems((arr) => arr.map((x) => (x.id === wh.id ? { ...x, description: e.target.value } : x)))}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(wh)}
                      className="flex items-center gap-1 rounded-lg bg-gradient-sunset px-3 py-1.5 text-xs text-white"
                    >
                      <Save className="h-3 w-3" /> Guardar
                    </button>
                    <button
                      onClick={() => { setEditingId(null); load(); }}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{wh.name}</h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", wh.enabled ? "bg-jungle/20 text-jungle" : "bg-muted text-muted-foreground")}>
                          {wh.enabled ? "activo" : "inactivo"}
                        </span>
                      </div>
                      {wh.description && <p className="mt-1 text-xs text-muted-foreground">{wh.description}</p>}
                      <p className="mt-1 truncate text-[11px] text-muted-foreground/70">{wh.url}</p>
                      {wh.last_triggered_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Último: {new Date(wh.last_triggered_at).toLocaleString()} · {wh.last_status}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => trigger(wh)}
                        disabled={triggering === wh.id || !wh.enabled}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-sunset px-3 py-1.5 text-xs font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
                      >
                        {triggering === wh.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Disparar
                      </button>
                      <button
                        onClick={() => toggleEnabled(wh)}
                        className="rounded-lg border border-white/10 px-2 py-1.5 text-xs"
                      >
                        {wh.enabled ? "Pausar" : "Activar"}
                      </button>
                      <button
                        onClick={() => setEditingId(wh.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(wh.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ PLACES ============================ */

type Place = {
  id: string;
  name: string;
  category: string | null;
  zone: string | null;
  average_rating: number;
  image_url: string | null;
  is_active: boolean;
};

function PlacesTab() {
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("places")
      .select("id,name,category,zone,average_rating,image_url,is_active")
      .order("created_at", { ascending: false })
      .limit(500);
    setItems((data as Place[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este lugar?")) return;
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const filtered = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} de {items.length}</span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-coral" /></div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <div key={p.id} className="glass flex items-center gap-3 rounded-xl border border-white/10 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-medium">{p.name}</h4>
                  {!p.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">inactivo</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.category ?? "—"} · {p.zone ?? "—"} · ⭐ {p.average_rating ?? 0}
                </p>
              </div>
              <button
                onClick={() => remove(p.id)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ USERS ============================ */

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarded: boolean;
  created_at: string;
};

type RoleRow = { user_id: string; role: string };

function UsersTab() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_url,onboarded,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setProfiles((p as ProfileRow[]) ?? []);
    setRoles((r as RoleRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rolesByUser = (uid: string) => roles.filter((r) => r.user_id === uid).map((r) => r.role);

  const toggleAdmin = async (uid: string) => {
    const isAdmin = rolesByUser(uid).includes("admin");
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Rol admin removido");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" as any });
      if (error) return toast.error(error.message);
      toast.success("Rol admin asignado");
    }
    load();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{profiles.length} usuarios registrados</p>
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-coral" /></div>
      ) : (
        <div className="grid gap-2">
          {profiles.map((u) => {
            const userRoles = rolesByUser(u.id);
            const isAdmin = userRoles.includes("admin");
            return (
              <div key={u.id} className="glass flex items-center gap-3 rounded-xl border border-white/10 p-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {u.avatar_url && <img src={u.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{u.display_name ?? "Sin nombre"}</h4>
                    {isAdmin && <span className="rounded-full bg-coral/20 px-2 py-0.5 text-[10px] font-medium text-coral">admin</span>}
                    {!u.onboarded && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">sin onboarding</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {u.id.slice(0, 8)}… · {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => toggleAdmin(u.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    isAdmin
                      ? "border border-white/10 text-muted-foreground hover:text-destructive"
                      : "bg-gradient-sunset text-white shadow-glow"
                  )}
                >
                  {isAdmin ? "Quitar admin" : "Hacer admin"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ METRICS ============================ */

function MetricsTab() {
  const [stats, setStats] = useState<{ users: number; places: number; events: number; conversations: number; messages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [u, p, e, c, m] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }).limit(1),
        supabase.from("places").select("id", { count: "exact" }).limit(1),
        supabase.from("events").select("id", { count: "exact" }).limit(1),
        supabase.from("conversations").select("id", { count: "exact" }).limit(1),
        supabase.from("messages").select("id", { count: "exact" }).limit(1),
      ]);
      setStats({
        users: u.count ?? 0,
        places: p.count ?? 0,
        events: e.count ?? 0,
        conversations: c.count ?? 0,
        messages: m.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-coral" /></div>;
  }

  const cards = [
    { label: "Usuarios", value: stats.users, color: "from-coral to-magenta" },
    { label: "Lugares", value: stats.places, color: "from-jungle to-coral" },
    { label: "Eventos", value: stats.events, color: "from-magenta to-sun" },
    { label: "Conversaciones", value: stats.conversations, color: "from-sun to-coral" },
    { label: "Mensajes IA", value: stats.messages, color: "from-jungle to-magenta" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl border border-white/10 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
          <p className={cn("mt-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent", c.color)}>
            {c.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
