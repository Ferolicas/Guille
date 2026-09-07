import { z } from "zod";

const cleanOptional = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
    z.string().max(max).nullable(),
  );

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  phone: z.string().trim().min(7, "Escribe un teléfono válido.").max(30),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null),
    z.email("Revisa el correo electrónico.").max(320).nullable(),
  ),
  city: cleanOptional(120),
  service: z.string().trim().min(2, "Selecciona el tipo de trabajo.").max(100),
  message: z.string().trim().min(12, "Cuéntanos un poco más sobre el proyecto.").max(2000),
  consent: z.literal(true, "Necesitamos tu autorización para responderte."),
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().finite().positive(),
  source: z.string().trim().max(60).default("web-form"),
});

export type LeadInput = z.infer<typeof leadSchema>;
