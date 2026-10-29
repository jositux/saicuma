import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escribile al equipo de ${SITE.name}.`,
};

export default function ContactPage() {
  return (
    <article className="page-in mx-auto grid max-w-7xl gap-10 px-4 pt-10 sm:px-6 sm:pt-14 md:grid-cols-[1fr_minmax(0,560px)]">
      <div>
        <h1 className="display text-[2.6rem] text-ink sm:text-[4rem]">
          <em>Escribinos</em>
        </h1>
        <p className="prose-saicuma mt-5 text-ink">
          Escribinos por cualquier consulta, problema o sugerencia. También podés mandar un correo directo a{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </div>
      <div className="rounded-lg bg-canvas p-6 ring-1 ring-line sm:p-8">
        <ContactForm />
      </div>
    </article>
  );
}
