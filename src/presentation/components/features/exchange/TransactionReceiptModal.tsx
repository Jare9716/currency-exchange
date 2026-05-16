import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { Transaction } from "@/domain/Transaction";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface TransactionReceiptModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customerName: string;
}

export function TransactionReceiptModal({
  open,
  onClose,
  transaction,
  customerName,
}: TransactionReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 1 }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Transacción Exitosa
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 5, py: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Ticket #{transaction.ticket_number || "N/A"}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {transaction.created_at
              ? new Date(transaction.created_at).toLocaleString()
              : new Date().toLocaleString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, borderStyle: "dashed" }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body1" color="text.secondary">
              Cliente:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {customerName}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body1" color="text.secondary">
              Operación:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {transaction.transaction_type === "buy" ? "Compra" : "Venta"} de{" "}
              {transaction.iso_code}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body1" color="text.secondary">
              Tasa Aplicada:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              $ {Number(transaction.exchange_rate).toLocaleString("es-CO")}
            </Typography>
          </Box>

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" color="text.secondary">
              Recibimos ({transaction.iso_code}):
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              $ {Number(transaction.foreign_amount).toLocaleString("es-CO")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" color="text.secondary">
              Entregamos (COP):
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              $ {Number(transaction.cop_amount).toLocaleString("es-CO")}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 5, pb: 4, justifyContent: "center", gap: 2 }}>
        <Button variant="outlined" size="large" onClick={onClose} sx={{ flex: 1 }}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<LocalPrintshopIcon />}
          onClick={handlePrint}
          sx={{ flex: 1 }}
        >
          Imprimir Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
}
