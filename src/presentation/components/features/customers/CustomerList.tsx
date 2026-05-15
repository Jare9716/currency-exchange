"use client";

import { useState, useEffect } from "react";
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
  Avatar,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { CreateCustomerModal } from "@/presentation/components/features/customers/CreateCustomerModal";
import { Customer } from "@/domain/Customer";
import { useCustomersStore } from "@/presentation/stores/customers.store";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";

export function CustomerList() {
  const { customers, setCustomers, fetchCustomers } = useCustomersStore();

  useEffect(() => {
    fetchCustomers().catch(console.error);
  }, [fetchCustomers]);

  const [modalOpen, setModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    body: "",
  });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  const handleCreateCustomer = (newCustomer: Customer) => {
    setModalOpen(false);

    if (newCustomer.isClintonListed) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Customer reportado",
        body: "El customer fue marcado por validación tipo Lista Clinton.",
      });
    } else {
      setSnackbarSeverity("success");
      setSnackbarMessage({
        title: "Customer creado",
        body: "El customer ha sido creado exitosamente",
      });
    }

    setSnackbarOpen(true);
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Activo":
        return "success";
      case "Bloqueado":
        return "error";
      case "Reportado":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Typography variant="h1" sx={{ color: "text.primary" }}>
        Customers
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
            p: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nombre o documento"
            variant="outlined"
            label="Buscar"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              flex: 1,
              minWidth: 220,
              maxWidth: 400,
            }}
          />

          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Nuevo Customer
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.paper" }}>
                <TableCell sx={{ typography: "subtitle2" }}>Nombre / Razón Social</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Email</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Documento</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Teléfono</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Estado</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id || customer.document_number}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {customer.person_type === "juridical" ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                      </Avatar>
                      {customer.first_name} {customer.first_surname || ""}
                    </Box>
                  </TableCell>

                  <TableCell>{customer.email || "N/A"}</TableCell>
                  <TableCell>{customer.document_type} {customer.document_number}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>

                  <TableCell>
                    <Chip
                      label={customer.status}
                      color={getStatusColor(customer.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CreateCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateCustomer}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbarSeverity} variant="filled">
          <Typography variant="subtitle1">{snackbarMessage.title}</Typography>
          <Typography variant="body2">{snackbarMessage.body}</Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}
