import { z } from "zod";

export const createCustomerSchema = z.object({
  first_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  first_surname: z.string().optional(),
  document_type: z.enum(["CC", "NIT", "CE", "PASAPORTE"]),
  document_number: z.string().min(5, { message: "El documento debe tener al menos 5 caracteres" }),
  person_type: z.enum(["natural", "juridical"]),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
