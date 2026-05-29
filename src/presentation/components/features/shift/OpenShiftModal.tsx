"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Alert,
  Grid,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { getOperatorDetails } from "@/utils/jwt";
import { useNotificationStore } from "@/presentation/stores/notification.store";

interface OpenShiftModalProps {
  open: boolean;
  onClose: () => void;
}

export function OpenShiftModal({ open, onClose }: OpenShiftModalProps) {
  const { openShift } = useShiftStore();
  const { showNotification } = useNotificationStore();

  const [operator] = useState(() => getOperatorDetails());
  // Form states
  const [openingCashCOP, setOpeningCashCOP] = useState("0");
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const handleSubmit = async () => {
    setErrorMsg(undefined);
    setSubmitting(true);

    try {
      await openShift({
        branch_code: operator.branch,
        opening_cash_cop: openingCashCOP,
      });

      showNotification(
        "El turno se ha abierto exitosamente. Ya puedes registrar transacciones.",
        "success",
        "Turno Abierto"
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al abrir el turno");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>
        Abrir Turno — Caja Inicial
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {/* Section 1: Header / Operator Details */}
          <Grid container spacing={2} sx={{ mt: 1.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Sucursal"
                value={`${operator.branch} — ${operator.company}`}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Caja" value="Caja 1" disabled />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Operador"
                value={operator.name}
                disabled
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Section 2: Opening cash COP */}
          <Box>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Fondos Iniciales en COP
            </Typography>
            <TextField
              type="number"
              label="COP Inicial"
              value={openingCashCOP}
              onChange={(e) => setOpeningCashCOP(e.target.value)}
              placeholder="Ej. 2000000"
            />
          </Box>

          <Divider />

          {/* Section 3: Observations */}
          <Box>
            <TextField
              multiline
              rows={3}
              label="Observaciones de Apertura"
              placeholder="Novedades de caja o notas sobre las tasas..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Abriendo..." : "Confirmar Apertura"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
