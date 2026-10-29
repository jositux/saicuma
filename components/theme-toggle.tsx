"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

const subscribe = () => () => {};

/** Botón para alternar entre claro y oscuro. */
export function ThemeToggle({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Hasta hidratar no sabemos el tema real: evita mostrar el ícono equivocado.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"}
      title={dark ? "Tema claro" : "Tema oscuro"}
      className={`inline-flex size-11 items-center justify-center rounded-md transition-colors ${onDark ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-ink hover:bg-stone"} ${className}`}
    >
      {mounted ? dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" /> : <span className="size-5" />}
    </button>
  );
}
