import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio" }),
  email: z.email({ message: "Formato de correo inválido" }),
  cc: z.string().min(5, { message: "La CC debe tener al menos 5 caracteres" }),
  phone: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
