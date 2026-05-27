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
  Grid,
  Paper,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { useNotificationStore } from "@/presentation/stores/notification.store";
import { PhysicalCount } from "@/domain/Shift";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";

interface CloseShiftModalProps {
  open: boolean;
  onClose: () => void;
}

export function CloseShiftModal({ open, onClose }: CloseShiftModalProps) {
  const { activeShift, summary, closeActiveShift } = useShiftStore();
  const { showNotification } = useNotificationStore();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [observations, setObservations] = useState("");

  // Keyed by isoCode -> physical amount string
  const [physicalAmounts, setPhysicalAmounts] = useState<Record<string, string>>({});

  // Helper to build list of expected operated currencies
  const getOperatedCurrencies = () => {
    if (!activeShift) return [];

    const list = [
      {
        iso_code: "COP",
        name: "Pesos Colombianos",
        expected:
          Number(activeShift.opening_cash_cop) +
          Number(summary?.total_cop_sold || 0) -
          Number(summary?.total_cop_purchased || 0),
        symbol: "$",
      },
      ...activeShift.currencies.map((c) => ({
        iso_code: c.iso_code,
        name:
          c.iso_code === "USD"
            ? "Dólar Americano"
            : c.iso_code === "EUR"
              ? "Euro"
              : c.iso_code === "GBP"
                ? "Libra Esterlina"
                : c.iso_code,
        expected: Number(c.units_purchased) - Number(c.units_sold),
        symbol:
          c.iso_code === "USD"
            ? "$"
            : c.iso_code === "EUR"
              ? "€"
              : c.iso_code === "GBP"
                ? "£"
                : "",
      })),
    ];
    return list;
  };

  const operatedCurrencies = getOperatedCurrencies();

  // Pre-fill physical counts on load/opening of modal
  useEffect(() => {
    if (open && activeShift) {
      const initialAmounts: Record<string, string> = {};
      operatedCurrencies.forEach((c) => {
        initialAmounts[c.iso_code] = c.expected.toFixed(0);
      });
      setPhysicalAmounts(initialAmounts);
      setObservations("");
      setErrorMsg(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeShift, summary]);

  const handleAmountChange = (isoCode: string, value: string) => {
    setPhysicalAmounts((prev) => ({
      ...prev,
      [isoCode]: value,
    }));
  };

  const handleSubmit = async () => {
    setErrorMsg(undefined);
    setSubmitting(true);

    try {
      const counts: PhysicalCount[] = operatedCurrencies.map((c) => {
        const inputVal = physicalAmounts[c.iso_code];
        const numVal = Number(inputVal);

        if (inputVal === "" || isNaN(numVal) || numVal < 0) {
          throw new Error(
            `Por favor, introduce un conteo físico válido y mayor a cero para ${c.iso_code}.`
          );
        }

        return {
          iso_code: c.iso_code,
          amount: numVal,
        };
      });

      await closeActiveShift({
        physical_counts: counts,
      });

      showNotification(
        "El turno se ha cerrado exitosamente. Caja conciliada y arqueada.",
        "success",
        "Turno Cerrado"
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al cerrar el turno");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeShift) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>
        Cerrar Turno — Arqueo y Conciliación de Caja
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa el saldo físico billete a billete que tienes físicamente en caja. El sistema conciliará y registrará cualquier diferencia (sobrante o faltante).
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {operatedCurrencies.map((c) => {
              const inputVal = physicalAmounts[c.iso_code] || "0";
              const physicalVal = Number(inputVal) || 0;
              const expectedVal = c.expected;
              const diff = physicalVal - expectedVal;

              return (
                <Paper
                  key={c.iso_code}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "none",
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {c.iso_code} — {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Esperado: {c.symbol}
                      {expectedVal.toLocaleString("es-CO", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        type="number"
                        label="Cantidad Física"
                        value={inputVal}
                        onChange={(e) => handleAmountChange(c.iso_code, e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <Typography variant="body2" sx={{ mr: 0.5, color: "text.secondary" }}>
                                {c.symbol}
                              </Typography>
                            ),
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: { sm: "flex-end" }, gap: 0.5 }}>
                        {diff === 0 ? (
                          <>
                            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                              Caja Conciliada (Diferencia: {c.symbol}0)
                            </Typography>
                          </>
                        ) : diff > 0 ? (
                          <>
                            <WarningIcon color="warning" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 600 }}>
                              Sobrante de {c.symbol}
                              {diff.toLocaleString("es-CO")}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
                              Faltante de {c.symbol}
                              {Math.abs(diff).toLocaleString("es-CO")}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>

          <Divider />

          <Box>
            <TextField
              multiline
              rows={3}
              label="Observaciones de Cierre (Opcional)"
              placeholder="Notas sobre descuadres o novedades encontradas en el conteo..."
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
          color="error"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Cerrando..." : "Confirmar y Cerrar Turno"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
