"use client";

import { useState, ChangeEvent, useMemo } from "react";
import {
  createCustomerSchema,
  CreateCustomerFormData,
} from "@/presentation/components/features/customers/customer.schema";
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
import { clintonListService } from "@/infrastructure/HttpClintonListService";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { ApiError } from "@/domain/Errors";
import { useNotificationStore } from "@/presentation/stores/notification.store";

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | undefined;
}

const validateClintonList = new ValidateClintonList(clintonListService);

export function CustomerModal({
  open,
  onClose,
  onSave,
  customerToEdit,
}: CustomerModalProps) {
  const { showNotification } = useNotificationStore();

  const defaultFormData: CreateCustomerFormData = useMemo(
    () => ({
      first_name: "",
      first_surname: "",
      document_type: "CC",
      document_number: "",
      person_type: "natural",
      email: "",
      phone: "",
    }),
    [],
  );

  const [formData, setFormData] =
    useState<CreateCustomerFormData>(defaultFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCustomerFormData, string>> & { general?: string }
  >({});

  const isEditMode = !!customerToEdit;

  // Pattern React 19: Adjusting state during render when props change
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevCustomerToEdit, setPrevCustomerToEdit] = useState(customerToEdit);

  if (open !== prevOpen || customerToEdit !== prevCustomerToEdit) {
    setPrevOpen(open);
    setPrevCustomerToEdit(customerToEdit);

    if (open) {
      setFormData(
        customerToEdit
          ? {
              first_name: customerToEdit.first_name || "",
              first_surname: customerToEdit.first_surname || "",
              document_type: customerToEdit.document_type || "CC",
              document_number: customerToEdit.document_number || "",
              person_type: customerToEdit.person_type || "natural",
              email: customerToEdit.email || "",
              phone: customerToEdit.phone || "",
            }
          : defaultFormData,
      );
      setErrors({});
    }
  }

  const getClintonStatus = async (
    name: string,
    documentNumber: string,
  ): Promise<boolean> => {
    return await validateClintonList.execute(name, documentNumber);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    if (errors[name as keyof CreateCustomerFormData]) {
      setErrors((prev) => ({ ...prev, [name as string]: undefined }));
    }
  };

  const handleSave = async () => {
    const validation = createCustomerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateCustomerFormData, string>> =
        {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CreateCustomerFormData] =
            err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName =
        `${formData.first_name} ${formData.first_surname || ""}`.trim();
      // In edit mode we could skip the sanctions list check, but we keep it enabled for safety.
      const isListed = await getClintonStatus(fullName, formData.document_number);

      const customerData: Customer = {
        ...(customerToEdit || {}), // Preserve ID if it exists
        ...formData,
        customer_type: "customer",
        isClintonListed: isListed,
        status: isListed ? "Reportado" : "Activo",
      };

      // Save the customer in the repository (the backend endpoint handles the create or update operation appropriately)
      await customerRepository.save(customerData);

      showNotification(
        `El cliente ha sido ${isEditMode ? "actualizado" : "creado"} exitosamente`,
        "success",
        `Cliente ${isEditMode ? "actualizado" : "creado"}`,
      );
      onSave(customerData);
      if (!isEditMode) {
        setFormData(defaultFormData);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showNotification(
          err.detail ??
            `Error al ${isEditMode ? "actualizar" : "crear"} el cliente`,
          "error",
          `Error al ${isEditMode ? "actualizar" : "crear"} cliente`,
        );
      } else {
        showNotification(
          `Error al ${isEditMode ? "actualizar" : "crear"} cliente: falló la verificación de la Lista Clinton o la base de datos`,
          "error",
          "Error de guardado",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
        {isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: 3,
          pt: 6,
          pb: 3,
        }}
      >
        {errors.general && (
          <Box sx={{ color: "error.main", typography: "body2" }}>
            {errors.general}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
          <TextField
            label="Nombres / Razón Social"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            fullWidth
            placeholder="Ej. Acme SAS"
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
          <TextField
            label="Apellidos"
            name="first_surname"
            value={formData.first_surname}
            onChange={handleChange}
            fullWidth
            placeholder="Opcional"
            error={!!errors.first_surname}
            helperText={errors.first_surname}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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
            placeholder="0202020202"
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
            placeholder="correo@ejemplo.com"
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            placeholder="3001234567"
            error={!!errors.phone}
            helperText={errors.phone}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? "Guardando..."
              : "Creando..."
            : isEditMode
              ? "Guardar Cambios"
              : "Crear Cliente"}
        </Button>
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
