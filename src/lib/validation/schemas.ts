import { z } from "zod";

export const embedRequestSchema = z.object({
  query: z
    .string()
    .min(1, "El texto no puede estar vacío")
    .max(500, "El texto no puede exceder 500 caracteres")
    .trim(),
});

export const searchWordSchema = z.object({
  text: z
    .string()
    .min(1, "El texto no puede estar vacío")
    .max(100, "El texto no puede exceder 100 caracteres")
    .trim()
    .optional(),
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número válido")
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export type EmbedRequest = z.infer<typeof embedRequestSchema>;
export type SearchWordRequest = z.infer<typeof searchWordSchema>;

export const semanticSearchSchema = z.object({
  query: z.string().min(1, "La consulta es requerida").max(500, "Consulta demasiado larga").trim(),
  limit: z.number().min(1).max(50).default(5),
});

export type SemanticSearchRequest = z.infer<typeof semanticSearchSchema>;

export const chatRequestSchema = z.object({
  message: z.string().min(1, "El mensaje es requerido").max(2000, "Mensaje demasiado largo").trim(),
  chatId: z.number().int("Chat ID debe ser un número entero").positive("Chat ID debe ser positivo"),
  userName: z.string().min(1).max(50).optional(), // Nombre o apodo del usuario para personalizar respuestas
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
