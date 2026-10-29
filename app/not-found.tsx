import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <h1 className="display text-[2.6rem] text-ink sm:text-[4rem]">
        No encontramos <em>esta página</em>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Puede que el perfil haya cambiado de dirección. Buscalo en el directorio.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Ir al directorio</Link>
      </Button>
    </div>
  );
}
