"use client";

import { FormEvent, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SecurityIcon from "@mui/icons-material/Security";
import { TwoFactorSetup } from "@/domain/Auth";
import { ApiError } from "@/domain/Errors";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { TotpInput } from "@/presentation/components/features/auth/components/AuthHelpers";
import {
  totpSetupSchema,
  twoFactorLoginCodeSchema,
} from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";
import { to } from "@/utils/async";

const setupSteps = [
  "Escanea el codigo QR con Google Authenticator, Microsoft Authenticator o Authy.",
  "Usa la clave manual si no puedes escanear el codigo.",
  "Ingresa el codigo de 6 digitos para confirmar la activacion.",
];

type SettingsMode = "main" | "setup" | "disable" | "disable_success";

export function SecuritySettingsView() {
  const [mode, setMode] = useState<SettingsMode>("main");
  const [setup, setSetup] = useState<TwoFactorSetup | undefined>(undefined);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRequestedSetup = useRef(false);
  const twoFactorEnabled = useAuthStore((state) =>
    state.twoFactorEnabled ?? state.userProfile?.twoFactorEnabled ?? false,
  );
  const setTwoFactorEnabled = useAuthStore(
    (state) => state.setTwoFactorEnabled,
  );

  const copyToClipboard = async (value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
  };

  const clearMessages = () => {
    setError(undefined);
    setSuccess(undefined);
  };

  const handleBackToSection = () => {
    clearMessages();
    setMode("main");
    setSetupCode("");
    setDisableCode("");
    setBackupCodes([]);
  };

  const handleOpenTwoFactor = () => {
    clearMessages();
    if (twoFactorEnabled) {
      setMode("disable");
      setDisableCode("");
      return;
    }

    void handleStartSetup();
  };

  const handleStartSetup = async () => {
    clearMessages();
    setBackupCodes([]);
    setSetupCode("");

    if (twoFactorEnabled) {
      if (backupCodes.length > 0) return;
      setMode("disable");
      setSuccess("La autenticacion de dos factores ya esta activada.");
      return;
    }

    setMode("setup");

    if (setup || hasRequestedSetup.current) return;

    hasRequestedSetup.current = true;
    setIsLoadingSetup(true);
    const [err, result] = await to(authService.setupTwoFactor());
    setIsLoadingSetup(false);

    if (err) {
      if (err instanceof ApiError && err.errorCode === "TWO_FA_ALREADY_ENABLED") {
        setTwoFactorEnabled(true);
        setMode("disable");
        setSuccess("La autenticacion de dos factores ya esta activada.");
        return;
      }

      hasRequestedSetup.current = false;
      setError(getSpanishAuthErrorMessage(err, "No se pudo preparar la configuracion 2FA"));
      return;
    }

    setSetup(result);
  };

  const handleEnableSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setBackupCodes([]);

    const validation = totpSetupSchema.safeParse({ code: setupCode });
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

  const handleDisableSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const validation = twoFactorLoginCodeSchema.safeParse({ code: disableCode });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const [err] = await to(authService.disableTwoFactor({ code: validation.data.code }));
    setIsSubmitting(false);

    if (err) {
      setError(getSpanishAuthErrorMessage(err, "No se pudo deshabilitar 2FA"));
      return;
    }

    setDisableCode("");
    setSetupCode("");
    setBackupCodes([]);
    setSetup(undefined);
    hasRequestedSetup.current = false;
    setTwoFactorEnabled(false);
    setMode("disable_success");
    setSuccess("La autenticacion de dos factores fue deshabilitada correctamente.");
  };

  const handleFinishDisable = () => {
    clearMessages();
    setMode("main");
  };

  const hasBackupCodes = backupCodes.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ color: "text.primary", fontWeight: 700, mb: 0.75 }}>
          Configuracion
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Administra la seguridad de acceso de tu cuenta.
        </Typography>
      </Box>

      {mode === "main" && (
        <Box
          component="button"
          type="button"
          onClick={handleOpenTwoFactor}
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 2.5, md: 3 },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textAlign: "left",
            cursor: "pointer",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
            "&:hover": {
              bgcolor: "action.hover",
              borderColor: "primary.main",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          <SecurityIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="span" sx={{ color: "text.primary", fontWeight: 700, display: "block" }}>
              Verificacion de dos factores
            </Typography>
            <Typography variant="body2" component="span" sx={{ color: "text.secondary", display: "block" }}>
              Configura o administra la proteccion con app autenticadora.
            </Typography>
          </Box>
        </Box>
      )}

      {mode !== "main" && (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {mode !== "disable_success" && (
              <IconButton aria-label="Volver a configuracion" size="small" onClick={handleBackToSection}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="h6" component="h2" sx={{ color: "text.primary", fontWeight: 700 }}>
                Verificacion de dos factores
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Administra la proteccion con app autenticadora.
              </Typography>
            </Box>
          </Box>

          <Divider />

          {error && <Alert severity="error">{error}</Alert>}
          {success && mode !== "disable_success" && <Alert severity="success">{success}</Alert>}

          {mode === "setup" && (
            <Box component="form" onSubmit={handleEnableSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {isLoadingSetup && <Alert severity="info">Preparando codigo QR...</Alert>}

              {setup && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center", width: "100%" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 300px) minmax(0, 1fr)" }, gap: 3, alignItems: "start", width: "100%", maxWidth: 820 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 214, height: 214, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <QRCodeSVG value={setup.otpauthUri} size={190} />
                      </Box>
                      <Box sx={{ width: "100%", textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                          Clave manual
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

                    <Stack spacing={1.5} sx={{ width: "100%" }}>
                      <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700 }}>
                        Pasos
                      </Typography>
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

                  {!hasBackupCodes && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center", width: "100%", maxWidth: 620 }}>
                      <Alert severity="info" sx={{ width: "100%" }}>
                        Despues de escanear el QR, ingresa el codigo actual de tu app autenticadora.
                      </Alert>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 700, textAlign: "center" }}>
                          Codigo de verificacion (6 digitos)
                        </Typography>
                        <TotpInput value={setupCode} onChange={setSetupCode} />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", width: "100%" }}>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Activando..." : "Activar 2FA"}
                        </Button>
                        <Button type="button" variant="outlined" onClick={handleBackToSection}>
                          Cancelar
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {hasBackupCodes && (
                <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700 }}>
                        Guarda tus codigos de respaldo
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Cada codigo se puede usar una sola vez si pierdes acceso a tu app autenticadora.
                      </Typography>
                    </Box>
                    <Tooltip title="Copiar todos">
                      <IconButton aria-label="Copiar codigos de respaldo" onClick={() => copyToClipboard(backupCodes.join(String.fromCharCode(10)))}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1 }}>
                    {backupCodes.map((backupCode) => (
                      <Typography key={backupCode} variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "action.hover", p: 1, textAlign: "center" }}>
                        {backupCode}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Button type="button" onClick={handleBackToSection} sx={{ width: "auto", px: 3 }}>
                      Finalizar
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {mode === "disable" && (
            <Box component="form" onSubmit={handleDisableSubmit} sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, alignItems: "center", width: "100%", maxWidth: 720 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, alignItems: "center", textAlign: "center", width: "100%" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LockOpenIcon color="error" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 700, mb: 0.75 }}>
                      Confirmar
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Al deshabilitar 2FA, tu proximo inicio de sesion solo requerira correo y contrasena.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                  <Alert severity="warning" sx={{ width: "100%" }}>
                    Usa un codigo actual de tu app autenticadora o un codigo de respaldo valido.
                  </Alert>
                  <TextField
                    fullWidth
                    label="Codigo de autenticacion"
                    value={disableCode}
                    onChange={(event) => setDisableCode(event.target.value.trim())}
                    placeholder="123456 o ABCD-1234"
                    autoComplete="one-time-code"
                    slotProps={{
                      htmlInput: {
                        inputMode: "text",
                        maxLength: 32,
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", width: "100%" }}>
                    <Button type="submit" color="error" disabled={isSubmitting || !disableCode.trim()}>
                      {isSubmitting ? "Deshabilitando..." : "Confirmar"}
                    </Button>
                    <Button type="button" variant="outlined" onClick={handleBackToSection}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {mode === "disable_success" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", alignSelf: "center", width: "100%", maxWidth: 520 }}>
              <Alert severity="success" sx={{ width: "100%", justifyContent: "center" }}>
                {success}
              </Alert>
              <Button type="button" onClick={handleFinishDisable} sx={{ minWidth: 160 }}>
                Aceptar
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
