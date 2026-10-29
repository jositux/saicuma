import Link from "next/link";
import { LandmarkIcon, UserIcon, UsersIcon } from "lucide-react";

import type { ProfileTeaser } from "@/lib/data";
import { TypePlaceholder } from "@/components/type-placeholder";
import { TYPES } from "@/lib/site";

export function TypeBadge({ type, className = "" }: { type: ProfileTeaser["type"]; className?: string }) {
  const t = TYPES[type];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-ink ${className}`}>
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: t.color }} />
      {t.label}
    </span>
  );
}

const RIBBON_ICON = { persona: UserIcon, colectivo: UsersIcon, institucion: LandmarkIcon };

/** Banderín con muesca, heredado de los íconos de tipo del sitio 2014. */
export function TypeRibbon({ type, className = "" }: { type: ProfileTeaser["type"]; className?: string }) {
  const Icon = RIBBON_ICON[type];
  return (
    <span
      aria-hidden
      className={`flex h-12 w-9 justify-center pt-2 text-white drop-shadow-[0_3px_4px_rgba(0,0,0,.35)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)] ${className}`}
      style={{ background: TYPES[type].color }}
    >
      <Icon className="size-[18px]" strokeWidth={2.4} />
    </span>
  );
}

export function ProfileCard({ profile, priority = false }: { profile: ProfileTeaser; priority?: boolean }) {
  return (
    <Link
      href={`/users/${encodeURIComponent(profile.slug)}/`}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-canvas ring-1 ring-line transition-shadow hover:shadow-[0_8px_28px_-12px_var(--shadow)] focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-stone">
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.picture}
            alt=""
            width={235}
            height={235}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <TypePlaceholder type={profile.type} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        )}
        <TypeRibbon type={profile.type} className="absolute top-0 right-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <TypeBadge type={profile.type} />
        <h3 className="font-display text-[1.2rem] leading-[1.15] font-medium tracking-[-0.01em] text-ink group-hover:text-brand-ink">
          {profile.name}
        </h3>
        {profile.disciplines.length ? (
          <p className="text-sm text-muted-foreground">{profile.disciplines.join(", ")}</p>
        ) : null}
        <p className="mt-auto pt-1 text-sm font-medium text-ink">{profile.city}</p>
      </div>
    </Link>
  );
}
