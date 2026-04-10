"use client";

import React, { useState, useEffect, useContext } from "react";
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
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { User } from "../../domain/User";
import { Transaction } from "../../domain/Transaction";
import { ExecuteTransaction } from "../../use-cases/ExecuteTransaction";
import { transactionRepository } from "../../infrastructure/MockTransactionRepository";
import { API_BASE_URL } from "@/utils/urls";
import { UsersContext } from "@/context/UsersContext";

export default function CurrencyExchangeForm() {
  const usersContext = useContext(UsersContext);

  if (!usersContext) {
    throw new Error("UsersContext debe usarse dentro de UsersProvider");
  }

  const { users, setUsers } = usersContext;

  const [loadingRate, setLoadingRate] = useState(false);

  const [ccInput, setCcInput] = useState("");
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const [amountUSD, setAmountUSD] = useState<string>("");
  const [fromCurrency] = useState("USD");
  const [toCurrency] = useState("COP");
  const [observations, setObservations] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({ title: "", body: "" });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const [exchangeRate, setExchangeRate] = useState<number>(0.0);

  const [calculatedCOP, setCalculatedCOP] = useState<number>(0);
  const [loadingConversion, setLoadingConversion] = useState(false);

  const [clintonListValidation, setClintonListValidation] = useState<boolean | null>(null);

  const updateUserClintonStatus = (cc: string, newStatus: boolean) => {
    setUsers((prevUsers): User[] => {
      const updatedUsers = prevUsers.map((user): User => {
        if (user.cc === cc) {
          return {
            ...user,
            isClintonListed: newStatus,
            status: (newStatus ? "Reportado" : "Activo") as User["status"],
          };
        }
        return user;
      });

      localStorage.setItem("users", JSON.stringify(updatedUsers));

      return updatedUsers;
    });
  };

  const fetchConversion = async (usd: number) => {
    try {
      setLoadingConversion(true);

      const res = await fetch(`${API_BASE_URL}/api/v1/currency/trm/usd/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: usd,
          to_currency: "COP",
        }),
      });

      const data = await res.json();
      setCalculatedCOP(data.to_amount);
    } catch (error) {
      console.error("Error converting currency", error);
    } finally {
      setLoadingConversion(false);
    }
  };

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setLoadingRate(true);

        const res = await fetch(`${API_BASE_URL}/api/v1/currency/trm/usd`);
        const data = await res.json();

        setExchangeRate(data.rate);
      } catch (error) {
        console.error("Error fetching exchange rate", error);
      } finally {
        setLoadingRate(false);
      }
    };

    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (!amountUSD || isNaN(Number(amountUSD))) {
      setCalculatedCOP(0);
      return;
    }

    const timeout = setTimeout(() => {
      fetchConversion(Number(amountUSD));
    }, 400);

    return () => clearTimeout(timeout);
  }, [amountUSD]);

  useEffect(() => {
    if (!foundUser) return;

    const updatedUser = users.find((u) => u.cc === foundUser.cc);
    if (updatedUser) {
      setFoundUser(updatedUser);
    }
  }, [users]);

  const getClintonStatus = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clinton-list/persons/by-name?name=${name}`);
      const data = await response.json()

      return data.matchCount > 0;
    } catch (error) {
      console.error("Error consultando Clinton list:", error);
      return false;
    }
  };

  const handleCheckClient = async () => {
    setLookupAttempted(true);

    const user = users.find((u) => u.cc === ccInput.trim());
    setFoundUser(user ?? null);

    if (user?.name) {
      const isListed = await getClintonStatus(user.name);

      setClintonListValidation(isListed);
      updateUserClintonStatus(user.cc!, isListed);
    }

    if (!user) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Cliente no encontrado",
        body: `No se encontró ningún cliente con CC ${ccInput}.`,
      });
      setSnackbarOpen(true);
    }
  };

  const handleMakeTransaction = async () => {
    if (!foundUser) {
      setSnackbarSeverity("error");
      setSnackbarMessage({ title: "Sin cliente", body: "Por favor busque y seleccione un cliente primero." });
      setSnackbarOpen(true);
      return;
    }

    if (foundUser.status === "Reportado") {
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
      const txn = await executeTransaction.execute(foundUser.id, Number(amountUSD), exchangeRate);

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
    setCalculatedCOP(0);
    setClintonListValidation(null);
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h1" sx={{ color: "text.primary" }}>
        Inicio
      </Typography>

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

            <Button variant="contained" size="large" fullWidth onClick={handleCheckClient}>
              Verificar
            </Button>
          </Box>

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

                {foundUser.status === "Reportado" ? (
                  <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main" }} />
                ) : (
                  <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "success.main" }} />
                )}

                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  {foundUser.status === "Reportado"
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
              placeholder="$1.00"
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              inputProps={{ style: { textAlign: "center", fontSize: "2rem" } }}
            />
          </Box>

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
              value={
                loadingConversion
                  ? "Convirtiendo..."
                  : calculatedCOP > 0
                  ? `$${calculatedCOP.toLocaleString("es-CO")}.00`
                  : ""
              }
              placeholder={
                loadingRate
                  ? "Cargando tasa..."
                  : exchangeRate
                  ? exchangeRate.toLocaleString("es-CO")
                  : "N/A"
              }
              inputProps={{ style: { textAlign: "center", fontSize: "2rem" } }}
              slotProps={{
                input: {
                  endAdornment: loadingConversion ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle1" sx={{ color: "text.primary", letterSpacing: "0.1em" }}>
            INFORMACIÓN DE RATIO APLICADO
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            USD/COP: {loadingRate ? "Cargando..." : exchangeRate ? exchangeRate.toLocaleString("es-CO") : "N/A"} | Tasa oficial
          </Typography>
        </Box>
      </Paper>

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

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleMakeTransaction}
              disabled={!foundUser || foundUser?.status === "Reportado" || !amountUSD || calculatedCOP <= 0 || loadingConversion}
            >
              {loadingConversion ? "Calculando conversión..." : "Realizar transacción"}
            </Button>

            <Button
              variant="contained"
              size="large"
              fullWidth
              color="inherit"
              onClick={handleCancel}
              disabled={loadingConversion}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          NombreEmpresa @ 2025. Todos los derechos reservados.
        </Typography>
      </Box>

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