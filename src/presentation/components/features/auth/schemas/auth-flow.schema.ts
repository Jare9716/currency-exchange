import { z } from "zod";

export const tenantSelectionSchema = z.object({
  tenantId: z.string().min(1, { message: "Selecciona una empresa" }),
});

export const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });


export const totpSetupSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, { message: "Ingresa un codigo de 6 digitos" }),
});

export const twoFactorLoginCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^(\d{6}|[A-Za-z0-9-]{6,32})$/, {
      message: "Ingresa un codigo de 6 digitos o un codigo de respaldo valido",
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Formato de correo inválido" }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
