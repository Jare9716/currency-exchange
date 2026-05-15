"use client";

import { useState, useEffect } from "react";
import {
  searchCustomerSchema,
  exchangeSchema,
} from "@/presentation/components/features/exchange/exchange.schema";
import {
  Box,
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
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Customer } from "@/domain/Customer";
import { Transaction } from "@/domain/Transaction";
import { ExecuteTransaction } from "@/use-cases/ExecuteTransaction";
import { transactionRepository } from "@/infrastructure/MockTransactionRepository";
import { useCustomersStore } from "@/presentation/stores/customers.store";
import { GetExchangeRate } from "@/use-cases/GetExchangeRate";
import { ConvertCurrency } from "@/use-cases/ConvertCurrency";
import { ValidateClintonList } from "@/use-cases/ValidateClintonList";
import { currencyService } from "@/infrastructure/HttpCurrencyService";
import { clintonListService } from "@/infrastructure/HttpClintonListService";

export function CurrencyExchangeForm() {
  const { customers, setCustomers } = useCustomersStore();

  const [loadingRate, setLoadingRate] = useState(false);

  const [documentInput, setDocumentInput] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | undefined>(undefined);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const [amountUSD, setAmountUSD] = useState<string>("");
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [fromCurrency] = useState("USD");
  const [toCurrency] = useState("COP");
  const [observations, setObservations] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    body: "",
  });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  const [lastTransaction, setLastTransaction] = useState<
    Transaction | undefined
  >(undefined);

  const [exchangeRate, setExchangeRate] = useState<number>(0.0);

  const [calculatedCOP, setCalculatedCOP] = useState<number>(0);
  const [loadingConversion, setLoadingConversion] = useState(false);

  const updateCustomerClintonStatus = (documentNumber: string, newStatus: boolean) => {
    setCustomers((prev): Customer[] => {
      return prev.map((customer): Customer => {
        if (customer.document_number === documentNumber) {
          return {
            ...customer,
            isClintonListed: newStatus,
            status: (newStatus ? "Reportado" : "Activo") as Customer["status"],
          };
        }
        return customer;
      });
    });
  };

  const fetchConversion = async (usd: number) => {
    try {
      setLoadingConversion(true);
      const convertCurrency = new ConvertCurrency(currencyService);
      const cop = await convertCurrency.execute(usd, "USD", "COP");
      setCalculatedCOP(cop);
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
        const getExchangeRate = new GetExchangeRate(currencyService);
        const rate = await getExchangeRate.execute("USD");
        setExchangeRate(rate);
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
    if (!foundCustomer) return;

    const updatedCustomer = customers.find((c) => c.document_number === foundCustomer.document_number);
    if (updatedCustomer) {
      setFoundCustomer(updatedCustomer);
    }
  }, [customers, foundCustomer]);

  const getClintonStatus = async (
    name: string,
    documentNumber: string,
  ): Promise<boolean> => {
    const validateClintonList = new ValidateClintonList(clintonListService);
    return await validateClintonList.execute(name, documentNumber);
  };

  const handleCheckCustomer = async () => {
    const validation = searchCustomerSchema.safeParse({ documentInput });
    if (!validation.success) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Documento Inválido",
        body: validation.error.issues[0].message,
      });
      setSnackbarOpen(true);
      return;
    }

    setLookupAttempted(true);

    const customer = customers.find((c) => c.document_number === documentInput.trim());
    setFoundCustomer(customer ?? undefined);

    if (customer?.first_name && customer?.document_number) {
      const fullName = `${customer.first_name} ${customer.first_surname || ""}`.trim();
      const isListed = await getClintonStatus(fullName, customer.document_number);

      updateCustomerClintonStatus(customer.document_number, isListed);
    }

    if (!customer) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Customer no encontrado",
        body: `No se encontró ningún customer con documento ${documentInput}.`,
      });
      setSnackbarOpen(true);
    }
  };

  const handleMakeTransaction = async () => {
    if (!foundCustomer) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Sin customer",
        body: "Por favor busque y seleccione un customer primero.",
      });
      setSnackbarOpen(true);
      return;
    }

    if (foundCustomer.status === "Reportado") {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Transacción rechazada",
        body: "El customer está bloqueado por la Lista Clinton.",
      });
      setSnackbarOpen(true);
      return;
    }

    const validation = exchangeSchema.safeParse({ amountUSD });
    if (!validation.success) {
      setAmountError(validation.error.issues[0].message);
      return;
    }
    setAmountError(undefined);

    try {
      const executeTransaction = new ExecuteTransaction(transactionRepository);
      const txn = await executeTransaction.execute(
        foundCustomer.id || foundCustomer.document_number,
        Number(amountUSD),
        exchangeRate,
      );

      setLastTransaction(txn);
      setAmountUSD("");
      setObservations("");

      setSnackbarSeverity("success");
      setSnackbarMessage({
        title: "Transacción exitosa",
        body: `Se convirtieron $${Number(txn.amountUSD).toLocaleString("es-CO")} USD → $${Number(txn.amountCOP).toLocaleString("es-CO")} COP.`,
      });
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Error en transacción",
        body:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      });
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => {
    setAmountUSD("");
    setObservations("");
    setFoundCustomer(undefined);
    setDocumentInput("");
    setLookupAttempted(false);
    setLastTransaction(undefined);
    setCalculatedCOP(0);
  };

  return (
    <Box
      sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}
    >
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
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              Documento del Customer
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ej. 44509984"
              value={documentInput}
              onChange={(e) => setDocumentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckCustomer()}
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
              onClick={handleCheckCustomer}
            >
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
                Ingrese un documento para buscar.
              </Typography>
            )}

            {lookupAttempted && foundCustomer && (
              <>
                <Typography variant="h2" sx={{ color: "text.primary" }}>
                  {foundCustomer.first_name} {foundCustomer.first_surname || ""}
                </Typography>

                {foundCustomer.status === "Reportado" ? (
                  <ErrorOutlineIcon
                    sx={{ fontSize: 64, color: "error.main" }}
                  />
                ) : (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 64, color: "success.main" }}
                  />
                )}

                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  {foundCustomer.status === "Reportado"
                    ? "Customer bloqueado – Lista Clinton"
                    : lastTransaction
                      ? `Última transacción: $${Number(lastTransaction.amountUSD).toLocaleString("es-CO")} USD`
                      : "Sin transacciones previas"}
                </Typography>
              </>
            )}

            {lookupAttempted && !foundCustomer && (
              <Typography variant="body1" sx={{ color: "error.main" }}>
                Customer no encontrado.
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
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
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
              onChange={(e) => {
                setAmountUSD(e.target.value);
                if (amountError) setAmountError(undefined);
              }}
              error={!!amountError}
              helperText={amountError}
              slotProps={{
                htmlInput: { style: { textAlign: "center", fontSize: "2rem" } },
              }}
            />
          </Box>

          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
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
              slotProps={{
                htmlInput: { style: { textAlign: "center", fontSize: "2rem" } },
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

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ color: "text.primary", letterSpacing: "0.1em" }}
          >
            INFORMACIÓN DE RATIO APLICADO
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            USD/COP:{" "}
            {loadingRate
              ? "Cargando..."
              : exchangeRate
                ? exchangeRate.toLocaleString("es-CO")
                : "N/A"}{" "}
            | Tasa oficial
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
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
          >
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

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 3,
            }}
          >
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleMakeTransaction}
              disabled={
                !foundCustomer ||
                foundCustomer?.status === "Reportado" ||
                !amountUSD ||
                calculatedCOP <= 0 ||
                loadingConversion
              }
            >
              {loadingConversion
                ? "Calculando conversión..."
                : "Realizar transacción"}
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
