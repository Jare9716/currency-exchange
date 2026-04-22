"use client";

import React, { useContext, useState } from "react";
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
import CreateUserModal from "@/presentation/components/CreateUserModal";
import { User } from "@/domain/User";
import { UsersContext } from "@/context/UsersContext";

export default function UserList() {
  const usersContext = useContext(UsersContext);

  if (!usersContext) {
    throw new Error("UsersContext debe usarse dentro de UsersProvider");
  }

  const { users, setUsers } = usersContext;

  const [modalOpen, setModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    body: "",
  });
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleCreateUser = (newUser: User) => {
    setModalOpen(false);

    if (newUser.isClintonListed) {
      setSnackbarSeverity("error");
      setSnackbarMessage({
        title: "Usuario reportado",
        body: "El cliente fue marcado por validación tipo Lista Clinton.",
      });
    } else {
      setSnackbarSeverity("success");
      setSnackbarMessage({
        title: "Cliente creado",
        body: "El cliente ha sido creado exitosamente",
      });
    }

    setSnackbarOpen(true);

    setUsers((prevUsers) => [newUser, ...prevUsers]);
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
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
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
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nombre o CC"
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
            Nuevo cliente
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "background.paper" }}>
                <TableCell sx={{ typography: "subtitle2" }}>Nombre</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Email</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>CC</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Telefono</TableCell>
                <TableCell sx={{ typography: "subtitle2" }}>Estado</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon fontSize="small" />
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
        <Alert severity={snackbarSeverity} variant="filled">
          <Typography variant="subtitle1">{snackbarMessage.title}</Typography>
          <Typography variant="body2">{snackbarMessage.body}</Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}