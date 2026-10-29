import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { QuickSearch } from "@/components/quick-search";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE } from "@/lib/site";

// Tipografías autoalojadas (@fontsource): Archivo para la interfaz, Literata para textos largos.
const archivo = localFont({
  variable: "--font-archivo",
  display: "swap",
  src: [{ path: "../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", style: "normal" }],
  weight: "100 900",
});

const literata = localFont({
  variable: "--font-literata",
  display: "swap",
  src: [
    { path: "../node_modules/@fontsource-variable/literata/files/literata-latin-opsz-normal.woff2", style: "normal" },
    { path: "../node_modules/@fontsource-variable/literata/files/literata-latin-opsz-italic.woff2", style: "italic" },
  ],
  weight: "200 900",
});

// Fraunces para los títulos (todos los ejes: peso, tamaño óptico, SOFT y WONK).
const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "./fonts/fraunces-latin-full-normal.woff2", style: "normal" },
    { path: "./fonts/fraunces-latin-full-italic.woff2", style: "italic" },
  ],
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Directorio de artistas, colectivos e instituciones culturales de Misiones, Argentina. Encontrá a quién contactar por actividad y ciudad.",
  openGraph: { siteName: SITE.name, locale: "es_AR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#211917" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${archivo.variable} ${literata.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
        <a
          href="#contenido"
          className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <QuickSearch />
        </ThemeProvider>
      </body>
    </html>
  );
}
