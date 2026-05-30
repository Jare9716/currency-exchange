"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  Grid,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { useTransactionsStore } from "@/presentation/stores/transactions.store";
import { Chip } from "@mui/material";
import { CloseShiftModal } from "./CloseShiftModal";

export function ShiftDashboard() {
  const {
    activeShift,
  } = useShiftStore();

  const {
    transactions,
    isLoading: loadingTxns,
    fetchTransactions,
  } = useTransactionsStore();

  const [closeModalOpen, setCloseModalOpen] = useState(false);

  useEffect(() => {
    if (activeShift) {
      // Fetch transactions for the active shift
      fetchTransactions({ size: 5, shift_id: activeShift.id });
    }
  }, [activeShift, fetchTransactions]);

  if (!activeShift) {
    return null;
  }

  const openedDate = new Date(activeShift.opened_at);
  const timeString = openedDate.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = openedDate.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
      {/* Header Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            Estado del Turno
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {dateString.charAt(0).toUpperCase() + dateString.slice(1)} · Sucursal Principal {activeShift.branch_code}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => setCloseModalOpen(true)}
        >
          Cerrar Turno
        </Button>
      </Box>

      {/* Turno Alert Status */}
      <Alert severity="success" sx={{ mb: 4, fontWeight: 500 }}>
        Turno abierto desde las <strong>{timeString}</strong>. Todas las
        transacciones quedan asociadas a la caja{" "}
        <strong>{activeShift.id.slice(0, 8).toUpperCase()}</strong>.
      </Alert>

      {/* Section 1: KPI Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              Transacciones
            </Typography>            <Typography variant="h2" sx={{ my: 1, fontWeight: 700 }}>
              {transactions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Registradas en este turno
            </Typography>
          </Card>
        </Grid>
 
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              Volumen COP
            </Typography>
            <Typography variant="h2" sx={{ my: 1, fontWeight: 700 }}>
              $
              {transactions
                .reduce((sum, t) => sum + Number(t.cop_amount), 0)
                .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total movilizado (Compra + Venta)
            </Typography>
          </Card>
        </Grid>
 
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              Rentabilidad COP
            </Typography>
            <Typography
              variant="h2"
              sx={{ my: 1, fontWeight: 700, color: "success.main" }}
            >
              $
              {activeShift.currencies
                .reduce((sum, c) => sum + Number(c.profit_cop), 0)
                .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Margen de intermediación obtenido
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              Caja Inicial COP
            </Typography>
            <Typography variant="h2" sx={{ my: 1, fontWeight: 700 }}>
              ${Number(activeShift.opening_cash_cop).toLocaleString("es-CO")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Efectivo reportado en apertura
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left: Current Funds & Rates Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <Typography variant="h3" sx={{ mb: 3 }}>
              Saldos y Rentabilidad por Divisa
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {activeShift.currencies.map((c) => (
                <Box
                  key={c.iso_code}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
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
                      {c.iso_code} — Compra: ${Number(c.approved_buy_rate).toLocaleString("es-CO")} / Venta: ${Number(c.approved_sell_rate).toLocaleString("es-CO")}
                    </Typography>
                    <Chip
                      label={c.rate_status === "overridden" ? "Ajustada" : "Estándar"}
                      color={c.rate_status === "overridden" ? "warning" : "default"}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Comprado
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {c.iso_code} {Number(c.units_purchased).toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Vendido
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {c.iso_code} {Number(c.units_sold).toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Utilidad COP
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: Number(c.profit_cop) >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        ${Number(c.profit_cop).toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Last Transactions Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h3">Últimas Transacciones del Turno</Typography>
            </Box>

            {loadingTxns ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={24} />
              </Box>
            ) : transactions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No se han registrado transacciones en este turno.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ flexGrow: 1, maxHeight: 400 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Monto Divisa</TableCell>
                      <TableCell align="right">Total COP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.slice(0, 5).map((tx) => {
                      const date = tx.created_at ? new Date(tx.created_at) : new Date();
                      const formattedTime = date.toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>{formattedTime}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.transaction_type === "buy" ? "Compra" : "Venta"}
                              color={tx.transaction_type === "buy" ? "success" : "info"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {tx.iso_code} {Number(tx.foreign_amount).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ${Number(tx.cop_amount).toLocaleString("es-CO")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CloseShiftModal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} />
    </Box>
  );
}
