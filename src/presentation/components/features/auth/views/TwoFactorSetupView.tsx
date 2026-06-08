"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SecurityIcon from "@mui/icons-material/Security";
import { TwoFactorSetup } from "@/domain/Auth";
import { ApiError } from "@/domain/Errors";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { TotpInput } from "@/presentation/components/features/auth/components/AuthHelpers";
import { totpSetupSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";

const setupSteps = [
  "Descarga Google Authenticator, Microsoft Authenticator o Authy en tu telefono.",
  "Escanea el codigo QR o ingresa la clave manual en la app.",
  "Ingresa el codigo de 6 digitos que aparece en la app para verificar.",
];

export function TwoFactorSetupView() {
  const router = useRouter();
  const [setup, setSetup] = useState<TwoFactorSetup | undefined>(undefined);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const twoFactorEnabled = useAuthStore((state) =>
    state.twoFactorEnabled ?? state.userProfile?.twoFactorEnabled ?? false,
  );
  const setTwoFactorEnabled = useAuthStore(
    (state) => state.setTwoFactorEnabled,
  );

  useEffect(() => {
    const loadSetup = async () => {
      if (twoFactorEnabled) {
        router.replace("/dashboard/configuracion");
        return;
      }

      const [err, result] = await to(authService.setupTwoFactor());
      setLoadingSetup(false);

      if (err) {
        if (err instanceof ApiError && err.errorCode === "TWO_FA_ALREADY_ENABLED") {
          setTwoFactorEnabled(true);
          router.replace("/dashboard/configuracion");
          return;
        }

        setError(getSpanishAuthErrorMessage(err, "No se pudo iniciar la configuracion 2FA"));
        return;
      }

      setSetup(result);
    };

    loadSetup();
  }, [router, setTwoFactorEnabled, twoFactorEnabled]);

  const copyToClipboard = async (value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    setBackupCodes([]);

    const validation = totpSetupSchema.safeParse({ code });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const [err, result] = await to(authService.enableTwoFactor({ code: validation.data.code }));
    setIsSubmitting(false);

    if (err) {
      setError(getSpanishAuthErrorMessage(err, "No se pudo activar 2FA"));
      return;
    }

    if (!result) {
      setError("No se recibieron codigos de respaldo. Intenta activar 2FA nuevamente.");
      return;
    }

    setBackupCodes(result.backupCodes);
    setTwoFactorEnabled(true);
    setSuccess("La autenticacion de dos factores fue activada correctamente.");
  };

  const hasBackupCodes = backupCodes.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2 }}>
      <Box sx={{ bgcolor: "background.paper", p: { xs: 3, sm: 5 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, width: "100%", maxWidth: "820px" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" component="p" sx={{ color: "primary.main", fontWeight: 800, mb: 1 }}>
            JokerLabs
          </Typography>
          <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Configurar autenticacion de dos factores
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Aumenta la seguridad de tu cuenta vinculando una app autenticadora.
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ width: "100%" }}>
          El administrador requiere 2FA para tu rol. Debes configurarlo antes de continuar.
        </Alert>
        {loadingSetup && <Alert severity="info" sx={{ width: "100%" }}>Preparando configuracion...</Alert>}
        {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: "100%" }}>{success}</Alert>}

        {setup && (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 300px) 1fr" }, gap: 3, alignItems: "start" }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 214, height: 214, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeSVG value={setup.otpauthUri} size={190} />
                </Box>
                <Box sx={{ width: "100%", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                    Clave manual:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "action.hover", px: 1.5, py: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1, overflowWrap: "anywhere" }}>
                      {setup.secret}
                    </Typography>
                    <Tooltip title="Copiar clave">
                      <IconButton aria-label="Copiar clave manual" size="small" onClick={() => copyToClipboard(setup.secret)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600, mb: 1.5 }}>
                  Pasos:
                </Typography>
                <Stack spacing={1.5}>
                  {setupSteps.map((step, index) => (
                    <Box key={step} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, typography: "caption", fontWeight: 700 }}>
                        {index + 1}
                      </Box>
                      <Typography variant="body2" sx={{ color: "text.primary" }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>

            {!hasBackupCodes && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ color: "text.primary", alignSelf: "flex-start" }}>
                  Codigo de verificacion (6 digitos)
                </Typography>
                <TotpInput value={code} onChange={setCode} />
              </Box>
            )}

            {hasBackupCodes && (
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600 }}>
                      Guarda tus codigos de respaldo
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      Si pierdes tu telefono, usa uno de estos codigos de un solo uso para ingresar.
                    </Typography>
                  </Box>
                  <Tooltip title="Copiar todos">
                    <IconButton aria-label="Copiar codigos de respaldo" onClick={() => copyToClipboard(backupCodes.join(String.fromCharCode(10)))}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1 }}>
                  {backupCodes.map((backupCode) => (
                    <Typography key={backupCode} variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, bgcolor: "action.hover", p: 1, textAlign: "center" }}>
                      {backupCode}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {hasBackupCodes ? (
              <Button type="button" onClick={() => router.push("/dashboard/transactions")}>
                Ya guarde mis codigos
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Activando..." : "Activar 2FA"}
              </Button>
            )}
            <Box sx={{ textAlign: "center" }}>
              <Link href="/dashboard/transactions" underline="none" sx={{ fontWeight: 600 }}>
                Volver al dashboard
              </Link>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
