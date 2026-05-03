"use client";

import React, { useState } from "react";
import { createUserSchema, CreateUserFormData } from "./user.schema";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
} from "@mui/material";
import { User } from "@/domain/User";
import { ValidateClintonList } from "@/use-cases/ValidateClintonList";
import { clintonListService } from "@/infrastructure/HttpClintonListService";

interface CreateUserModalProps {
	open: boolean;
	onClose: () => void;
	onCreate: (user: User) => void;
}

export function CreateUserModal({
	open,
	onClose,
	onCreate,
}: CreateUserModalProps) {
	const [formData, setFormData] = useState<CreateUserFormData>({
		name: "",
		email: "",
		cc: "",
		phone: "",
	});
	const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormData, string>>>({});

	const getClintonStatus = async (
		name: string,
		cc: string,
	): Promise<boolean> => {
		const validateClintonList = new ValidateClintonList(clintonListService);
		return await validateClintonList.execute(name, cc);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name as keyof CreateUserFormData]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleCreate = async () => {
		const validation = createUserSchema.safeParse(formData);
		if (!validation.success) {
			const fieldErrors: Partial<Record<keyof CreateUserFormData, string>> = {};
			validation.error.issues.forEach((err) => {
				if (err.path[0]) {
					fieldErrors[err.path[0] as keyof CreateUserFormData] = err.message;
				}
			});
			setErrors(fieldErrors);
			return;
		}

		const isListed = await getClintonStatus(formData.name, formData.cc);

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
					error={!!errors.name}
					helperText={errors.name}
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
					error={!!errors.email}
					helperText={errors.email}
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
						error={!!errors.cc}
						helperText={errors.cc}
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
						error={!!errors.phone}
						helperText={errors.phone}
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
