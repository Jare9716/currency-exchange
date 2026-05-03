import { z } from "zod";

export const searchClientSchema = z.object({
  ccInput: z.string().min(5, { message: "La CC debe tener al menos 5 caracteres" }),
});

export const exchangeSchema = z.object({
  amountUSD: z
    .string()
    .min(1, { message: "El monto es obligatorio" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Ingrese un monto mayor a 0",
    }),
});

export type SearchClientFormData = z.infer<typeof searchClientSchema>;
export type ExchangeFormData = z.infer<typeof exchangeSchema>;
