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
  CircularProgress,
  Grid,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Customer } from "@/domain/Customer";
import { Transaction } from "@/domain/Transaction";
import { ExecuteTransaction } from "@/use-cases/ExecuteTransaction";
import { transactionRepository } from "@/infrastructure/http/HttpTransactionRepository";
import { useCustomersStore } from "@/presentation/stores/customers.store";
import { GetExchangeRate } from "@/use-cases/GetExchangeRate";
import { ConvertCurrency } from "@/use-cases/ConvertCurrency";
import { ValidateClintonList } from "@/use-cases/ValidateClintonList";
import { currencyService } from "@/infrastructure/HttpCurrencyService";
import { clintonListService } from "@/infrastructure/HttpClintonListService";
import { useNotificationStore } from "@/presentation/stores/notification.store";
import { TransactionReceiptModal } from "./TransactionReceiptModal";

export function CurrencyExchangeForm() {
  const { customers, setCustomers } = useCustomersStore();
  const { showNotification } = useNotificationStore();

  const [loadingRate, setLoadingRate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.0);

  const [documentInput, setDocumentInput] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | undefined>(
    undefined,
  );
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const [amountUSD, setAmountUSD] = useState<string>("");
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [fromCurrency] = useState("USD");
  const [toCurrency] = useState("COP");
  const [observations, setObservations] = useState("");

  const [calculatedCOP, setCalculatedCOP] = useState<number>(0);
  const [loadingConversion, setLoadingConversion] = useState(false);

  const [lastTransaction, setLastTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Fetch initial data
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

  // Handle conversion
  useEffect(() => {
    if (!amountUSD || isNaN(Number(amountUSD))) {
      setCalculatedCOP(0);
      return;
    }

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

    const timeout = setTimeout(() => {
      fetchConversion(Number(amountUSD));
    }, 400);

    return () => clearTimeout(timeout);
  }, [amountUSD]);

  const handleCheckCustomer = async () => {
    const validation = searchCustomerSchema.safeParse({ documentInput });
    if (!validation.success) {
      showNotification(
        validation.error.issues[0].message,
        "error",
        "Documento Inválido",
      );
      return;
    }

    setLookupAttempted(true);
    const customer = customers.find(
      (c) => c.document_number === documentInput.trim(),
    );
    setFoundCustomer(customer ?? undefined);

    if (customer?.first_name && customer?.document_number) {
      const validateClintonList = new ValidateClintonList(clintonListService);
      const fullName =
        `${customer.first_name} ${customer.first_surname || ""}`.trim();
      const isListed = await validateClintonList.execute(
        fullName,
        customer.document_number,
      );

      // Update store state
      setCustomers((prev) =>
        prev.map((c) =>
          c.document_number === customer.document_number
            ? {
                ...c,
                isClintonListed: isListed,
                status: isListed ? "Reportado" : "Activo",
              }
            : c,
        ),
      );
    }

    if (!customer) {
      showNotification(
        `No se encontró ningún cliente con documento ${documentInput}.`,
        "error",
        "Cliente no encontrado",
      );
    }
  };

  const handleMakeTransaction = async () => {
    if (!foundCustomer) return;
    if (foundCustomer.status === "Reportado") {
      showNotification(
        "El cliente está bloqueado por la Lista Clinton.",
        "error",
        "Transacción rechazada",
      );
      return;
    }

    const validation = exchangeSchema.safeParse({ amountUSD });
    if (!validation.success) {
      setAmountError(validation.error.issues[0].message);
      return;
    }

    try {
      const executeTransaction = new ExecuteTransaction(transactionRepository);
      const txn = await executeTransaction.execute(
        foundCustomer.id || foundCustomer.document_number,
        Number(amountUSD),
      );

      setLastTransaction(txn);
      handleCancel(); // Clear form
      setLastTransaction(txn); // Keep txn for modal
      setReceiptModalOpen(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error en transacción";
      showNotification(errorMessage, "error", "Error");
    }
  };

  const handleCancel = () => {
    setAmountUSD("");
    setObservations("");
    setFoundCustomer(undefined);
    setDocumentInput("");
    setLookupAttempted(false);
    setCalculatedCOP(0);
    setAmountError(undefined);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h1" sx={{ mb: 4 }}>
        Nueva Transacción
      </Typography>

      <Grid container spacing={3}>
        {/* Lado Izquierdo: Formulario */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Sección 1: Cliente */}
            <Paper
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "none",
              }}
            >
              <Typography variant="h3" sx={{ mb: 2 }}>
                Información del Cliente
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Cliente"
                  placeholder="Documento del Cliente (Ej. 44509984)"
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckCustomer()}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleCheckCustomer}
                  sx={{ minWidth: 120 }}
                >
                  Verificar
                </Button>
              </Box>

              {lookupAttempted && foundCustomer && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {foundCustomer.status === "Reportado" ? (
                    <ErrorOutlineIcon color="error" />
                  ) : (
                    <CheckCircleOutlineIcon color="success" />
                  )}
                  <Box>
                    <Typography variant="subtitle2">
                      {foundCustomer.first_name}{" "}
                      {foundCustomer.first_surname || ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estado: {foundCustomer.status}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Sección 2: Montos */}
            <Paper
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "none",
              }}
            >
              <Typography variant="h3" sx={{ mb: 2 }}>
                Conversión
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Desde</InputLabel>
                    <Select value={fromCurrency} label="Desde" notched>
                      <MenuItem value="USD">Dólares (USD)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    sx={{ mt: 2 }}
                    type="number"
                    label="Monto USD"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    error={!!amountError}
                    helperText={amountError}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Hacia</InputLabel>
                    <Select value={toCurrency} label="Hacia" disabled notched>
                      <MenuItem value="COP">Pesos (COP)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    sx={{ mt: 2 }}
                    disabled
                    label="Resultado COP"
                    value={
                      loadingConversion
                        ? "Calculando..."
                        : calculatedCOP > 0
                          ? calculatedCOP.toLocaleString("es-CO")
                          : ""
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                        endAdornment: loadingConversion && (
                          <CircularProgress size={16} />
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Sección 3: Observaciones */}
            <Paper
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "none",
              }}
            >
              <Typography variant="h3" sx={{ mb: 2 }}>
                Información Adicional
              </Typography>
              <TextField
                multiline
                rows={3}
                label="Observaciones"
                placeholder="Notas de la transacción..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </Paper>
          </Box>
        </Grid>

        {/* Lado Derecho: Resumen y Acciones */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              position: "sticky",
              top: 24,
            }}
          >
            <Typography variant="h3" sx={{ mb: 3 }}>
              Resumen
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Tasa Aplicada
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {loadingRate
                  ? "..."
                  : `$${exchangeRate.toLocaleString("es-CO")}`}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                mb: 4,
              }}
            >
              <Typography variant="subtitle1">Total a entregar</Typography>
              <Typography variant="h2" color="primary.main">
                ${calculatedCOP.toLocaleString("es-CO")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                size="medium"
                onClick={handleMakeTransaction}
                disabled={
                  !foundCustomer ||
                  foundCustomer.status === "Reportado" ||
                  !amountUSD ||
                  calculatedCOP <= 0 ||
                  loadingConversion
                }
              >
                Confirmar Transacción
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="medium"
                color="inherit"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <TransactionReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={lastTransaction || null}
        customerName={
          foundCustomer
            ? `${foundCustomer.first_name} ${foundCustomer.first_surname || ""}`.trim()
            : ""
        }
      />
    </Box>
  );
}
