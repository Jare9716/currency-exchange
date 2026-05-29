"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Grid,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
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
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { ValidateClintonList } from "@/use-cases/ValidateClintonList";
import { clintonListService } from "@/infrastructure/HttpClintonListService";
import { useNotificationStore } from "@/presentation/stores/notification.store";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { getOperatorDetails } from "@/utils/jwt";
import { TransactionReceiptModal } from "./TransactionReceiptModal";

const validateClintonList = new ValidateClintonList(clintonListService);
const executeTransaction = new ExecuteTransaction(transactionRepository);

export function CurrencyExchangeForm() {
  const router = useRouter();
  const { showNotification } = useNotificationStore();
  const { activeShift, fetchActiveShift } = useShiftStore();

  const [documentInput, setDocumentInput] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | undefined>(
    undefined,
  );
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const [amountUSD, setAmountUSD] = useState<string>("");
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency] = useState("COP");
  const [observations, setObservations] = useState("");

  const [lastTransaction, setLastTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Fetch active shift on mount
  useEffect(() => {
    if (!activeShift) {
      const operator = getOperatorDetails();
      fetchActiveShift(operator.branch);
    }
  }, [activeShift, fetchActiveShift]);

  // Determine current active currency code
  const currentCurrency = fromCurrency || activeShift?.currencies?.[0]?.iso_code || "USD";

  // Dynamically get exchange rate and calculate COP amount
  const activeCurrencyConfig = activeShift?.currencies.find(
    (c) => c.iso_code === currentCurrency
  );

  const exchangeRate = activeCurrencyConfig
    ? Number(
        transactionType === "buy"
          ? activeCurrencyConfig.approved_buy_rate
          : activeCurrencyConfig.approved_sell_rate
      )
    : 0;

  const calculatedCOP =
    amountUSD && !isNaN(Number(amountUSD))
      ? Number(amountUSD) * exchangeRate
      : 0;

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
    try {
      const customer = await customerRepository.findByDocument(documentInput.trim());

      if (!customer) {
        setFoundCustomer(undefined);
        showNotification(
          `No se encontró ningún cliente con documento ${documentInput}.`,
          "error",
          "Cliente no encontrado",
        );
        return;
      }

      // Check Clinton List
      const fullName =
        `${customer.first_name} ${customer.first_surname || ""}`.trim();
      const isListed = await validateClintonList.execute(
        fullName,
        customer.document_number,
      );

      const updatedCustomer: Customer = {
        ...customer,
        isClintonListed: isListed,
        status: isListed ? "Reportado" : "Activo",
      };

      setFoundCustomer(updatedCustomer);
    } catch {
      showNotification("Error al verificar el cliente", "error", "Error");
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
      const branchCode = useAuthStore.getState().activeBranchCode || "001";
      const txn = await executeTransaction.execute(
        foundCustomer.id || foundCustomer.document_number,
        Number(amountUSD),
        currentCurrency,
        transactionType,
        branchCode,
        observations,
      );

      setLastTransaction(txn);
      handleCancel(); // Clear form
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
    setAmountError(undefined);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "text.primary" }}>
          Nueva Transacción
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Compra o venta de divisas con validación KYC previa.
        </Typography>
      </Box>

      {!activeShift && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="warning"
              size="small"
              onClick={() => router.push("/dashboard/shift")}
            >
              Abrir Turno
            </Button>
          }
        >
          <strong>Atención:</strong> No hay un turno de caja abierto para esta sucursal. Debes abrir un turno antes de realizar transacciones.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Section 1: Customer */}
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

            {/* Section 2: Amounts */}
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
                <Grid size={{ xs: 12 }}>
                  <ToggleButtonGroup
                    value={transactionType}
                    exclusive
                    onChange={(_, value) => value && setTransactionType(value)}
                    fullWidth
                    color="primary"
                  >
                    <ToggleButton value="buy">
                      Compra
                    </ToggleButton>
                    <ToggleButton value="sell">
                      Venta
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {activeShift && activeShift.currencies.length > 0 && activeShift.currencies.length < 4 ? (
                    <ToggleButtonGroup
                      value={currentCurrency}
                      exclusive
                      onChange={(_, value) => value && setFromCurrency(value)}
                      fullWidth
                      color="primary"
                    >
                      {activeShift.currencies.map((c) => (
                        <ToggleButton key={c.iso_code} value={c.iso_code}>
                          {c.iso_code}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  ) : (
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>Moneda Extranjera</InputLabel>
                      <Select
                        value={currentCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        label="Moneda Extranjera"
                        notched
                      >
                        {activeShift?.currencies.map((c) => (
                          <MenuItem key={c.iso_code} value={c.iso_code}>
                            {c.iso_code}
                          </MenuItem>
                        )) || <MenuItem value="USD">USD</MenuItem>}
                      </Select>
                    </FormControl>
                  )}
                  <TextField
                    sx={{ mt: 2 }}
                    type="number"
                    label={`Monto ${currentCurrency || ""}`}
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
                    label={transactionType === "buy" ? "Total COP a entregar" : "Total COP a recibir"}
                    value={
                      calculatedCOP > 0
                        ? calculatedCOP.toLocaleString("es-CO")
                        : ""
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: Observations */}
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

        {/* Right Side: Summary and Actions */}
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
                {`$${exchangeRate.toLocaleString("es-CO")}`}
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
              <Typography variant="subtitle1">
                {transactionType === "buy" ? "Total a entregar" : "Total a recibir"}
              </Typography>
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
                  !activeShift ||
                  !foundCustomer ||
                  foundCustomer.status === "Reportado" ||
                  !amountUSD ||
                  calculatedCOP <= 0
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
        transaction={lastTransaction}
        customerName={
          foundCustomer
            ? `${foundCustomer.first_name} ${foundCustomer.first_surname || ""}`.trim()
            : ""
        }
      />
    </Box>
  );
}
