"use client";

import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, ClockIcon, CornerDownLeftIcon, MapPinIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";

import { TypeRibbon } from "@/components/profile-card";
import { TypePlaceholder } from "@/components/type-placeholder";
import type { ProfileTeaser } from "@/lib/data";
import { TYPES, type ProfileType } from "@/lib/site";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------------ */

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const RECENT_KEY = "saicuma:recientes";

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((x) => normalize(x) !== normalize(q))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada.
  }
}

/** Resalta en negrita las partes del texto que coinciden con lo buscado. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const norm = normalize(text);
  const marks = new Array(text.length).fill(false);
  for (const t of terms) {
    let i = norm.indexOf(t);
    while (i !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = norm.indexOf(t, i + t.length);
    }
  }
  const out: React.ReactNode[] = [];
  let buf = "";
  let on = marks[0];
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || marks[i] !== on) {
      if (buf) out.push(on ? <mark key={i} className="bg-transparent font-bold text-brand-ink">{buf}</mark> : buf);
      buf = "";
      on = marks[i];
    }
    if (i < text.length) buf += text[i];
  }
  return <>{out}</>;
}

/** Arrastrar hacia abajo para cerrar el panel (en mobile). */
function useDragDown(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") return; // en escritorio no hace falta
      if ((e.target as HTMLElement).closest("input,button,a")) return;
      start.current = { y: e.clientY, t: e.timeStamp };
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // sin captura, igual funciona
      }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!start.current) return;
      setOffset(Math.max(0, e.clientY - start.current.y));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      const s = start.current;
      start.current = null;
      setDragging(false);
      if (!s) return;
      const dy = Math.max(0, e.clientY - s.y);
      const v = dy / Math.max(1, e.timeStamp - s.t);
      if (dy > 120 || v > 0.6) onClose();
      setOffset(0);
    },
  };
  return {
    handlers: { ...handlers, onPointerCancel: handlers.onPointerUp },
    style: {
      transform: offset ? `translateY(${offset}px)` : undefined,
      transition: dragging ? "none" : "transform 200ms ease-out",
    },
  };
}

/* ------------------------------------------------------------------
   Componente
   ------------------------------------------------------------------ */

type Suggestion =
  | { kind: "profile"; profile: ProfileTeaser }
  | { kind: "activity"; label: string; count: number }
  | { kind: "city"; label: string; count: number }
  | { kind: "all"; count: number };

const MAX_PROFILES = 7;

export function QuickSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<ProfileTeaser[] | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [showPill, setShowPill] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const deferred = useDeferredValue(query);

  const close = useCallback(() => setOpen(false), []);
  const drag = useDragDown(close);

  function openSearch() {
    setRecent(readRecent());
    setQuery("");
    setActive(0);
    setOpen(true);
  }

  // Carga el índice la primera vez que hace falta.
  useEffect(() => {
    if (!open || index) return;
    let alive = true;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((d: ProfileTeaser[]) => alive && setIndex(d))
      .catch(() => alive && setIndex([]));
    return () => {
      alive = false;
    };
  }, [open, index]);

  // Atajos: ⌘K / Ctrl+K y "/" abren el buscador.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = (e.target as HTMLElement)?.closest?.("input,textarea,select,[contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setRecent(readRecent());
        setQuery("");
        setActive(0);
        setOpen(true);
      }
    }
    function onOpenEvent() {
      setRecent(readRecent());
      setQuery("");
      setActive(0);
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("saicuma:open-search", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("saicuma:open-search", onOpenEvent);
    };
  }, []);

  // Botón flotante: aparece al bajar, y se esconde si el buscador del directorio está a la vista.
  useEffect(() => {
    let inlineVisible = false;
    const update = () => setShowPill(window.scrollY > 280 && !inlineVisible);
    const inline = document.getElementById("buscar");
    const io =
      inline && "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            inlineVisible = entry.isIntersecting;
            update();
          })
        : null;
    if (inline && io) io.observe(inline);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, [pathname]);

  const stats = useMemo(() => {
    if (!index) return null;
    const count = (vals: string[]) => {
      const m = new Map<string, number>();
      vals.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      activities: count(index.flatMap((p) => p.disciplines)),
      cities: count(index.map((p) => p.city)),
      types: (Object.keys(TYPES) as ProfileType[]).map((t) => [t, index.filter((p) => p.type === t).length] as const),
    };
  }, [index]);

  const terms = useMemo(() => normalize(deferred).split(/\s+/).filter(Boolean), [deferred]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!index || !stats || !terms.length) return [];
    const has = (s: string) => terms.every((t) => normalize(s).includes(t));
    const matches = index.filter((p) => has(`${p.name} ${p.disciplines.join(" ")} ${p.city}`));
    // Primero los que coinciden por nombre, después el resto.
    const byName = (p: ProfileTeaser) => (terms.every((t) => normalize(p.name).includes(t)) ? 0 : 1);
    matches.sort((a, b) => byName(a) - byName(b) || (a.picture ? 0 : 1) - (b.picture ? 0 : 1));

    const out: Suggestion[] = [];
    stats.activities
      .filter(([a]) => has(a))
      .slice(0, 2)
      .forEach(([label, count]) => out.push({ kind: "activity", label, count }));
    stats.cities
      .filter(([c]) => has(c))
      .slice(0, 2)
      .forEach(([label, count]) => out.push({ kind: "city", label, count }));
    matches.slice(0, MAX_PROFILES).forEach((profile) => out.push({ kind: "profile", profile }));
    if (matches.length) out.push({ kind: "all", count: matches.length });
    return out;
  }, [index, stats, terms]);

  // Si cambia la lista, la selección vuelve al principio (ajuste durante el render).
  const [lastDeferred, setLastDeferred] = useState(deferred);
  if (deferred !== lastDeferred) {
    setLastDeferred(deferred);
    setActive(0);
  }

  /** Lleva la búsqueda al directorio de la portada. */
  function goDirectory(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    setOpen(false);
    if (pathname === "/" && params.q !== undefined) {
      window.dispatchEvent(new CustomEvent("saicuma:search", { detail: params.q }));
      document.getElementById("buscar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(`/?${qs}#directorio`);
  }

  function choose(s: Suggestion) {
    if (query.trim()) saveRecent(query.trim());
    if (s.kind === "profile") {
      setOpen(false);
      router.push(`/users/${encodeURIComponent(s.profile.slug)}/`);
    } else if (s.kind === "activity") goDirectory({ actividad: s.label });
    else if (s.kind === "city") goDirectory({ ciudad: s.label });
    else goDirectory({ q: query.trim() });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) {
      if (e.key === "Enter" && query.trim()) goDirectory({ q: query.trim() });
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = suggestions.length;
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(suggestions[active]);
    }
  }

  const total = index?.length ?? 216;

  return (
    <>
      {/* Botón flotante en mobile, al alcance del pulgar */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Buscar en el directorio"
        tabIndex={showPill ? 0 : -1}
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex h-13 -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink pr-5 pl-4 text-[0.95rem] font-semibold whitespace-nowrap text-canvas shadow-[0_10px_30px_-8px_var(--shadow)] ring-1 ring-white/10 transition-[opacity,translate] duration-300 sm:hidden",
          showPill && !open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-white">
          <SearchIcon className="size-4" strokeWidth={2.6} />
        </span>
        Buscar en {total} perfiles
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).querySelector("input")?.focus();
            }}
            style={drag.style}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden bg-canvas text-ink shadow-2xl outline-none",
              // mobile: panel desde abajo
              "inset-x-0 bottom-0 h-[92dvh] rounded-t-2xl data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300",
              // escritorio: paleta centrada
              "sm:inset-x-auto sm:top-[12vh] sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[72vh] sm:w-[min(640px,92vw)] sm:-translate-x-1/2 sm:rounded-xl sm:ring-1 sm:ring-line sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
            )}
          >
            <Dialog.Title className="sr-only">Buscar en SAICuMA</Dialog.Title>

            {/* Cabecera: se arrastra hacia abajo para cerrar */}
            <div {...drag.handlers} className="shrink-0 touch-none border-b border-line">
              <div aria-hidden className="mx-auto mt-2.5 mb-1 h-1.5 w-11 rounded-full bg-line sm:hidden" />
              <div className="relative flex items-center gap-2 px-3 pt-1 pb-3 sm:p-3">
                <SearchIcon aria-hidden className="pointer-events-none absolute left-6 size-5 text-brand sm:left-6" />
                <input
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Nombre, actividad o ciudad…"
                  autoComplete="off"
                  aria-label="Buscar"
                  aria-controls="qs-list"
                  aria-activedescendant={suggestions.length ? `qs-${active}` : undefined}
                  className="h-13 min-w-0 flex-1 rounded-lg bg-stone pr-10 pl-11 text-[1.05rem] text-ink outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/30 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Borrar"
                    className="absolute right-[5.6rem] inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-ink sm:right-[4.6rem]"
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
                <Dialog.Close className="h-11 shrink-0 rounded-md px-3 text-[0.95rem] font-medium text-brand-ink hover:bg-stone">
                  <span className="sm:hidden">Cancelar</span>
                  <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-sans text-xs text-muted-foreground sm:inline">Esc</kbd>
                </Dialog.Close>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {!index ? (
                <div className="space-y-3 p-4" aria-busy>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="size-12 animate-pulse rounded-md bg-stone" />
                      <div className="h-4 flex-1 animate-pulse rounded bg-stone" />
                    </div>
                  ))}
                </div>
              ) : terms.length ? (
                suggestions.length ? (
                  <ul id="qs-list" ref={listRef} role="listbox" aria-label="Resultados" className="p-2">
                    {suggestions.map((s, i) => (
                      <li
                        key={s.kind === "profile" ? s.profile.slug : `${s.kind}-${"label" in s ? s.label : ""}`}
                        id={`qs-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={i === active}
                      >
                        <button
                          type="button"
                          onClick={() => choose(s)}
                          onPointerMove={() => setActive(i)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                            i === active ? "bg-stone" : "hover:bg-stone/60",
                          )}
                        >
                          <SuggestionRow s={s} terms={terms} query={query} />
                          {i === active ? (
                            <CornerDownLeftIcon aria-hidden className="ml-auto hidden size-4 shrink-0 text-muted-foreground sm:block" />
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-lg font-semibold">Nada con “{query.trim()}”</p>
                    <p className="mt-1 text-muted-foreground">Probá con una actividad o una ciudad:</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {stats?.activities.slice(0, 4).map(([a]) => (
                        <Chip key={a} onClick={() => setQuery(a)}>
                          {a}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <Explore
                  recent={recent}
                  stats={stats}
                  onPick={setQuery}
                  onType={(t) => goDirectory({ tipo: t })}
                  onClearRecent={() => {
                    try {
                      localStorage.removeItem(RECENT_KEY);
                    } catch {}
                    setRecent([]);
                  }}
                />
              )}
            </div>

            <div className="hidden shrink-0 items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted-foreground sm:flex">
              <span>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> para moverte
              </span>
              <span>
                <Kbd>↵</Kbd> para abrir
              </span>
              <span className="ml-auto">
                <Kbd>⌘</Kbd> <Kbd>K</Kbd> desde cualquier página
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/* ------------------------------------------------------------------
   Piezas
   ------------------------------------------------------------------ */

/** Pone primero las actividades que coinciden con lo buscado, para que se vea por qué apareció. */
function matchFirst(list: string[], terms: string[]) {
  const hit = (d: string) => terms.some((t) => normalize(d).includes(t));
  return [...list.filter(hit), ...list.filter((d) => !hit(d))];
}

function SuggestionRow({ s, terms, query }: { s: Suggestion; terms: string[]; query: string }) {
  if (s.kind === "profile") {
    const p = s.profile;
    const t = TYPES[p.type];
    return (
      <>
        <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-stone">
          {p.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.picture} alt="" width={48} height={48} loading="lazy" className="size-full object-cover" />
          ) : (
            <TypePlaceholder type={p.type} size={48} />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            <Highlight text={p.name} terms={terms} />
          </span>
          <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: t.color }} />
            <span className="truncate">
              <Highlight text={[t.label, ...matchFirst(p.disciplines, terms).slice(0, 2), p.city].filter(Boolean).join(" · ")} terms={terms} />
            </span>
          </span>
        </span>
      </>
    );
  }
  if (s.kind === "all") {
    return (
      <span className="flex w-full items-center gap-3 py-1 font-semibold text-brand-ink">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-brand/10">
          <ArrowRightIcon className="size-5" />
        </span>
        Ver {s.count === 1 ? "el resultado" : `los ${s.count} resultados`} de “{query.trim()}” en el directorio
      </span>
    );
  }
  const Icon = s.kind === "city" ? MapPinIcon : SparklesIcon;
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-line text-brand-ink">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {s.kind === "city" ? "Ciudad" : "Actividad"}
        </span>
        <span className="block truncate font-semibold">
          <Highlight text={s.label} terms={terms} />{" "}
          <span className="font-normal text-muted-foreground">· {s.count} perfiles</span>
        </span>
      </span>
    </>
  );
}

function Explore({
  recent,
  stats,
  onPick,
  onType,
  onClearRecent,
}: {
  recent: string[];
  stats: { activities: [string, number][]; cities: [string, number][]; types: readonly (readonly [ProfileType, number])[] } | null;
  onPick: (q: string) => void;
  onType: (t: ProfileType) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="space-y-7 p-4 pb-10">
      {recent.length ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Recientes</h3>
            <button type="button" onClick={onClearRecent} className="text-xs text-muted-foreground hover:text-ink">
              Borrar
            </button>
          </div>
          <ul>
            {recent.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => onPick(r)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-md px-1 text-left hover:bg-stone"
                >
                  <ClockIcon className="size-4 text-muted-foreground" />
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Explorar</h3>
        <div className="grid grid-cols-3 gap-2">
          {stats?.types.map(([t, n]) => (
            <button
              key={t}
              type="button"
              onClick={() => onType(t)}
              className="relative flex min-h-24 flex-col justify-end overflow-hidden rounded-lg bg-stone p-3 text-left transition-transform active:scale-[0.98]"
            >
              <TypeRibbon type={t} className="absolute top-0 right-2 h-10 w-7 pt-1.5" />
              <span className="display text-[2rem]">{n}</span>
              <span className="mt-1 text-sm font-medium">{TYPES[t].plural}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Actividades</h3>
        <div className="flex flex-wrap gap-2">
          {stats?.activities.slice(0, 10).map(([a, n]) => (
            <Chip key={a} onClick={() => onPick(a)}>
              {a} <span className="text-muted-foreground">{n}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Ciudades</h3>
        <div className="flex flex-wrap gap-2">
          {stats?.cities.slice(0, 8).map(([c, n]) => (
            <Chip key={c} onClick={() => onPick(c)}>
              <MapPinIcon className="size-3.5 text-muted-foreground" />
              {c} <span className="text-muted-foreground">{n}</span>
            </Chip>
          ))}
        </div>
      </section>
    </div>
  );
}

function Chip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-canvas px-3.5 text-[0.9rem] font-medium text-ink transition-colors hover:border-ink/40 active:bg-stone"
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-stone px-1.5 py-0.5 font-sans text-[0.7rem]">{children}</kbd>;
}

/** Botón para abrir el buscador desde el encabezado. */
export function SearchTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("saicuma:open-search"))}
      aria-label="Buscar"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-md px-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <SearchIcon className="size-5" />
      <kbd className="hidden rounded border border-white/20 px-1.5 py-0.5 font-sans text-[0.7rem] text-white/60 lg:inline">⌘K</kbd>
    </button>
  );
}
