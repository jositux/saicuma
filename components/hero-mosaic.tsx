"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import type { ProfileTeaser } from "@/lib/data";
import { TYPES } from "@/lib/site";

const SIZE = 9;

// Una semilla por visita: en el servidor no hay (null) y en el navegador se sortea una vez.
const clientSeed = Math.floor(Math.random() * 2 ** 31);
const subscribe = () => () => {};

/** Mezcla determinística a partir de la semilla (mulberry32 + Fisher–Yates). */
function shuffled<T>(items: T[], seed: number) {
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Mosaico de retratos reales en blanco y negro con un velo rojo, elegidos al azar
 * en cada visita entre los perfiles que tienen foto. Al pasar el mouse (o enfocar
 * con teclado) cada foto recupera su color.
 */
export function HeroMosaic({ profiles }: { profiles: ProfileTeaser[] }) {
  const seed = useSyncExternalStore(
    subscribe,
    () => clientSeed,
    () => null,
  );
  const sample = useMemo(() => {
    if (seed === null) return null;
    return shuffled(
      profiles.filter((p) => p.picture),
      seed,
    ).slice(0, SIZE);
  }, [profiles, seed]);

  return (
    <ul aria-label="Algunos perfiles del directorio" className="grid grid-flow-dense grid-cols-5 gap-1.5 sm:gap-2">
      {Array.from({ length: SIZE }, (_, i) => {
        const p = sample?.[i];
        // Dos fotos grandes en esquinas opuestas: arriba a la izquierda y abajo a la derecha.
        const big = i === 0 ? "col-span-2 row-span-2" : i === 6 ? "col-span-2 row-span-2 col-start-4 row-start-2" : undefined;
        if (!p) {
          // Mientras se sortea (antes de hidratar) se reserva el lugar: sin saltos de diseño.
          return (
            <li key={`ph-${i}`} className={big}>
              <span className="block aspect-square rounded-md bg-[var(--veil)] opacity-40" />
            </li>
          );
        }
        return (
          <li key={p.slug} className={`animate-in fade-in duration-700 ${big ?? ""}`}>
            <Link
              href={`/users/${encodeURIComponent(p.slug)}/`}
              className="group relative block aspect-square overflow-hidden rounded-md bg-stone focus-visible:ring-2 focus-visible:ring-brand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.picture ?? ""}
                alt=""
                width={235}
                height={235}
                loading="eager"
                decoding="async"
                className="size-full object-cover contrast-[1.08] grayscale transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.04] group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-[var(--veil)] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-2 pt-6 pb-1.5 text-left text-[0.8rem] leading-tight font-medium text-white transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: TYPES[p.type].color }} />
                <span className="line-clamp-2">{p.name}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
