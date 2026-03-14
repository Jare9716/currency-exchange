"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleLogin = () => {
    // Basic redirection
    router.push("/dashboard/users");
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
          maxWidth: "680px", // container width in Figma
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
          sx={{
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Correo"
            variant="outlined"
            type="email"
            slotProps={{ inputLabel: { shrink: true } }}
            placeholder="Correo"
          />

          <TextField
            fullWidth
            label="Contraseña"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            slotProps={{ inputLabel: { shrink: true } }}
            placeholder="Contraseña"
            InputProps={{
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
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              mt: -1,
            }}
          >
            <FormControlLabel
              control={<Checkbox color="primary" sx={{ py: 0 }} />}
              label={
                <Typography sx={{ color: "text.primary", fontSize: "14px" }}>
                  Recordarme
                </Typography>
              }
            />
            <Link
              href="#"
              underline="none"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              mt: 2,
              height: "42px",
              fontSize: "16px",
            }}
          >
            Ingresar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
