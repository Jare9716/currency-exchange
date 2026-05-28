"use client";

import { useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Button } from "@/presentation/components/ui/Button/Button";
import {
  PasswordExpiryWarning,
  clearPasswordExpiryWarning,
  readPasswordExpiryWarning,
} from "@/presentation/components/features/auth/utils/password-expiry-warning";

export function PasswordExpiryModal() {
  const [warning, setWarning] = useState<PasswordExpiryWarning | undefined>(
    readPasswordExpiryWarning,
  );

  const handleClose = () => {
    clearPasswordExpiryWarning();
    setWarning(undefined);
  };

  const expiresText =
    typeof warning?.passwordExpiresInDays === "number"
      ? `Tu contraseña vencerá en ${warning.passwordExpiresInDays} día${
          warning.passwordExpiresInDays === 1 ? "" : "s"
        }.`
      : "Tu contraseña está próxima a vencer.";

  return (
    <Dialog open={!!warning} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <WarningAmberIcon color="warning" />
        <Typography variant="h3" component="span">
          Cambio de contraseña requerido
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {expiresText}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Por seguridad, realiza el cambio de contraseña lo antes posible.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button fullWidth={false} onClick={handleClose}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
