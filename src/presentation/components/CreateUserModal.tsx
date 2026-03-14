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

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (user: {
    name: string;
    email: string;
    cc: string;
    phone: string;
  }) => void;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    onCreate(formData);
    setFormData({ name: "", email: "", cc: "", phone: "" }); // Reset
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
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Correo"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          placeholder="Doe.Jhon@kmail.com"
          InputLabelProps={{ shrink: true }}
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
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Telefono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="3409388333"
            InputLabelProps={{ shrink: true }}
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
