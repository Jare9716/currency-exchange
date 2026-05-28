"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Button } from "@/presentation/components/ui/Button/Button";
import { TextField } from "@/presentation/components/ui/TextField/TextField";
import { useLoginForm } from "@/presentation/components/features/auth/hooks/useLoginForm";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    formData,
    errors,
    isSubmitting,
    generalError,
    handleChange,
    handleLogin,
  } = useLoginForm();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: { xs: 4, sm: 10 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          width: "100%",
          maxWidth: "680px",
        }}
      >
        <Box sx={{ textAlign: "center", width: "100%", maxWidth: "520px" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "text.primary",
              mb: 1,
            }}
          >
            Bienvenido De Nuevo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
            }}
          >
            Por favor, inicia sesión para continuar
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          <TextField
            id="email"
            label="Correo"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />

          <TextField
            id="password"
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange("password")}
            error={!!errors.password}
            helperText={errors.password}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
              mt: -1,
            }}
          >
            <Link
              href="/forgot-password"
              underline="none"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Button type="submit" disabled={isSubmitting} sx={{ mt: 2 }}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
