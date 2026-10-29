import Link from "next/link";

import { Wordmark } from "@/components/site-header";
import { NAV_ITEMS, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[var(--slate)] text-[var(--slate-ink)]">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6">
        {/* Invitación grande, en la misma voz tipográfica que los títulos */}
        <Link href="/contact/" className="group block max-w-3xl">
          <p className="display text-[2.4rem] text-white sm:text-[3.6rem]">
            ¿Falta alguien en el directorio?{" "}
            <em className="whitespace-nowrap !text-[#ff8f85] transition-[letter-spacing] duration-300 group-hover:tracking-[0.01em]">
              Contanos →
            </em>
          </p>
        </Link>

        <div className="mt-14 grid gap-8 text-sm md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div className="max-w-sm">
            <Wordmark className="text-lg" />
            <p className="mt-3 leading-relaxed">{SITE.longName}.</p>
          </div>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/85 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <a href={`mailto:${SITE.email}`} className="block text-white/85 underline-offset-4 hover:text-white hover:underline">
              {SITE.email}
            </a>
            <p>Misiones, Argentina</p>
          </div>
        </div>

        <p className="mt-12 text-xs text-[var(--slate-ink)]/80">
          {SITE.name} · Información cultural hecha en Misiones
        </p>
      </div>
    </footer>
  );
}
