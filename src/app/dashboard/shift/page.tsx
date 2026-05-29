"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { useShiftStore } from "@/presentation/stores/shift.store";
import { getOperatorDetails } from "@/utils/jwt";
import { OpenShiftModal } from "@/presentation/components/features/shift/OpenShiftModal";
import { ShiftDashboard } from "@/presentation/components/features/shift/ShiftDashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function ShiftPage() {
  const { activeShift, isLoading, fetchActiveShift } = useShiftStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [operator] = useState(() => getOperatorDetails());

  useEffect(() => {
    fetchActiveShift(operator.branch);
  }, [operator.branch, fetchActiveShift]);

  if (isLoading && !activeShift) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (activeShift) {
    return <ShiftDashboard />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 5,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: "primary.light",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography variant="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
          No hay un turno abierto
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Debes registrar el saldo inicial en COP y las tasas sugeridas de hoy antes de poder iniciar operaciones y registrar transacciones de divisas.
        </Typography>

        <Button
          variant="contained"
          color="success"
          size="medium"
          onClick={() => setModalOpen(true)}
        >
          Abrir Turno
        </Button>

        <OpenShiftModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </Paper>
    </Box>
  );
}
