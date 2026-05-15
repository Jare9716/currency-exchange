"use client";

import { useState, ChangeEvent } from "react";
import { createCustomerSchema, CreateCustomerFormData } from "@/presentation/components/features/customers/customer.schema";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { Customer } from "@/domain/Customer";
import { ValidateClintonList } from "@/use-cases/ValidateClintonList";
import { CreateCustomer } from "@/use-cases/CreateCustomer";
import { clintonListService } from "@/infrastructure/HttpClintonListService";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { to } from "@/utils/async";
import { ApiError } from "@/domain/Errors";

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (customer: Customer) => void;
}

export function CreateCustomerModal({
  open,
  onClose,
  onCreate,
}: CreateCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerFormData>({
    first_name: "",
    first_surname: "",
    document_type: "CC",
    document_number: "",
    person_type: "natural",
    email: "",
    phone: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCustomerFormData, string>> & { general?: string }
  >({});

  const getClintonStatus = async (
    name: string,
    documentNumber: string,
  ): Promise<boolean> => {
    const validateClintonList = new ValidateClintonList(clintonListService);
    return await validateClintonList.execute(name, documentNumber);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    if (errors[name as keyof CreateCustomerFormData]) {
      setErrors((prev) => ({ ...prev, [name as string]: undefined }));
    }
  };

  const handleCreate = async () => {
    const validation = createCustomerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateCustomerFormData, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CreateCustomerFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const fullName = `${formData.first_name} ${formData.first_surname || ""}`.trim();
    const isListed = await getClintonStatus(fullName, formData.document_number);

    const newCustomer: Customer = {
      ...formData,
      customer_type: "customer",
      isClintonListed: isListed,
      status: isListed ? "Reportado" : "Activo",
    };

    setIsSubmitting(true);
    const createCustomer = new CreateCustomer(customerRepository);
    const [err] = await to(createCustomer.execute(newCustomer));
    setIsSubmitting(false);

    if (err) {
      if (err instanceof ApiError) {
        setErrors({ general: err.detail || "Error al crear el customer" });
      } else {
        setErrors({ general: "Error de conexión al crear customer" });
      }
      return;
    }

    onCreate(newCustomer);

    setFormData({
      first_name: "",
      first_surname: "",
      document_type: "CC",
      document_number: "",
      person_type: "natural",
      email: "",
      phone: "",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { p: 0 } } }}
    >
      <DialogTitle
        sx={{ typography: "h2", color: "text.primary", px: 3, pt: 3, pb: 2 }}
      >
        Nuevo Customer
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}
      >
        {errors.general && (
          <Box sx={{ color: "error.main", typography: "body2" }}>
            {errors.general}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 3 }}>
          <TextField
            label="Nombres / Razón Social"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Ej. Acme SAS"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
          <TextField
            label="Apellidos"
            name="first_surname"
            value={formData.first_surname}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="Opcional"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.first_surname}
            helperText={errors.first_surname}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>Tipo de Persona</InputLabel>
            <Select
              name="person_type"
              value={formData.person_type}
              onChange={handleChange}
              label="Tipo de Persona"
              notched
            >
              <MenuItem value="natural">Natural</MenuItem>
              <MenuItem value="juridical">Jurídica</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>Tipo Doc.</InputLabel>
            <Select
              name="document_type"
              value={formData.document_type}
              onChange={handleChange}
              label="Tipo Doc."
              notched
            >
              <MenuItem value="CC">Cédula (CC)</MenuItem>
              <MenuItem value="NIT">NIT</MenuItem>
              <MenuItem value="CE">Cédula Extranjería (CE)</MenuItem>
              <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Número de Documento"
            name="document_number"
            value={formData.document_number}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="0202020202"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.document_number}
            helperText={errors.document_number}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <TextField
            label="Correo"
            name="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="correo@ejemplo.com"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            placeholder="3001234567"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.phone}
            helperText={errors.phone}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Customer"}
        </Button>
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
