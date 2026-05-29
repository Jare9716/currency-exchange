"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Link, TextField, Typography } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { ApiError } from "@/domain/Errors";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TotpInput } from "@/presentation/components/features/auth/components/AuthHelpers";
import { twoFactorLoginCodeSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { clearTwoFactorSession, readTwoFactorSession } from "@/presentation/components/features/auth/utils/two-factor-session";
import { savePasswordExpiryWarning } from "@/presentation/components/features/auth/utils/password-expiry-warning";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";


export function TwoFactorVerifyView() {
  const router = useRouter();
  const [session] = useState(readTwoFactorSession);
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    if (!session) {
      setError("La sesion de verificacion expiro. Inicia sesion nuevamente.");
      return;
    }

    const validation = twoFactorLoginCodeSchema.safeParse({ code });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const [err, result] = await to(
      authService.verifyTwoFactor({
        stateToken: session.stateToken,
        code: validation.data.code,
      }),
    );
    setIsSubmitting(false);

    if (err) {
      if (err instanceof ApiError && err.errorCode === "SESSION_EXPIRED") {
        clearTwoFactorSession();
        setError(getSpanishAuthErrorMessage(err, "La sesion de verificacion expiro. Inicia sesion nuevamente."));
        router.replace("/login");
        return;
      }

      setError(getSpanishAuthErrorMessage(err, "No se pudo verificar el codigo"));
      return;
    }

    if (!result) {
      setError("No se recibio una sesion valida. Inicia sesion nuevamente.");
      return;
    }

    const authState = useAuthStore.getState();
    authState.setTokens(result.accessToken, result.refreshToken);
    authState.setTwoFactorEnabled(true);
    clearTwoFactorSession();
    savePasswordExpiryWarning({
      mustChangePassword: !!result.mustChangePassword,
      passwordExpiresInDays: result.passwordExpiresInDays,
    });
    router.push("/dashboard/transactions");
  };


  const toggleBackupCode = () => {
    setCode("");
    setError(undefined);
    setUseBackupCode((current) => !current);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2 }}>
      <Box sx={{ bgcolor: "background.paper", p: { xs: 3, sm: 5 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, width: "100%", maxWidth: "440px" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" component="p" sx={{ color: "primary.main", fontWeight: 800, mb: 1 }}>
            JokerLabs
          </Typography>
          <SecurityIcon color="primary" sx={{ fontSize: 42, mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Verificacion de dos factores
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Ingresa el codigo de tu app autenticadora o un codigo de respaldo.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          {session?.email && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Verificando acceso para <strong>{session.email}</strong>
            </Alert>
          )}


          {useBackupCode ? (
            <TextField
              fullWidth
              label="Codigo de respaldo"
              value={code}
              onChange={(event) => setCode(event.target.value.trim())}
              placeholder="ABCD-1234"
              autoComplete="one-time-code"
              slotProps={{
                htmlInput: {
                  inputMode: "text",
                  maxLength: 32,
                },
              }}
              sx={{ mb: 2 }}
            />
          ) : (
            <TotpInput value={code} onChange={setCode} />
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button type="submit" disabled={isSubmitting} sx={{ mt: 0.5 }}>
            {isSubmitting ? "Verificando..." : "Verificar codigo"}
          </Button>
          <Button type="button" variant="outlined" onClick={toggleBackupCode} sx={{ mt: 1 }}>
            {useBackupCode ? "Usar codigo de autenticador" : "Usar codigo de respaldo"}
          </Button>
          <Box sx={{ textAlign: "center", mt: 1.5 }}>
            <Link href="/login" underline="none" sx={{ fontWeight: 600 }} onClick={clearTwoFactorSession}>
              Volver al inicio de sesion
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
