import { Suspense } from "react";

import { Directory } from "@/components/directory";
import { HeroMosaic } from "@/components/hero-mosaic";
import { allProfiles, cities, disciplines, teasers } from "@/lib/data";

export default function Home() {
  const profiles = teasers();
  const cityCount = cities().length;
  const counts = {
    persona: allProfiles().filter((p) => p.type === "persona").length,
    colectivo: allProfiles().filter((p) => p.type === "colectivo").length,
    institucion: allProfiles().filter((p) => p.type === "institucion").length,
  };

  return (
    <div className="page-in">
      <section className="mx-auto grid max-w-7xl items-end gap-8 px-4 pt-10 pb-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
        <div>
          <h1 className="display text-[3rem] text-ink sm:text-[4.5rem] lg:text-[5rem]">
            Quién hace <em>cultura</em> en Misiones
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {counts.persona} artistas y trabajadores de la cultura, {counts.colectivo} colectivos y{" "}
            {counts.institucion} instituciones de {cityCount} ciudades. Encontrá con quién trabajar y cómo
            contactarlo.
          </p>
        </div>
        <HeroMosaic profiles={profiles.filter((p) => p.picture)} />
      </section>

      <Suspense fallback={<div className="mx-auto h-96 max-w-7xl px-4 sm:px-6" />}>
        <Directory profiles={profiles} disciplines={disciplines()} cities={cities()} />
      </Suspense>
    </div>
  );
}
