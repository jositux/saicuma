"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Permite cerrar un panel lateral (que entra desde la derecha) arrastrándolo
 * hacia la derecha con el dedo o el mouse. El desplazamiento vertical sigue
 * funcionando normal; sólo se activa cuando el gesto es claramente horizontal.
 */
export function useSwipeToClose({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const mode = useRef<"undecided" | "drag" | "scroll">("undecided");
  const justDragged = useRef(false);

  // Cada vez que se abre, arranca en su lugar (ajuste durante el render, sin efecto).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOffset(0);
      setDragging(false);
    }
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    mode.current = "undecided";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    if (mode.current === "undecided") {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        mode.current = "drag";
        setDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Algunos navegadores no permiten capturar; el gesto sigue funcionando igual.
        }
      } else if (Math.abs(dy) > 8) {
        mode.current = "scroll";
      }
    }
    if (mode.current === "drag") {
      setOffset(Math.max(0, dx));
    }
  }, []);

  const finish = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = start.current;
      start.current = null;
      if (!s || mode.current !== "drag") return;

      const dx = Math.max(0, e.clientX - s.x);
      const velocity = dx / Math.max(1, e.timeStamp - s.t); // px por ms
      const width = e.currentTarget.getBoundingClientRect().width;
      justDragged.current = true;
      setDragging(false);

      if (dx > width * 0.3 || velocity > 0.5) {
        setOffset(width); // termina de salir y después cierra
        window.setTimeout(onClose, 180);
      } else {
        setOffset(0); // vuelve a su lugar
      }
    },
    [onClose],
  );

  // Evita que soltar el dedo después de arrastrar "haga clic" en un link.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (justDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      justDragged.current = false;
    }
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
    },
    style: {
      transform: offset ? `translateX(${offset}px)` : undefined,
      transition: dragging ? "none" : "transform 180ms ease-out",
      touchAction: "pan-y" as const,
    },
  };
}
