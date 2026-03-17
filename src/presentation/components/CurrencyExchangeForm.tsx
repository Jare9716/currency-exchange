"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { User } from "../../domain/User";
import { Transaction } from "../../domain/Transaction";
import { ExecuteTransaction } from "../../use-cases/ExecuteTransaction";
import { transactionRepository } from "../../infrastructure/MockTransactionRepository";

const mockedUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "Jane@Doe.com",
    cc: "44509984",
    phone: "3167897678",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "2",
    name: "John Smith",
    email: "John@Smith.com",
    cc: "44509985",
    phone: "3167897679",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "3",
    name: "Emily Johnson",
    email: "Emily@Johnson.com",
    cc: "44509986",
    phone: "3167897680",
    status: "Bloqueado",
    isClintonListed: true,
  },
];

const EXCHANGE_RATE = 4000; // 1 USD = 4,000 COP

export default function CurrencyExchangeForm() {
  // — Customer lookup state
  const [ccInput, setCcInput] = useState("");
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // — Transaction form state
  const [amountUSD, setAmountUSD] = useState<string>("");
  const [fromCurrency] = useState("USD");
  const [toCurrency] = useState("COP");
  const [observations, setObservations] = useState("");

  // — Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({ title: "", body: "" });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // — Last transaction (mock)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const handleCheckClient = () => {
    setLookupAttempted(true);
    const user = mockedUsers.find((u) => u.cc === ccInput.trim());
    setFoundUser(user ?? null);
    if (!user) {
      setSnackbarSeverity("error");
      setSnackbarMessage({ title: "Cliente no encontrado", body: `No se encontró ningún cliente con CC ${ccInput}.` });
      setSnackbarOpen(true);
    }
  };

  const calculatedCOP =
    amountUSD && !isNaN(Number(amountUSD)) ? Number(amountUSD) * EXCHANGE_RATE : 0;

  const handleMakeTransaction = async () => {
    if (!foundUser) {
      setSnackbarSeverity("error");
      setSnackbarMessage({ title: "Sin cliente", body: "Por favor busque y seleccione un cliente primero." });
      setSnackbarOpen(true);
      return;
    }
    if (foundUser.status === "Bloqueado") {
      setSnackbarSeverity("error");
      setSnackbarMessage({ title: "Transacción rechazada", body: "El cliente está bloqueado por la Lista Clinton." });
      setSnackbarOpen(true);
      return;
    }
    if (!amountUSD || Number(amountUSD) <= 0) {
      setSnackbarSeverity("error");
      setSnackbarMessage({ title: "Monto inválido", body: "Ingrese un monto en USD mayor a 0." });
      setSnackbarOpen(true);
      return;
    }

    try {
      const executeTransaction = new ExecuteTransaction(transactionRepository);
      const txn = await executeTransaction.execute(foundUser.id, Number(amountUSD), EXCHANGE_RATE);
      setLastTransaction(txn);
      setAmountUSD("");
      setObservations("");
      setSnackbarSeverity("success");
      setSnackbarMessage({
        title: "Transacción exitosa",
        body: `Se convirtieron $${txn.amountUSD.toLocaleString("es-CO")} USD → $${txn.amountCOP.toLocaleString("es-CO")} COP.`,
      });
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Error en transacción",
        body: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => {
    setAmountUSD("");
    setObservations("");
    setFoundUser(null);
    setCcInput("");
    setLookupAttempted(false);
    setLastTransaction(null);
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Typography variant="h1" sx={{ color: "text.primary" }}>
        Inicio
      </Typography>

      {/* ── Card 1: Customer ── */}
      <Paper
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 0,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Left: Customer ID search */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              ID de cliente (CC)
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ej. 44509984"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckClient()}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleCheckClient}
            >
              Verificar
            </Button>
          </Box>

          {/* Right: Client state */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minHeight: 140,
            }}
          >
            {!lookupAttempted && (
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Ingrese un CC para buscar el cliente.
              </Typography>
            )}
            {lookupAttempted && foundUser && (
              <>
                <Typography variant="h2" sx={{ color: "text.primary" }}>
                  {foundUser.name}
                </Typography>
                {foundUser.status === "Bloqueado" ? (
                  <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main" }} />
                ) : (
                  <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "success.main" }} />
                )}
                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  {foundUser.status === "Bloqueado"
                    ? "Cliente bloqueado – Lista Clinton"
                    : lastTransaction
                    ? `Última transacción: $${lastTransaction.amountUSD.toLocaleString("es-CO")} USD`
                    : "Sin transacciones previas"}
                </Typography>
              </>
            )}
            {lookupAttempted && !foundUser && (
              <Typography variant="body1" sx={{ color: "error.main" }}>
                Cliente no encontrado.
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── Card 2: Transaction ── */}
      <Paper
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 0,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* From: USD */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Desde</InputLabel>
              <Select value={fromCurrency} label="Desde">
                <MenuItem value="USD">USD</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              variant="outlined"
              type="number"
              placeholder="$1,000.00"
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              inputProps={{ style: { textAlign: "center", fontSize: "2rem" } }}
            />
          </Box>

          {/* To: COP */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Hacia</InputLabel>
              <Select value={toCurrency} label="Hacia" disabled>
                <MenuItem value="COP">COP</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              variant="outlined"
              disabled
              value={calculatedCOP > 0 ? `$${calculatedCOP.toLocaleString("es-CO")}.00` : ""}
              placeholder="$4,000,000.00"
              inputProps={{ style: { textAlign: "center", fontSize: "2rem" } }}
            />
          </Box>
        </Box>

        {/* Ratio info */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle1" sx={{ color: "text.primary", letterSpacing: "0.1em" }}>
            INFORMACIÓN DE RATIO APLICADO
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            USD/COP: {EXCHANGE_RATE.toLocaleString("es-CO")}.00 | Tasa oficial
          </Typography>
        </Box>
      </Paper>

      {/* ── Card 3: Execution ── */}
      <Paper
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 0,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Observations */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              Observaciones
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Notas"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </Box>

          {/* Buttons */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleMakeTransaction}
              disabled={!foundUser || !amountUSD || calculatedCOP <= 0}
            >
              Realizar transacción
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              color="inherit"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Footer */}
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          NombreEmpresa @ 2025. Todos los derechos reservados.
        </Typography>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%", alignItems: "flex-start" }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1">{snackbarMessage.title}</Typography>
            <Typography variant="body2">{snackbarMessage.body}</Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}
