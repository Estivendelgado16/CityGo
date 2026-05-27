import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Plus, MessageSquare, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/citygo-api";
import { useAuth } from "@/lib/auth";
import { PlaceModal } from "@/components/PlaceModal";
import type { DbPlace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/_authenticated/app/chat")({
  head: () => ({ meta: [{ title: "Asistente · CityGo" }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; place_ids?: string[] };
type Conv = { id: string; title: string | null; created_at: string };

function ChatPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const SUGGESTIONS = [
    t("chat.s.night"),
    t("chat.s.food"),
    t("chat.s.culture"),
    t("chat.s.nature"),
  ];
  const WELCOME: Msg = { role: "assistant", content: t("chat.welcome") };
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [placesById, setPlacesById] = useState<Record<string, DbPlace>>({});
  const [active, setActive] = useState<DbPlace | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id,title,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setConvs((data ?? []) as Conv[]));
  }, [user]);

  // Load messages of selected conversation
  useEffect(() => {
    if (!convId) { setMessages([WELCOME]); return; }
    supabase
      .from("messages")
      .select("role,content,place_ids")
      .eq("conversation_id", convId)
      .order("created_at")
      .then(({ data }) => {
        if (!data?.length) { setMessages([WELCOME]); return; }
        setMessages(data.map((m: { role: string; content: string; place_ids: string[] | null }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          place_ids: m.place_ids ?? [],
        })));
      });
  }, [convId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Hydrate places when ids appear — map raw DB columns to DbPlace shape
  useEffect(() => {
    const ids = Array.from(new Set(messages.flatMap((m) => m.place_ids ?? [])));
    const missing = ids.filter((id) => !placesById[id]);
    if (!missing.length) return;
    supabase.from("places").select("*").in("id", missing).then(({ data }) => {
      if (!data) return;
      const priceMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 3 };
      const typeMap: Record<string, DbPlace["type"]> = {
        restaurante: "restaurant", bar: "bar", discoteca: "club",
        cultura: "museum", deporte: "park",
      };
      const extractLinks = (row: Record<string, unknown>) => {
        const rawSocial = row.social_links;
        const social: Record<string, string> =
          typeof rawSocial === "string"
            ? (() => { try { return JSON.parse(rawSocial); } catch { return {}; } })()
            : (rawSocial as Record<string, string>) || {};
        let mapsUrl: string | null = social.google_maps || null;
        const lat = row.latitude as number | null;
        const lon = row.longitude as number | null;
        if (!mapsUrl && lat && lon) mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
        const handle = social.instagram || null;
        const instagram = handle
          ? handle.startsWith("@") ? `https://instagram.com/${handle.slice(1)}` : handle
          : null;
        const website = social.website || null;
        return { mapsUrl, instagram, website };
      };
      setPlacesById((prev) => {
        const next = { ...prev };
        for (const row of data as Record<string, unknown>[]) {
          const id = row.id as string;
          const { mapsUrl, instagram, website } = extractLinks(row);
          next[id] = {
            id,
            slug: (row.slug as string) || id,
            name: (row.name as string) || "",
            type: typeMap[row.category as string] || "other",
            category: (row.category as string) || null,
            neighborhood: (row.zone as string) || null,
            description: (row.description as string) || null,
            image_url: (row.image_url as string) || null,
            price_level: priceMap[row.price_range as string] || 2,
            rating: (row.average_rating as number) || 0,
            vibes: (row.vibe_tags as string[]) || [],
            maps_url: mapsUrl,
            website,
            instagram,
            tiktok: null,
            phone: null,
            is_event: (row.is_event as boolean) || false,
            starts_at: (row.starts_at as string) || null,
            ends_at: (row.ends_at as string) || null,
          };
        }
        return next;
      });
    });
  }, [messages, placesById]);

  const reloadConvs = () => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id,title,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setConvs((data ?? []) as Conv[]));
  };

  const newChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setConvId(null);
    setMessages([WELCOME]);
    setInput("");
    setLoading(false);
    setStreaming(false);
    setShowHistory(false);
  };

  const deleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("chat.delete.confirm"))) return;
    // delete messages first (no FK cascade), then conversation
    await supabase.from("messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setConvs((c) => c.filter((x) => x.id !== id));
    if (convId === id) newChat();
    toast.success(t("chat.deleted"));
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      let assistantText = "";
      const placeIds = new Set<string>();
      let streamStarted = false;

      for await (const event of streamChat(trimmed, convId, abort.signal)) {
        if (abort.signal.aborted) break;
        if (event.type === "text_delta") {
          if (!streamStarted) {
            streamStarted = true;
            setLoading(false);
            setStreaming(true);
            setMessages((m) => [...m, { role: "assistant", content: "", place_ids: [] }]);
          }
          assistantText += event.content;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantText };
            return copy;
          });
        } else if (event.type === "place_card") {
          placeIds.add(event.data.place_id);
        } else if (event.type === "done") {
          // El backend ya guardó todo — solo actualizamos el convId local
          if (event.conversation_id) {
            setConvId(event.conversation_id);
            reloadConvs();
          }
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      const ids = Array.from(placeIds);
      if (ids.length > 0) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], place_ids: ids };
          return copy;
        });
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        toast.error(e instanceof Error ? e.message : "Algo falló");
      }
    } finally {
      if (!abort.signal.aborted) {
        setLoading(false);
        setStreaming(false);
      }
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-3.5rem-5rem)] flex-col overflow-hidden">
      {/* Decorative aurora behind chat */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="blob bg-gradient-sunset h-[300px] w-[300px] -top-20 -right-16 opacity-40 animate-float-slow" />
        <div className="blob bg-jungle/40 h-[260px] w-[260px] bottom-10 -left-16 opacity-40 animate-float-slow" style={{ animationDelay: "3s" }} />
      </div>

      {/* Conv toolbar */}
      <div className="relative z-10 mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl glass-strong px-3 py-2 sm:mx-4">
        <button onClick={() => setShowHistory((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> {convs.length ? `${convs.length} ${t("chat.chats")}` : t("chat.history")}
        </button>
        <div className="flex items-center gap-1">
          {convId && (
            <button
              onClick={(e) => deleteConv(convId, e)}
              aria-label={t("chat.delete")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("chat.delete")}
            </button>
          )}
          <button onClick={newChat} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-sunset px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> {t("chat.new")}
          </button>
        </div>
      </div>

      {showHistory && convs.length > 0 && (
        <div className="relative z-10 mx-3 mt-2 rounded-2xl glass px-3 py-2 sm:mx-4 animate-fade-in">
          <div className="flex flex-wrap gap-1.5">
            {convs.map((c) => {
              const active = convId === c.id;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group inline-flex items-center gap-1 rounded-full border pl-3 pr-1 py-0.5 text-xs transition backdrop-blur",
                    active ? "border-coral/60 bg-coral/15 text-coral shadow-glow" : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-coral/40 hover:bg-white/[0.06]"
                  )}
                >
                  <button
                    onClick={() => { setConvId(c.id); setShowHistory(false); }}
                    className="max-w-[160px] truncate py-1 text-left"
                  >
                    {c.title ?? t("chat.untitled")}
                  </button>
                  <button
                    onClick={(e) => deleteConv(c.id, e)}
                    aria-label="Eliminar conversación"
                    className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground/70 transition hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="relative z-10 flex-1 space-y-4 overflow-y-auto px-3 py-6 sm:px-4">
        {messages.map((m, i) => (
          <Bubble
            key={i}
            msg={m}
            placesById={placesById}
            onOpen={setActive}
            isStreaming={streaming && i === messages.length - 1 && m.role === "assistant"}
          />
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2">
            <Avatar />
            <div className="flex gap-1 rounded-2xl glass px-4 py-3">
              <Dot /><Dot d="0.15s" /><Dot d="0.3s" />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 mx-3 mb-3 rounded-3xl glass-strong px-3 py-3 sm:mx-4">
        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full glass px-3 py-1.5 text-xs font-medium transition hover:border-coral/40 hover:bg-coral/10 hover:text-coral">
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 p-1.5 transition focus-within:border-coral/60 focus-within:shadow-glow focus-within:bg-white/[0.07]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground caret-coral outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" disabled={!input.trim() || loading} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-sunset text-white shadow-glow transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <PlaceModal place={active} onClose={() => setActive(null)} />
    </div>
  );
}

function Bubble({ msg, placesById, onOpen, isStreaming }: { msg: Msg; placesById: Record<string, DbPlace>; onOpen: (p: DbPlace) => void; isStreaming: boolean }) {
  const isUser = msg.role === "user";
  const places = (msg.place_ids ?? []).map((id) => placesById[id]).filter(Boolean);
  return (
    <div className={cn("flex gap-2 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <Avatar />}
      <div className="max-w-[85%] space-y-2">
        {(msg.content || isStreaming) && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card",
              isUser
                ? "rounded-br-sm bg-gradient-sunset text-white"
                : "rounded-bl-sm glass-strong text-foreground"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words text-white">{msg.content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-strong:text-coral">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "…"}</ReactMarkdown>
              </div>
            )}
            {isStreaming && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-coral align-middle" />}
          </div>
        )}
        {places.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {places.map((p) => (
              <button key={p.id} onClick={() => onOpen(p)} className="group flex items-center gap-3 overflow-hidden rounded-2xl glass p-2 text-left transition hover:border-coral/40 hover:shadow-glow hover:-translate-y-0.5">
                <SafeImage src={p.image_url} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform group-hover:scale-110" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.neighborhood} · ⭐ {p.rating}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-sunset text-white shadow-glow" title="Asistente CityGo">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}
function Dot({ d = "0s" }: { d?: string }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-coral" style={{ animationDelay: d }} />;
}
