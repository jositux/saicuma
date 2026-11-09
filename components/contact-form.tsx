"use client";

import { useActionState } from "react";
import { CircleCheckIcon, LoaderCircleIcon, SendIcon } from "lucide-react";

import { sendContact, type ContactField, type ContactState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactState = { status: "idle" };

const field = "bg-canvas text-base aria-invalid:border-brand-ink aria-invalid:ring-brand-ink/20";

/** Formulario de contacto: envía por Resend (ver app/actions/contact.ts). */
export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, initialState);

  if (state.status === "ok") {
    return (
      <div role="status" className="page-in flex flex-col items-start gap-4 py-6">
        <CircleCheckIcon className="size-9 text-brand" strokeWidth={1.6} />
        <p className="display text-[1.9rem] text-ink">
          <em>¡Gracias!</em>
        </p>
        <p className="m-0 text-base leading-relaxed text-ink">{state.message}</p>
      </div>
    );
  }

  const err = (name: ContactField) => state.errors?.[name];
  const val = (name: ContactField) => state.values?.[name] ?? "";
  const a11y = (name: ContactField, id: string) => ({
    "aria-invalid": Boolean(err(name)),
    "aria-describedby": err(name) ? `${id}-error` : undefined,
  });

  return (
    // La key fuerza a restaurar lo escrito si el servidor devolvió un error.
    <form
      action={formAction}
      key={state.values ? JSON.stringify(state.values) : "nuevo"}
      noValidate
      className="mt-2 grid gap-5"
    >
      <Field id="your-name" label="Nombre (obligatorio)" error={err("name")}>
        <Input
          id="your-name"
          name="your-name"
          required
          autoComplete="name"
          defaultValue={val("name")}
          {...a11y("name", "your-name")}
          className={`h-11 ${field}`}
        />
      </Field>
      <Field id="your-email" label="Correo electrónico (obligatorio)" error={err("email")}>
        <Input
          id="your-email"
          name="your-email"
          type="email"
          required
          autoComplete="email"
          defaultValue={val("email")}
          {...a11y("email", "your-email")}
          className={`h-11 ${field}`}
        />
      </Field>
      <Field id="your-subject" label="Asunto">
        <Input id="your-subject" name="your-subject" defaultValue={val("subject")} className={`h-11 ${field}`} />
      </Field>
      <Field id="your-message" label="Mensaje (obligatorio)" error={err("message")}>
        <Textarea
          id="your-message"
          name="your-message"
          rows={8}
          required
          defaultValue={val("message")}
          {...a11y("message", "your-message")}
          className={`min-h-40 ${field}`}
        />
      </Field>

      {/* Trampa para robots: oculta para las personas y para los lectores de pantalla. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <Button type="submit" size="lg" disabled={pending} className="disabled:opacity-80">
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <SendIcon />}
          {pending ? "Enviando…" : "Enviar mensaje"}
        </Button>
        {state.status === "error" && state.message ? (
          <p role="alert" className="mt-3 text-sm text-brand-ink">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-[0.95rem]">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-sm text-brand-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
