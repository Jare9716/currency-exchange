"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Link, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { PasswordStrength } from "@/presentation/components/features/auth/components/AuthHelpers";
import { resetPasswordSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";

type ResetPasswordViewProps = {
  token?: string;
};

export function ResetPasswordView({ token }: ResetPasswordViewProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(undefined);

    if (!token) {
      setGeneralError("El enlace de recuperación no incluye un token válido.");
      return;
    }

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!validation.success) {
      const nextErrors: Record<string, string | undefined> = {};
      validation.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const [err] = await to(authService.resetPassword({ token, newPassword: validation.data.password }));
    setIsSubmitting(false);

    if (err) {
      setGeneralError(getSpanishAuthErrorMessage(err, "Error al guardar la contrasena"));
      return;
    }

    setCompleted(true);
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ bgcolor: "background.paper", p: { xs: 4, sm: 6 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: "100%", maxWidth: "420px" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <LockOutlinedIcon color="primary" sx={{ fontSize: 44, mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Nueva Contraseña
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Elige una contraseña nueva y segura para tu cuenta.
          </Typography>
        </Box>

        {generalError && <Alert severity="error" sx={{ width: "100%" }}>{generalError}</Alert>}
        {completed && <Alert severity="success" sx={{ width: "100%" }}>Contraseña actualizada. Redirigiendo al inicio de sesión.</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField id="reset-password" label="Nueva Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} error={!!errors.password} helperText={errors.password} />
          <PasswordStrength password={password} />
          <TextField id="reset-confirm-password" label="Confirmar Contraseña" type="password" placeholder="Repite la contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={!!errors.confirmPassword} helperText={errors.confirmPassword} />
          <Button type="submit" disabled={isSubmitting || completed}>
            {isSubmitting ? "Guardando..." : "Guardar Nueva Contraseña"}
          </Button>
        </Box>

        <Link href="/login" underline="none" sx={{ fontWeight: 600 }}>
          Volver al inicio de sesión
        </Link>
      </Box>
    </Box>
  );
}
