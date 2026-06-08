"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Chip,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { TenantMembership } from "@/domain/Auth";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { Button } from "@/presentation/components/ui/Button/Button";
import { tenantSelectionSchema } from "@/presentation/components/features/auth/schemas/auth-flow.schema";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useNotificationStore } from "@/presentation/stores/notification.store";
import { to } from "@/utils/async";
import { savePasswordExpiryWarning } from "@/presentation/components/features/auth/utils/password-expiry-warning";
import { saveTwoFactorSession } from "@/presentation/components/features/auth/utils/two-factor-session";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";

type TenantSelectionSession = {
  sessionToken: string;
  memberships: TenantMembership[];
  email: string;
};

const readTenantSelectionSession = (): TenantSelectionSession | undefined => {
  if (typeof window === "undefined") return undefined;

  const rawSession = sessionStorage.getItem("auth:tenant-selection");
  if (!rawSession) return undefined;

  try {
    return JSON.parse(rawSession) as TenantSelectionSession;
  } catch {
    sessionStorage.removeItem("auth:tenant-selection");
    return undefined;
  }
};

export function TenantSelectionView() {
  const router = useRouter();
  const [session] = useState<TenantSelectionSession | undefined>(
    readTenantSelectionSession,
  );
  const [selectedMembershipId, setSelectedMembershipId] = useState(
    () => session?.memberships[0]?.membershipId ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [router, session]);

  const selectedMembership = session?.memberships.find(
    (membership) => membership.membershipId === selectedMembershipId,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = tenantSelectionSchema.safeParse({ tenantId: selectedMembershipId });

    if (!validation.success || !session) {
      showNotification(
        validation.success ? "Sesión de selección expirada" : validation.error.issues[0].message,
        "error",
        "Empresa requerida",
      );
      return;
    }

    setIsSubmitting(true);
    const [err, result] = await to(
      authService.selectTenant({
        sessionToken: session.sessionToken,
        membershipId: selectedMembershipId,
      }),
    );
    setIsSubmitting(false);

    if (err) {
      const message = getSpanishAuthErrorMessage(err, "Error al seleccionar empresa");
      showNotification(message, "error", "No se pudo continuar");
      return;
    }

    if (!result) return;


    if (result.type === "two_factor_required") {
      saveTwoFactorSession({
        stateToken: result.stateToken,
        email: session.email,
      });
      sessionStorage.removeItem("auth:tenant-selection");
      router.push("/2fa/verify");
      return;
    }

    useAuthStore.getState().setTokens(result.accessToken, result.refreshToken);
    sessionStorage.removeItem("auth:tenant-selection");
    savePasswordExpiryWarning({
      mustChangePassword: !!result.mustChangePassword,
      passwordExpiresInDays: result.passwordExpiresInDays,
    });

    router.push("/dashboard/transactions");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ bgcolor: "background.paper", p: { xs: 4, sm: 6 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: "100%", maxWidth: "520px" }}>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h4" component="h1" sx={{ color: "text.primary", mb: 1 }}>
            Selecciona tu empresa
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Tu cuenta tiene acceso a varias organizaciones.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Autenticado como <strong>{session?.email ?? "usuario"}</strong>
          </Alert>

          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {(session?.memberships ?? []).map((membership) => {
              const isSelected = membership.membershipId === selectedMembershipId;
              const initials = membership.tenantName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

              return (
                <ListItemButton key={membership.membershipId} selected={isSelected} onClick={() => setSelectedMembershipId(membership.membershipId)} sx={{ border: "1px solid", borderColor: isSelected ? "primary.main" : "divider", borderRadius: 1, gap: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 1, bgcolor: "action.hover", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      {initials}
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={membership.tenantName} secondary={<Box component="span" sx={{ display: "flex", gap: 1, mt: 0.5 }}><Chip label={membership.role} size="small" color="primary" /><Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>{membership.tenantSlug}</Typography></Box>} />
                  {isSelected && <CheckIcon color="primary" />}
                </ListItemButton>
              );
            })}
          </List>

          <Button type="submit" disabled={isSubmitting || !selectedMembership} sx={{ mt: 3 }}>
            {isSubmitting ? "Continuando..." : "Continuar con " + (selectedMembership?.tenantName ?? "empresa")}
          </Button>
          <Box sx={{ textAlign: "center", mt: 1.5 }}>
            <Link href="/login" underline="none" sx={{ fontWeight: 600 }}>
              Cerrar sesión
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
