"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { getOperatorDetails } from "@/utils/jwt";
import { getRateProposal } from "@/use-cases/GetRateProposal";
import { RateProposal } from "@/domain/Shift";
import { useNotificationStore } from "@/presentation/stores/notification.store";

interface OpenShiftModalProps {
  open: boolean;
  onClose: () => void;
}

export function OpenShiftModal({ open, onClose }: OpenShiftModalProps) {
  const { openShift } = useShiftStore();
  const { showNotification } = useNotificationStore();

  const [operator] = useState(() => getOperatorDetails());
  const [proposal, setProposal] = useState<RateProposal | undefined>(undefined);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | undefined>(undefined);

  // Form states
  const [openingCashCOP, setOpeningCashCOP] = useState("2000000");
  const [observations, setObservations] = useState("");
  const [overrides, setOverrides] = useState<
    Record<string, { buy: string; sell: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;

    const fetchProposal = async () => {
      setLoadingProposal(true);
      setProposalError(undefined);
      try {
        const prop = await getRateProposal.execute();
        setProposal(prop);

        // Initialize overrides with empty strings for all proposal currencies
        const initialOverrides: Record<string, { buy: string; sell: string }> = {};
        prop.currencies.forEach((c) => {
          initialOverrides[c.iso_code] = {
            buy: "",
            sell: "",
          };
        });
        setOverrides(initialOverrides);
      } catch (err) {
        setProposalError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la propuesta de tasas de cambio"
        );
      } finally {
        setLoadingProposal(false);
      }
    };

    fetchProposal();
  }, [open]);

  const handleOverrideChange = (
    isoCode: string,
    field: "buy" | "sell",
    value: string
  ) => {
    setOverrides((prev) => ({
      ...prev,
      [isoCode]: {
        ...prev[isoCode],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setErrorMsg(undefined);
    setSubmitting(true);

    try {
      // Validate that all volatility_flagged currencies have overrides specified
      const currenciesPayload = (proposal?.currencies || []).map((c) => {
        const override = overrides[c.iso_code];
        const hasBuyOverride = override?.buy && override.buy.trim() !== "";
        const hasSellOverride = override?.sell && override.sell.trim() !== "";

        if (c.volatility_flagged && (!hasBuyOverride || !hasSellOverride)) {
          throw new Error(
            `Se requiere una sobreescritura manual para ${c.iso_code} debido a la alta volatilidad.`
          );
        }

        return {
          iso_code: c.iso_code,
          buy_rate_override: hasBuyOverride ? override.buy : undefined,
          sell_rate_override: hasSellOverride ? override.sell : undefined,
        };
      });

      await openShift({
        branch_code: operator.branch,
        opening_cash_cop: openingCashCOP,
        currencies: currenciesPayload,
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>
        Abrir Turno — Caja Inicial
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {/* Section 1: Header / Operator Details */}
          <Grid container spacing={2}>
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

          {/* Section 3: Currencies & Volatility Rates */}
          <Box>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Tasas de Operación y Tipo de Cambio
            </Typography>

            {loadingProposal ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : proposalError ? (
              <Alert severity="warning">{proposalError}</Alert>
            ) : !proposal || proposal.currencies.length === 0 ? (
              <Alert severity="warning">
                No hay divisas de operación configuradas o cargadas. No es posible abrir un turno de caja sin divisas registradas.
              </Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {proposal.currencies.map((c) => {
                  const isFlagged = c.volatility_flagged;
                  return (
                    <Box
                      key={c.iso_code}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: isFlagged ? "warning.light" : "divider",
                        bgcolor: isFlagged ? "rgba(230, 74, 25, 0.04)" : "background.default",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="subtitle2">
                          {c.iso_code} — {c.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          TRM: ${Number(c.reference_rate).toLocaleString("es-CO")} · Fuente: {c.rate_source.toUpperCase()}
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 1.5 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tasa Compra Propuesta:{" "}
                            <strong>
                              ${Number(c.proposed_buy_rate).toLocaleString("es-CO")}
                            </strong>
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tasa Venta Propuesta:{" "}
                            <strong>
                              ${Number(c.proposed_sell_rate).toLocaleString("es-CO")}
                            </strong>
                          </Typography>
                        </Grid>
                      </Grid>

                      {isFlagged ? (
                        <Box sx={{ mt: 1 }}>
                          <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                            {c.guard_rail_message ||
                              "Volatilidad alta detectada. Se requiere sobreescritura de tasas por un supervisor."}
                          </Alert>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                type="number"
                                label="Sobreescribir Compra"
                                value={overrides[c.iso_code]?.buy || ""}
                                onChange={(e) =>
                                  handleOverrideChange(c.iso_code, "buy", e.target.value)
                                }
                                placeholder="Ej. 4180"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                type="number"
                                label="Sobreescribir Venta"
                                value={overrides[c.iso_code]?.sell || ""}
                                onChange={(e) =>
                                  handleOverrideChange(c.iso_code, "sell", e.target.value)
                                }
                                placeholder="Ej. 4250"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Tasa propuesta estable (volatilidad de{" "}
                            {(Number(c.volatility_pct) * 100).toFixed(2)}%). Si lo deseas, puedes sobreescibirla de forma opcional:
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                type="number"
                                label="Sobreescribir Compra (Opcional)"
                                value={overrides[c.iso_code]?.buy || ""}
                                onChange={(e) =>
                                  handleOverrideChange(c.iso_code, "buy", e.target.value)
                                }
                                placeholder={Number(c.proposed_buy_rate).toFixed(0)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                type="number"
                                label="Sobreescribir Venta (Opcional)"
                                value={overrides[c.iso_code]?.sell || ""}
                                onChange={(e) =>
                                  handleOverrideChange(c.iso_code, "sell", e.target.value)
                                }
                                placeholder={Number(c.proposed_sell_rate).toFixed(0)}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Section 4: Observations */}
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
          disabled={submitting || loadingProposal || !proposal || proposal.currencies.length === 0}
        >
          {submitting ? "Abriendo..." : "Confirmar Apertura"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
