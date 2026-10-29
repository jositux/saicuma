import { TYPES, type ProfileType } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Imagen para perfiles sin foto: una silueta en duotono rojo según el tipo
 * (persona, colectivo o institución), con su versión para el tema oscuro.
 * Sólo se descarga la que se ve: la oculta queda en `display:none` con carga diferida.
 */
export function TypePlaceholder({
  type,
  className,
  size = 320,
}: {
  type: ProfileType;
  className?: string;
  size?: number;
}) {
  const t = TYPES[type];
  const base = cn("size-full object-cover", className);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.placeholder} alt="" width={size} height={size} loading="lazy" decoding="async" className={cn(base, "dark:hidden")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.placeholderDark} alt="" width={size} height={size} loading="lazy" decoding="async" className={cn(base, "hidden dark:block")} />
    </>
  );
}
