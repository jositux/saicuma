import profilesData from "@/content/profiles.json";
import taxonomiesData from "@/content/taxonomies.json";
import type { ProfileType } from "@/lib/site";

export type GalleryImage = {
  full: string;
  thumb: string;
  width: number | null;
  height: number | null;
};

export type Profile = {
  slug: string;
  name: string;
  type: ProfileType;
  disciplines: string[];
  city: string;
  contactName: string;
  category: string;
  dependency: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  picture: string | null;
  bio: string;
  links: Partial<Record<"facebook" | "twitter" | "flickr" | "pinterest" | "googleplus" | "web" | "email" | "phone", string>>;
  gallery: GalleryImage[];
  related: string[];
};

/** Lo mínimo que necesita la grilla del directorio (va al cliente). */
export type ProfileTeaser = Pick<Profile, "slug" | "name" | "type" | "disciplines" | "city" | "picture">;

const profiles = profilesData as Profile[];
const bySlug = new Map(profiles.map((p) => [p.slug, p]));

export function allProfiles() {
  return profiles;
}

export function getProfile(slug: string) {
  return bySlug.get(slug);
}

export function teasers(): ProfileTeaser[] {
  return profiles.map(({ slug, name, type, disciplines, city, picture }) => ({
    slug,
    name,
    type,
    disciplines,
    city,
    picture,
  }));
}

export function relatedOf(p: Profile): ProfileTeaser[] {
  return p.related
    .map((s) => bySlug.get(s))
    .filter((x): x is Profile => Boolean(x))
    .map(({ slug, name, type, disciplines, city, picture }) => ({ slug, name, type, disciplines, city, picture }));
}

/** Actividades en el orden del sitio original, sólo las que tienen perfiles. */
export function disciplines() {
  const used = new Set(profiles.flatMap((p) => p.disciplines));
  return (taxonomiesData.disciplines as { id: string; name: string }[])
    .map((d) => d.name)
    .filter((d) => used.has(d));
}

/** Ciudades con perfiles, ordenadas alfabéticamente. */
export function cities() {
  return [...new Set(profiles.map((p) => p.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

/** Teléfono apto para un enlace tel: */
export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/** Asegura que un enlace externo tenga protocolo. */
export function externalHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, "")}`;
}

/** Texto prolijo para mostrar una URL. */
export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "").replace(/\?.*$/, "");
}
