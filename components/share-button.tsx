"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Comparte con el menú nativo del teléfono; en escritorio copia el enlace. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelado: no hace falta avisar
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" onClick={share} className="bg-canvas">
      {copied ? <CheckIcon /> : <Share2Icon />}
      {copied ? "Enlace copiado" : "Compartir"}
    </Button>
  );
}
