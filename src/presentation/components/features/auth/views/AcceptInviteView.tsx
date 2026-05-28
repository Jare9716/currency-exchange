"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Typography } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { PasswordStrength } from "@/presentation/components/features/auth/components/AuthHelpers";
import { acceptInviteSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";

type AcceptInviteViewProps = {
  token?: string;
};

export function AcceptInviteView({ token }: AcceptInviteViewProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(undefined);

    if (!token) {
      setGeneralError("El enlace de invitación no incluye un token válido.");
      return;
    }

    const validation = acceptInviteSchema.safeParse({ password, confirmPassword });

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
    const [err, tokens] = await to(
      authService.acceptInvite({
        token,
        newPassword: validation.data.password,
      }),
    );
    setIsSubmitting(false);

    if (err) {
      setGeneralError(getSpanishAuthErrorMessage(err, "Error al activar la cuenta"));
      return;
    }

    if (tokens) {
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
      router.push("/dashboard/transactions");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: { xs: 4, sm: 6 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          width: "100%",
          maxWidth: "520px",
        }}
      >
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Configura tu cuenta
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Elige una contraseña para activar tu acceso.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Alert severity="success" icon={<BusinessIcon />}>
            Has recibido una invitación para activar tu acceso.
          </Alert>
          {generalError && <Alert severity="error">{generalError}</Alert>}

          <TextField
            id="invite-password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={!!errors.password}
            helperText={errors.password}
          />
          <PasswordStrength password={password} />
          <TextField
            id="invite-confirm-password"
            label="Confirmar Contraseña"
            type="password"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Activando..." : "Activar mi cuenta"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
