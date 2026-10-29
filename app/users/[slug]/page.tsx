import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  BuildingIcon,
  ChevronLeftIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";

import { FacebookIcon, PinterestIcon, XIcon } from "@/components/brand-icons";
import { Gallery } from "@/components/gallery";
import { ProfileCard, TypeBadge, TypeRibbon } from "@/components/profile-card";
import { TypePlaceholder } from "@/components/type-placeholder";
import { ShareButton } from "@/components/share-button";
import {
  allProfiles,
  externalHref,
  getProfile,
  prettyUrl,
  relatedOf,
  telHref,
  type Profile,
} from "@/lib/data";
import { SITE, TYPES } from "@/lib/site";

export function generateStaticParams() {
  return allProfiles().map((p) => ({ slug: p.slug }));
}

async function load(params: PageProps<"/users/[slug]">["params"]) {
  const { slug } = await params;
  return getProfile(decodeURIComponent(slug));
}

export async function generateMetadata({ params }: PageProps<"/users/[slug]">): Promise<Metadata> {
  const p = await load(params);
  if (!p) return {};
  const what = [TYPES[p.type].label, p.disciplines.join(", "), p.city].filter(Boolean).join(" · ");
  const description = p.bio ? p.bio.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) : what;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/users/${p.slug}/` },
    openGraph: { title: `${p.name} | ${SITE.name}`, description, images: p.picture ? [p.picture] : undefined },
  };
}

export default async function ProfilePage({ params }: PageProps<"/users/[slug]">) {
  const p = await load(params);
  if (!p) notFound();
  const related = relatedOf(p);

  return (
    <article className="page-in mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-1 rounded-md pr-2 text-[0.95rem] font-medium text-muted-foreground hover:text-ink"
      >
        <ChevronLeftIcon className="size-5" />
        Directorio
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-12">
        {/* Columna de contacto */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
            <div className="relative aspect-square bg-stone">
              {p.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.picture} alt={`Imagen de ${p.name}`} width={300} height={300} className="size-full object-cover" />
              ) : (
                <TypePlaceholder type={p.type} size={300} />
              )}
              <TypeRibbon type={p.type} className="absolute top-0 right-4 h-14 w-10" />
            </div>
            <ContactList profile={p} />
          </div>
        </aside>

        {/* Contenido */}
        <div className="min-w-0">
          <header className="border-b border-line pb-6">
            <TypeBadge type={p.type} className="text-[0.9rem]" />
            <h1 className="display mt-3 text-[2.4rem] text-ink sm:text-[3.1rem] lg:text-[3.75rem]">
              {p.name}
            </h1>
            {p.disciplines.length ? (
              <p className="mt-3 text-[1.05rem] text-ink">{p.disciplines.join(", ")}</p>
            ) : null}
            <p className="mt-1 inline-flex items-center gap-1.5 text-[1.05rem] text-muted-foreground">
              <MapPinIcon className="size-4" />
              {p.city}, Misiones
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.email ? (
                <a
                  href={`mailto:${p.email}`}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white hover:brightness-110"
                >
                  <MailIcon className="size-4" />
                  Escribir
                </a>
              ) : null}
              {p.phone && telHref(p.phone) ? (
                <a
                  href={telHref(p.phone)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-4 text-sm font-medium text-ink hover:bg-stone"
                >
                  <PhoneIcon className="size-4" />
                  Llamar
                </a>
              ) : null}
              <ShareButton title={p.name} />
            </div>
          </header>

          {p.bio ? (
            <section aria-labelledby="bio" className="mt-8">
              <h2 id="bio" className="section-title text-ink">
                Sobre {p.type === "persona" ? "esta persona" : p.type === "colectivo" ? "el colectivo" : "la institución"}
              </h2>
              <div className="prose-saicuma mt-3 text-ink" dangerouslySetInnerHTML={{ __html: p.bio }} />
            </section>
          ) : null}

          {p.gallery.length ? (
            <section aria-labelledby="galeria" className="mt-10">
              <h2 id="galeria" className="section-title text-ink">
                Galería <span className="font-sans text-base font-normal text-muted-foreground">({p.gallery.length})</span>
              </h2>
              <div className="mt-4">
                <Gallery images={p.gallery} name={p.name} />
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="relacionados" className="mt-16 border-t border-line pt-8">
          <h2 id="relacionados" className="section-title text-ink">
            Perfiles relacionados
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <ProfileCard profile={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function ContactList({ profile: p }: { profile: Profile }) {
  const rows: { icon: ReactNode; label: string; value: ReactNode }[] = [];
  const ext = (href: string, text: string) => (
    <a href={externalHref(href)} target="_blank" rel="noopener noreferrer" className="break-all text-brand-ink hover:underline">
      {text}
    </a>
  );

  if (p.contactName) rows.push({ icon: <UserIcon />, label: "Responsable", value: p.contactName });
  if (p.dependency) rows.push({ icon: <BuildingIcon />, label: "Dependencia", value: p.dependency });
  if (p.category) rows.push({ icon: <TagIcon />, label: "Categoría", value: p.category });
  if (p.phone)
    rows.push({
      icon: <PhoneIcon />,
      label: "Teléfono",
      value: telHref(p.phone) ? (
        <a href={telHref(p.phone)} className="text-brand-ink hover:underline">
          {p.phone}
        </a>
      ) : (
        p.phone
      ),
    });
  if (p.links.phone && p.links.phone !== p.phone)
    rows.push({ icon: <PhoneIcon />, label: "Otro teléfono", value: p.links.phone });
  if (p.email)
    rows.push({
      icon: <MailIcon />,
      label: "Email",
      value: (
        <a href={`mailto:${p.email}`} className="break-all text-brand-ink hover:underline">
          {p.email}
        </a>
      ),
    });
  if (p.links.email && p.links.email !== p.email)
    rows.push({
      icon: <MailIcon />,
      label: "Otro email",
      value: (
        <a href={`mailto:${p.links.email}`} className="break-all text-brand-ink hover:underline">
          {p.links.email}
        </a>
      ),
    });
  if (p.web) rows.push({ icon: <GlobeIcon />, label: "Sitio web", value: ext(p.web, prettyUrl(p.web)) });
  if (p.links.web && p.links.web !== p.web)
    rows.push({ icon: <GlobeIcon />, label: "Otro sitio", value: ext(p.links.web, prettyUrl(p.links.web)) });
  if (p.address || p.city) {
    const where = [p.address, p.city, "Misiones"].filter(Boolean).join(", ");
    rows.push({
      icon: <MapPinIcon />,
      label: p.address ? "Dirección" : "Ciudad",
      value: (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-ink hover:underline"
        >
          {[p.address, p.city].filter(Boolean).join(", ")}
        </a>
      ),
    });
  }

  const socials = [
    p.links.facebook && { href: p.links.facebook, label: "Facebook", icon: <FacebookIcon /> },
    p.links.twitter && { href: p.links.twitter, label: "X (Twitter)", icon: <XIcon /> },
    p.links.pinterest && { href: p.links.pinterest, label: "Pinterest", icon: <PinterestIcon /> },
    p.links.flickr && { href: p.links.flickr, label: "Flickr", icon: <GlobeIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];

  return (
    <div className="p-5">
      <h2 className="sr-only">Contacto</h2>
      <dl className="space-y-3.5">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[20px_1fr] gap-x-3 text-[0.95rem]">
            <dt className="text-muted-foreground [&>svg]:mt-0.5 [&>svg]:size-[18px]">
              {r.icon}
              <span className="sr-only">{r.label}</span>
            </dt>
            <dd className="min-w-0 text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {socials.length ? (
        <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={externalHref(s.href)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-flex size-10 items-center justify-center rounded-md text-lg text-ink ring-1 ring-line hover:bg-stone"
              >
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
