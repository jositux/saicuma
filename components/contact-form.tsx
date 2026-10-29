"use client";

import { useState } from "react";
import { SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/lib/site";

/**
 * Reemplazo del formulario Contact Form 7. Sin backend: arma el correo y lo
 * abre en el cliente de mail de quien escribe.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("your-name") ?? "");
    const email = String(data.get("your-email") ?? "");
    const subject = String(data.get("your-subject") ?? "") || `Contacto desde la web — ${name}`;
    const message = String(data.get("your-message") ?? "");
    const body = `${message}\n\n— ${name} <${email}>`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field = "h-11 bg-canvas text-base";

  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="your-name" className="text-[0.95rem]">
          Nombre (obligatorio)
        </Label>
        <Input id="your-name" name="your-name" required autoComplete="name" className={field} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="your-email" className="text-[0.95rem]">
          Correo electrónico (obligatorio)
        </Label>
        <Input
          id="your-email"
          name="your-email"
          type="email"
          required
          autoComplete="email"
          className={field}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="your-subject" className="text-[0.95rem]">
          Asunto
        </Label>
        <Input id="your-subject" name="your-subject" className={field} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="your-message" className="text-[0.95rem]">
          Mensaje
        </Label>
        <Textarea id="your-message" name="your-message" rows={8} required className="min-h-40 bg-canvas text-base" />
      </div>
      <div>
        <Button
          type="submit"
          size="lg"
        >
          <SendIcon />
          Escribir el mensaje en mi correo
        </Button>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Se abrió tu programa de correo con el mensaje listo para enviar a {SITE.email}.
          </p>
        ) : null}
      </div>
    </form>
  );
}
