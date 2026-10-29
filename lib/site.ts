/** Datos fijos del sitio (sin dependencias, se pueden usar en componentes de cliente). */
export const SITE = {
  name: "SAICuMA",
  longName: "Sistema de Autogestión de Información Cultural de Misiones, Argentina",
  tagline: "Información cultural de Misiones, Argentina",
  url: "https://www.saicuma.org",
  email: "info@saicuma.com.ar",
  facebook: "https://www.facebook.com/saicuma",
};

export const NAV_ITEMS = [
  { href: "/", label: "Directorio" },
  { href: "/acerca-de/", label: "Acerca de" },
  { href: "/contact/", label: "Contacto" },
];

export type ProfileType = "persona" | "colectivo" | "institucion";

/** Cada tipo de perfil tiene su color: es información, no decoración. */
export const TYPES: Record<ProfileType, { label: string; plural: string; color: string; placeholder: string; placeholderDark: string }> = {
  persona: {
    label: "Persona",
    plural: "Personas",
    color: "var(--type-persona)",
    placeholder: "/placeholders/persona.webp",
    placeholderDark: "/placeholders/persona-dark.webp",
  },
  colectivo: {
    label: "Colectivo",
    plural: "Colectivos",
    color: "var(--type-colectivo)",
    placeholder: "/placeholders/colectivo.webp",
    placeholderDark: "/placeholders/colectivo-dark.webp",
  },
  institucion: {
    label: "Institución",
    plural: "Instituciones",
    color: "var(--type-institucion)",
    placeholder: "/placeholders/institucion.webp",
    placeholderDark: "/placeholders/institucion-dark.webp",
  },
};
