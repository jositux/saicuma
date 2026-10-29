"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { GalleryImage } from "@/lib/data";

/** Galería en mosaico + visor a pantalla completa (teclado y deslizar). */
export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (!images.length) return null;
  const current = index === null ? null : images[index];

  return (
    <>
      <ul className="columns-2 gap-2 sm:columns-3 [&>li]:mb-2">
        {images.map((img, i) => (
          <li key={img.full} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="block w-full overflow-hidden rounded-md bg-stone focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumb}
                alt=""
                width={img.width ?? undefined}
                height={img.height ?? undefined}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-opacity hover:opacity-90"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[100dvh] max-h-none w-screen max-w-none items-center justify-center rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <DialogTitle className="sr-only">Galería de {name}</DialogTitle>
          <DialogDescription className="sr-only">
            Usá las flechas para pasar de foto y Escape para cerrar.
          </DialogDescription>
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.full}
              src={current.full}
              alt={`Foto ${(index ?? 0) + 1} de ${images.length} de ${name}`}
              className="max-h-[88dvh] max-w-[94vw] object-contain"
            />
          ) : null}

          <p className="absolute top-4 left-4 text-sm text-white/80 tabular-nums">
            {(index ?? 0) + 1} / {images.length}
          </p>
          <DialogClose className="absolute top-2 right-2 inline-flex size-12 items-center justify-center rounded-full text-white hover:bg-white/10">
            <XIcon className="size-6" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 inline-flex size-12 items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/15"
                aria-label="Foto anterior"
              >
                <ChevronLeftIcon className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 inline-flex size-12 items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/15"
                aria-label="Foto siguiente"
              >
                <ChevronRightIcon className="size-7" />
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
