"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SearchIcon from "@mui/icons-material/Search";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useTransactionsStore } from "@/presentation/stores/transactions.store";
import { useNotificationStore } from "@/presentation/stores/notification.store";
import { TransactionReceiptModal } from "@/presentation/components/features/exchange/TransactionReceiptModal";
import { Transaction } from "@/domain/Transaction";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";

export function TransactionHistory() {
  const { showNotification } = useNotificationStore();
  const { transactions, total, page, size, isLoading, fetchError, fetchTransactions } =
    useTransactionsStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | undefined>(undefined);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocalLoading(true);
    fetchTransactions({ page: 1, size })
      .finally(() => setLocalLoading(false));
  }, [fetchTransactions, size]);

  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await fetchTransactions({
        page: 1,
        size: size,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleChangePage = async (_: unknown, newPage: number) => {
    await fetchTransactions({
      page: newPage + 1,
      size: size,
    });
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newSize = parseInt(event.target.value, 10);
    await fetchTransactions({
      page: 1,
      size: newSize,
    });
  };

  const handleViewTicket = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptModalOpen(true);
    setSelectedCustomerName("Cargando...");
    try {
      const customer = await customerRepository.findById(transaction.customer_id);
      setSelectedCustomerName(
        customer
          ? `${customer.first_name} ${customer.first_surname || ""}`.trim()
          : `ID: ${transaction.customer_id.substring(0, 8)}...`
      );
    } catch {
      showNotification(
        "No se pudo cargar el nombre del cliente para el recibo. Mostrando ID en su lugar.",
        "warning",
        "Información incompleta"
      );
      setSelectedCustomerName(`ID: ${transaction.customer_id.substring(0, 8)}...`);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleString();
  };

  return (
    <Box
      sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}
    >
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "text.primary" }}>
          Historial de Transacciones
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Consulta de operaciones y emisión de recibos del turno actual.
        </Typography>
      </Box>

      <Paper
        sx={{
          width: "100%",
          flexGrow: 1,
          minHeight: 0, // Allow card to shrink
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <TextField
            placeholder="Buscar por cliente, documento o recibo..."
            variant="outlined"
            label="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            sx={{ flex: 1 }}
          />

          <Button
            variant="contained"
            fullWidth={false}
            onClick={handleRefresh}
            disabled={isLoading || localLoading}
            sx={{ minWidth: "120px" }}
            size="small"
            startIcon={<RefreshIcon />}
          >
            Actualizar
          </Button>
        </Box>

        <TableContainer sx={{ position: "relative", flexGrow: 1, overflowY: "auto", overflowX: "auto" }}>
          {fetchError && (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "error.lighter",
                color: "error.main",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2">{fetchError}</Typography>
            </Box>
          )}

          {(isLoading || localLoading) && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                opacity: 0.6,
                zIndex: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Cargando transacciones...
              </Typography>
            </Box>
          )}

          <Table sx={{ minWidth: 650 }} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  Fecha / Hora
                </TableCell>
                <TableCell>Ticket</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Divisa</TableCell>
                <TableCell align="right">
                  Monto Extranjero
                </TableCell>
                <TableCell align="right">
                  Tasa
                </TableCell>
                <TableCell align="right">
                  Total COP
                </TableCell>
                <TableCell align="center">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {transactions.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay transacciones registradas todavía.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{formatDate(tx.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        #{tx.ticket_number || tx.id.substring(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          tx.transaction_type === "buy" ? "Compra" : "Venta"
                        }
                        color={
                          tx.transaction_type === "buy" ? "success" : "info"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{tx.iso_code}</TableCell>
                    <TableCell align="right">
                      {parseFloat(tx.foreign_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {parseFloat(tx.exchange_rate).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      $ {parseFloat(tx.cop_amount).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Ticket">
                        <IconButton
                          size="small"
                          onClick={() => handleViewTicket(tx)}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={size}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          sx={{ flexShrink: 0 }}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      <TransactionReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={selectedTransaction}
        customerName={selectedCustomerName}
      />
    </Box>
  );
}
