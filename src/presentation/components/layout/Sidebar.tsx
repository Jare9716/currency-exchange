"use client";

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const theme = useTheme();
  const isCollapsed = useMediaQuery(theme.breakpoints.down("sm"));
  const pathname = usePathname();
  const router = useRouter();

  const navSections = [
    {
      title: "Operación",
      items: [
        { label: "Nueva Transacción", path: "/dashboard", icon: SwapHorizIcon },
        { label: "Clientes", path: "/dashboard/customers", icon: PeopleIcon },
        { label: "Historial", path: "/dashboard/transactions", icon: ReceiptIcon },
      ],
    },
    {
      title: "Configuración",
      items: [
        { label: "Estado del Turno", path: "/dashboard/shift", icon: AccessTimeIcon },
      ],
    },
  ];

  return (
    <Box
      sx={{
        width: { xs: 72, sm: 240 },
        bgcolor: "background.sidebar",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        borderRight: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.08)",
        zIndex: 1200,
      }}
    >
      <Box sx={{ flexGrow: 1, pt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {navSections.map((section) => (
          <Box key={section.title}>
            <Typography
              variant="caption"
              sx={{
                display: { xs: "none", sm: "block" },
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "#78909c",
                px: 2.5,
                mb: 0.5,
              }}
            >
              {section.title}
            </Typography>
            <List sx={{ p: 0 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <ListItem key={item.path} disablePadding sx={{ display: "block" }}>
                    <Tooltip
                      title={item.label}
                      placement="right"
                      disableHoverListener={!isCollapsed}
                    >
                      <ListItemButton
                        selected={isActive}
                        onClick={() => router.push(item.path)}
                        sx={{
                          minHeight: 40,
                          justifyContent: { xs: "center", sm: "initial" },
                          px: 2.5,
                          color: isActive ? "#ffffff" : "#b0bec5",
                          borderLeft: "3px solid",
                          borderColor: isActive ? "primary.main" : "transparent",
                          bgcolor: isActive ? "rgba(25, 118, 210, 0.15) !important" : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.05)",
                            color: "#ffffff",
                            "& .MuiListItemIcon-root": {
                              color: "#ffffff",
                            },
                          },
                          "&.Mui-selected": {
                            bgcolor: "rgba(25, 118, 210, 0.15) !important",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: { xs: 0, sm: 3 },
                            justifyContent: "center",
                            color: isActive ? "#ffffff" : "#b0bec5",
                          }}
                        >
                          <Icon />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          slotProps={{
                            primary: {
                              sx: {
                                fontWeight: isActive ? 600 : 500,
                                fontSize: "13px",
                              },
                            },
                          }}
                          sx={{
                            opacity: { xs: 0, sm: 1 },
                            display: { xs: "none", sm: "block" },
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
