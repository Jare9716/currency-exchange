"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { User } from "../../domain/User";
import { API_BASE_URL } from "@/utils/urls";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (user: User) => void;
}

export default function CreateUserModal({
  open,
  onClose,
  onCreate,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cc: "",
    phone: "",
  });

  const getClintonStatus = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clinton-list/persons/by-name?name=${name}`);
      const data = await response.json();
      console.log(data)

      return data.matchCount > 0;
    } catch (error) {
      console.error("Error consultando Clinton list:", error);
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!formData.cc) {
      console.warn("CC requerida");
      return;
    }

    const isListed = await getClintonStatus(formData.name);

    console.log("isClintonListed:", isListed);

    const newUser: User = {
      id: crypto.randomUUID(),
      ...formData,
      isClintonListed: isListed,
      status: isListed ? "Reportado" : "Activo",
    };

    onCreate(newUser);

    // reset
    setFormData({
      name: "",
      email: "",
      cc: "",
      phone: "",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { p: 0 } }}
    >
      <DialogTitle
        sx={{ typography: "h2", color: "text.primary", px: 3, pt: 3, pb: 2 }}
      >
        Nuevo cliente
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}
      >
        <TextField
          label="Nombre"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          placeholder="Jhon Doe"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Correo"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          placeholder="Doe.Jhon@kmail.com"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box sx={{ display: "flex", gap: 3 }}>
          <TextField
            label="CC"
            name="cc"
            value={formData.cc}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="0202020202"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Telefono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="3409388333"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleCreate}>Crear usuario</Button>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}