import { z } from "zod";

export const searchUserSchema = z.object({
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

export type SearchUserFormData = z.infer<typeof searchUserSchema>;
export type ExchangeFormData = z.infer<typeof exchangeSchema>;
