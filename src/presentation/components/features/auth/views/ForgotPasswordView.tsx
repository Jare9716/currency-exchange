"use client";

import { FormEvent, useState } from "react";
import { Alert, Box, Link, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { forgotPasswordSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    const [err] = await to(authService.forgotPassword(validation.data.email));
    setIsSubmitting(false);

    if (err) {
      setError(getSpanishAuthErrorMessage(err, "Error al enviar el enlace"));
      return;
    }

    setSent(true);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ bgcolor: "background.paper", p: { xs: 4, sm: 6 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: "100%", maxWidth: "420px" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <EmailOutlinedIcon color="primary" sx={{ fontSize: 44, mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Recuperar contraseña
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Ingresa tu correo y te enviaremos un enlace de recuperación.
          </Typography>
        </Box>

        {sent ? (
          <Alert severity="success" sx={{ width: "100%" }}>
            Si el correo existe, recibirás un enlace para restablecer tu contraseña.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField id="forgot-email" label="Correo Electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} error={!!error} helperText={error} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </Button>
          </Box>
        )}

        <Link href="/login" underline="none" sx={{ fontWeight: 600 }}>
          Volver al inicio de sesión
        </Link>
      </Box>
    </Box>
  );
}
