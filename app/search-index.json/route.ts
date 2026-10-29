import { teasers } from "@/lib/data";

/** Índice liviano para el buscador rápido (se genera en el build, sin bios ni galerías). */
export async function GET() {
  return Response.json(teasers(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
