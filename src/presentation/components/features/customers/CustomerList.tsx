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
  TablePagination,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { CustomerModal } from "@/presentation/components/features/customers/CustomerModal";
import { Customer } from "@/domain/Customer";
import { useCustomersStore } from "@/presentation/stores/customers.store";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useNotificationStore } from "@/presentation/stores/notification.store";

export function CustomerList() {
  const { customers, total, page, size, fetchError, fetchCustomers } =
    useCustomersStore();
  const { showNotification } = useNotificationStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Real-time search with debounce
  useEffect(() => {
    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        await fetchCustomers({ name: searchQuery, page: 1, size: size });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Error al buscar clientes";
        showNotification(errMsg, "error", "Error de Búsqueda");
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery, fetchCustomers, size, showNotification]);

  const handleChangePage = async (_: unknown, newPage: number) => {
    setIsLoading(true);
    try {
      await fetchCustomers({
        name: searchQuery,
        page: newPage + 1,
        size: size,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newSize = parseInt(event.target.value, 10);
    setIsLoading(true);
    try {
      await fetchCustomers({ name: searchQuery, page: 1, size: newSize });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCustomerToEdit(undefined);
    setModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    setModalOpen(false);
    setIsLoading(true);
    try {
      await fetchCustomers({ name: searchQuery, page: page, size: size });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Error al recargar clientes";
      showNotification(errMsg, "error", "Error de Recarga");
    } finally {
      setIsLoading(false);
    }
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
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "text.primary" }}>
          Clientes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Buscar, crear y administrar clientes de la casa de cambio.
        </Typography>
      </Box>

      {fetchError && (
        <Alert severity="error" sx={{ border: "1px solid", borderColor: "error.main" }}>
          {fetchError}
        </Alert>
      )}

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
            placeholder="Nombre o CC"
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
            onClick={handleOpenCreateModal}
            sx={{ px: 4, minWidth: "120px" }}
          >
            Nuevo
          </Button>
        </Box>

        <TableContainer sx={{ position: "relative" }}>
          {isLoading && (
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
                opacity: 0.7,
                zIndex: 1,
              }}
            >
              <Typography variant="body2">Buscando...</Typography>
            </Box>
          )}
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.paper" }}>
                <TableCell sx={{ typography: "subtitle2" }}>
                  Nombre / Razón Social
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Email</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>
                  Documento
                </TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Teléfono</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Estado</TableCell>
                <TableCell sx={{ typography: "subtitle2" }} align="center">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {customers.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron clientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id || customer.document_number}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {customer.person_type === "juridical" ? (
                            <BusinessIcon fontSize="small" />
                          ) : (
                            <PersonIcon fontSize="small" />
                          )}
                        </Avatar>
                        {customer.first_name} {customer.first_surname || ""}
                      </Box>
                    </TableCell>

                    <TableCell>{customer.email || "N/A"}</TableCell>
                    <TableCell>
                      {customer.document_type} {customer.document_number}
                    </TableCell>
                    <TableCell>{customer.phone || "N/A"}</TableCell>

                    <TableCell>
                      <Chip
                        label={customer.status}
                        color={getStatusColor(customer.status)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Editar Cliente">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(customer)}
                        >
                          <EditIcon fontSize="small" />
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
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={size}
          page={page - 1} // MUI uses 0-indexed pages
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Clientes por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />
    </Box>
  );
}
