import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "Formato de correo inválido" })
    .min(1, { message: "El correo es obligatorio" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
