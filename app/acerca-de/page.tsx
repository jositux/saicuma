import type { Metadata } from "next";
import Link from "next/link";

import { TypeRibbon } from "@/components/profile-card";
import { TypePlaceholder } from "@/components/type-placeholder";
import { Button } from "@/components/ui/button";
import { SITE, TYPES, type ProfileType } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acerca de",
  description: `Qué es ${SITE.name}: una plataforma gratuita con la información cultural de Misiones, Argentina.`,
};

const ROLES: { type: ProfileType; text: string }[] = [
  { type: "persona", text: "Artistas, técnicos, investigadores, diseñadores, docentes, gestores, productores." },
  { type: "colectivo", text: "Murgas, grupos de danza, grupos de diseño, activistas." },
  { type: "institucion", text: "Casas de la cultura, universidades, ONG, museos, públicas o privadas." },
];

export default function AboutPage() {
  return (
    <article className="page-in mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
      <h1 className="display max-w-4xl text-[2.6rem] text-ink sm:text-[4rem]">
        Una red para la <em>cultura</em> de Misiones
      </h1>
      <div className="prose-saicuma mt-6 text-ink">
        <p>
          El <strong>S</strong>istema de <strong>A</strong>utogestión de <strong>I</strong>nformación{" "}
          <strong>Cu</strong>ltural de <strong>M</strong>isiones, <strong>A</strong>rgentina es una plataforma web
          gratuita para encontrar la información de la cultura de la provincia: saber cómo y a quién contactar.
        </p>
        <p>
          También permite que quienes trabajan en la cultura cuenten qué hacen y ofrezcan sus servicios, para que la
          comunidad pueda acceder a los recursos y trabajadores que ya existen en nuestra región.
        </p>
        <p>
          La idea es construir una red de fomento y una base de datos en la que participemos todos los trabajadores de
          la cultura.
        </p>
      </div>

      <h2 className="section-title mt-14 text-ink">Quiénes forman parte</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <li key={r.type} className="overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
            <div className="relative aspect-[16/10] overflow-hidden">
              <TypePlaceholder type={r.type} size={480} />
              <TypeRibbon type={r.type} className="absolute top-0 right-4" />
            </div>
            <div className="p-5 pt-4">
            <h3 className="section-title text-[1.5rem] text-ink">{TYPES[r.type].plural}</h3>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">{r.text}</p>
            <Link
              href={`/?tipo=${r.type}`}
              className="mt-3 inline-block text-[0.95rem] font-medium text-brand-ink hover:underline"
            >
              Ver {TYPES[r.type].plural.toLowerCase()}
            </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <Button asChild size="lg">
          <Link href="/">Explorar el directorio</Link>
        </Button>
      </div>
    </article>
  );
}
