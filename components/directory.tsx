"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState, ViewTransition } from "react";
import { ChevronDownIcon, MapPinIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";

import { ProfileCard } from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { ProfileTeaser } from "@/lib/data";
import { TYPES, type ProfileType } from "@/lib/site";
import { cn } from "@/lib/utils";


const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function Directory({
  profiles,
  disciplines,
  cities,
}: {
  profiles: ProfileTeaser[];
  disciplines: string[];
  cities: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const type = (params.get("tipo") as ProfileType | null) ?? null;
  const discipline = params.get("actividad");
  const city = params.get("ciudad");
  const deferredQuery = useDeferredValue(query);

  /** Actualiza la URL sin recargar, así un filtro se puede compartir o volver atrás. */
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onQuery(value: string) {
    setQuery(value);
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  // El buscador rápido (⌘K / botón flotante) puede mandar una búsqueda acá.
  useEffect(() => {
    function onSearch(e: Event) {
      const q = (e as CustomEvent<string>).detail ?? "";
      setQuery(q);
      const next = new URLSearchParams(window.location.search);
      if (q.trim()) next.set("q", q);
      else next.delete("q");
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
    window.addEventListener("saicuma:search", onSearch);
    return () => window.removeEventListener("saicuma:search", onSearch);
  }, []);

  const results = useMemo(() => {
    const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean);
    return profiles.filter((p) => {
      if (type && p.type !== type) return false;
      if (discipline && !p.disciplines.includes(discipline)) return false;
      if (city && p.city !== city) return false;
      if (!terms.length) return true;
      const hay = normalize(`${p.name} ${p.disciplines.join(" ")} ${p.city}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [profiles, deferredQuery, type, discipline, city]);

  const hasFilters = Boolean(query.trim() || type || discipline || city);
  const visible = results;

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <section aria-labelledby="directorio" className="mx-auto max-w-7xl px-4 sm:px-6">
      <h2 id="directorio" className="sr-only">
        Directorio
      </h2>

      {/* Búsqueda + actividad + ciudad: en una fila desde escritorio */}
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <div className="relative min-w-0 flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="buscar" className="sr-only">
            Buscar por nombre, actividad o ciudad
          </label>
          <input
            id="buscar"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscá por nombre, actividad o ciudad"
            autoComplete="off"
            className="h-14 w-full rounded-lg border border-line bg-canvas pr-12 pl-12 text-lg text-ink placeholder:text-muted-foreground focus:border-brand focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-brand/25"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQuery("")}
              className="absolute top-1/2 right-3 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-stone hover:text-ink"
              aria-label="Borrar búsqueda"
            >
              <XIcon className="size-5" />
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex md:w-[24rem] md:shrink-0 lg:w-[29rem]">
          <SelectFilter
            label="Actividad"
            value={discipline}
            options={disciplines}
            allLabel="Actividad"
            icon={SparklesIcon}
            onChange={(v) => setParam("actividad", v)}
          />
          <SelectFilter
            label="Ciudad"
            value={city}
            options={cities}
            allLabel="Ciudad"
            icon={MapPinIcon}
            onChange={(v) => setParam("ciudad", v)}
          />
        </div>
      </div>

      {/* Tipo de perfil + resumen: en escritorio comparten la misma línea */}
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Tipo de perfil" className="flex flex-wrap gap-2">
          <FilterChip active={!type} onClick={() => setParam("tipo", null)}>
            Todos
          </FilterChip>
          {(Object.keys(TYPES) as ProfileType[]).map((t) => (
            <FilterChip
              key={t}
              active={type === t}
              onClick={() => setParam("tipo", type === t ? null : t)}
              dot={TYPES[t].color}
            >
              {TYPES[t].plural}
            </FilterChip>
          ))}
        </div>

        <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line pt-4 md:shrink-0 md:justify-end md:border-0 md:pt-0">
          <p aria-live="polite" className="text-[0.95rem] text-muted-foreground">
            {results.length === profiles.length
              ? `${profiles.length} perfiles`
              : `${results.length} de ${profiles.length} perfiles`}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[0.95rem] font-medium text-brand-ink hover:underline"
            >
              <XIcon className="size-4" />
              Quitar filtros
            </button>
          ) : null}
        </div>
      </div>

      {/* Resultados */}
      {visible.length ? (
        // Al cambiar un filtro, la grilla vieja se desvanece y la nueva aparece con un fundido suave
        // (View Transitions del navegador: el cambio de URL es una transición de React).
        <ViewTransition key={`${type ?? ""}|${discipline ?? ""}|${city ?? ""}`} enter="grid-in" exit="grid-out" default="none">
          <ul className="mt-4 grid grid-cols-2 md:mt-6 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((p, i) => (
              <li key={p.slug}>
                <ProfileCard profile={p} priority={i < 5} />
              </li>
            ))}
          </ul>
        </ViewTransition>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-line bg-canvas px-6 py-14 text-center">
          <p className="text-lg font-semibold text-ink">No hay perfiles con esos filtros</p>
          <p className="mt-2 text-muted-foreground">Probá con otra actividad o ciudad, o quitá algún filtro.</p>
          <Button onClick={clearAll} className="mt-6">
            Quitar filtros
          </Button>
        </div>
      )}

    </section>
  );
}

function FilterChip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[0.95rem] font-medium transition-colors",
        active ? "border-ink bg-ink text-canvas" : "border-line bg-canvas text-ink hover:border-ink/40",
      )}
    >
      {dot ? <span aria-hidden className="size-2.5 rounded-full ring-2 ring-canvas/70" style={{ background: dot }} /> : null}
      {children}
    </button>
  );
}

function SelectFilter({
  label,
  value,
  options,
  allLabel,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  allLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  onChange: (value: string | null) => void;
}) {
  const id = `filtro-${label.toLowerCase()}`;
  const active = Boolean(value);
  return (
    <div className="group relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2",
          active ? "text-brand-ink" : "text-muted-foreground",
        )}
      />
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "h-14 w-full cursor-pointer appearance-none truncate rounded-lg border bg-canvas pr-10 pl-10 text-[1rem] text-ink shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-colors hover:border-ink/40 focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none",
          active ? "border-ink font-medium" : "border-line",
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink/70 transition-transform group-hover:translate-y-[-40%]"
      />
    </div>
  );
}
