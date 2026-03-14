"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
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
import CreateUserModal from "./CreateUserModal";
import { User } from "../../domain/User";
import { clintonListService } from "../../infrastructure/MockClintonListService";
import { ValidateClintonList } from "../../use-cases/ValidateClintonList";

const initialUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "Jane@Doe.com",
    cc: "44509984",
    phone: "3167897678",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "2",
    name: "John Smith",
    email: "John@Smith.com",
    cc: "44509985",
    phone: "3167897679",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "3",
    name: "Emily Johnson",
    email: "Emily@Johnson.com",
    cc: "44509986",
    phone: "3167897680",
    status: "Bloqueado",
    isClintonListed: true,
  },
  {
    id: "4",
    name: "David Martinez",
    email: "David@Martinez.com",
    cc: "44509989",
    phone: "3167897683",
    status: "Reportado",
    isClintonListed: false,
  },
];

export default function UserList() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    body: "",
  });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  const handleCreateUser = async (formData: {
    name: string;
    email: string;
    cc: string;
    phone: string;
  }) => {
    setModalOpen(false);

    // Run Use Case for Clinton List validation
    const validateClintonList = new ValidateClintonList(clintonListService);
    const isBlocked = await validateClintonList.execute(
      formData.name,
      formData.cc,
    );

    if (isBlocked) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Usuario bloqueado",
        body: "El cliente no puede ser creado por validación en Lista Clinton.",
      });
      setSnackbarOpen(true);
      // We could still add it to the list as "Bloqueado" depending on business rules,
      // but the prompt implies "blocking users if they flag". I'll add it as blocked.
      const newUser: User = {
        id: crypto.randomUUID(),
        ...formData,
        status: "Bloqueado",
        isClintonListed: true,
      };
      setUsers([newUser, ...users]);
    } else {
      setSnackbarSeverity("success");
      setSnackbarMessage({
        title: "Cliente creado",
        body: "El cliente ha sido creado exitosamente",
      });
      setSnackbarOpen(true);

      const newUser: User = {
        id: crypto.randomUUID(),
        ...formData,
        status: "Activo",
        isClintonListed: false,
      };
      setUsers([newUser, ...users]);
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
      <Typography variant="h1" sx={{ color: "text.primary" }}>
        Clientes
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
            gap: 2,
            alignItems: "center",
            bgcolor: "background.paper",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Nombre o CC"
            variant="outlined"
            label="Buscar"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ maxWidth: 300 }}
          />
          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Nuevo
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.paper" }}>
                <TableCell
                  sx={{ typography: "subtitle2", color: "text.primary" }}
                >
                  Nombre
                </TableCell>
                <TableCell
                  sx={{ typography: "subtitle2", color: "text.primary" }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{ typography: "subtitle2", color: "text.primary" }}
                >
                  CC
                </TableCell>
                <TableCell
                  sx={{ typography: "subtitle2", color: "text.primary" }}
                >
                  Telefono
                </TableCell>
                <TableCell
                  sx={{ typography: "subtitle2", color: "text.primary" }}
                >
                  estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: "background.default",
                        }}
                      >
                        <PersonIcon
                          sx={{ color: "text.secondary", fontSize: "1rem" }}
                        />
                      </Avatar>
                      {user.name}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cc}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                      sx={{ height: 26 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateUser}
      />

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
