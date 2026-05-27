"use client";

import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useCustomersStore } from "@/presentation/stores/customers.store";
import { useTransactionsStore } from "@/presentation/stores/transactions.store";
import { useColorScheme } from "@mui/material/styles";

export function Header() {
  const router = useRouter();
  const { clearTokens } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    clearTokens();
    useCustomersStore.getState().resetCustomers();
    useTransactionsStore.getState().resetTransactions();
    router.push("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.header",
        borderBottom: "1px solid",
        borderColor: "background.headerBorder",
        color: "#ffffff",
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: "52px !important",
          height: "52px",
          justifyContent: "space-between",
          px: "16px !important",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "18px", // Matches .logo branding size in mockups
              letterSpacing: "-0.5px",
              color: "#ffffff",
            }}
          >
            JokerLabs
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "14px" }}>
              AD
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                mt: 1.5,
                border: "1px solid",
                borderColor: "divider",
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Configuración
          </MenuItem>
          {mounted && (
            <MenuItem
              onClick={() => {
                setMode(mode === "light" ? "dark" : "light");
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </ListItemIcon>
              {mode === "light" ? "Modo Oscuro" : "Modo Claro"}
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
