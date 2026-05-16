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
import { useTransactionsStore } from "@/presentation/stores/transactions.store";
import { TransactionReceiptModal } from "@/presentation/components/features/exchange/TransactionReceiptModal";
import { Transaction } from "@/domain/Transaction";
import { TextField } from "@/presentation/components/ui/TextField/TextField";

export function TransactionHistory() {
  const { transactions, total, page, size, isLoading, fetchTransactions } =
    useTransactionsStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(async () => {
      setLocalLoading(true);
      try {
        await fetchTransactions({
          ticket_number: searchQuery,
          page: 1,
          size: size,
        });
      } finally {
        setLocalLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery, fetchTransactions, size]);

  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await fetchTransactions({
        ticket_number: searchQuery,
        page: 1,
        size: size,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleChangePage = async (_: unknown, newPage: number) => {
    await fetchTransactions({
      ticket_number: searchQuery,
      page: newPage + 1,
      size: size,
    });
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newSize = parseInt(event.target.value, 10);
    await fetchTransactions({
      ticket_number: searchQuery,
      page: 1,
      size: newSize,
    });
  };

  const handleViewTicket = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptModalOpen(true);
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleString();
  };

  return (
    <Box
      sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Typography variant="h1" sx={{ color: "text.primary" }}>
        Historial de Transacciones
      </Typography>

      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 0,
          boxShadow: "none",
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
          }}
        >
          <TextField
            placeholder="Buscar por número de ticket"
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

          <Tooltip title="Actualizar">
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading || localLoading}
              sx={{
                color: "primary.main",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer sx={{ position: "relative", minHeight: 200 }}>
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

          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.paper" }}>
                <TableCell sx={{ typography: "subtitle2" }}>
                  Fecha / Hora
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Ticket</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Tipo</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Divisa</TableCell>
                <TableCell sx={{ typography: "subtitle2" }} align="right">
                  Monto Extranjero
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }} align="right">
                  Tasa
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }} align="right">
                  Total COP
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }} align="center">
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
                        variant="outlined"
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
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      <TransactionReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={selectedTransaction}
        customerName={
          selectedTransaction
            ? `ID: ${selectedTransaction.customer_id.substring(0, 8)}...`
            : ""
        }
      />
    </Box>
  );
}
