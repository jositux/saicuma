"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchTrigger } from "@/components/quick-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSwipeToClose } from "@/components/use-swipe-to-close";
import { NAV_ITEMS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-brand px-2.5 py-1 text-[1.35rem] leading-none font-[800] tracking-[-0.02em] text-white [font-stretch:80%]",
        className,
      )}
    >
      SAICuMA
    </span>
  );
}

/** El logo colgando del filete rojo, como la pestaña del encabezado 2014. */
function WordmarkTab() {
  return (
    <span className="relative -mt-1 flex h-[3.75rem] items-end self-start rounded-b-md bg-brand px-3 pb-2.5 shadow-[0_6px_16px_-6px_rgba(0,0,0,.6)] sm:h-[4.25rem] sm:px-4">
      <span className="text-[1.45rem] leading-none font-[800] tracking-[-0.02em] text-white [font-stretch:80%] sm:text-[1.6rem]">
        SAICuMA
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const swipe = useSwipeToClose({ open, onClose: () => setOpen(false) });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/users/") : pathname.startsWith(href);

  return (
    <header className="top-bar sticky top-0 z-40 shadow-[0_1px_0_rgba(0,0,0,.25)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name}, ir al directorio`}>
          <WordmarkTab />
          <span className="hidden text-sm leading-tight text-white/70 [text-shadow:1px_1px_0_rgba(0,0,0,.5)] md:block">
            Información cultural
            <br />
            de Misiones, Argentina
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-[0.8rem] font-semibold tracking-[0.08em] text-white/70 uppercase transition-colors hover:bg-white/10 hover:text-white",
                    isActive(item.href) && "bg-white/[0.08] text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SearchTrigger className="ml-auto sm:ml-1" />
        <ThemeToggle onDark />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-md text-white/85 hover:bg-white/10 hover:text-white sm:hidden"
              aria-label="Abrir menú"
            >
              <MenuIcon className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[82%] select-none" style={swipe.style} {...swipe.handlers}>
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <div className="px-5 pt-5">
              <Wordmark />
            </div>
            <nav aria-label="Principal" className="px-3">
              <ul>
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className="flex min-h-12 items-center rounded-md px-2 text-lg font-medium text-ink hover:bg-stone aria-[current=page]:text-brand-ink"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-auto px-5 pb-6 text-sm text-muted-foreground">
              Deslizá hacia la derecha para cerrar.
            </p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
