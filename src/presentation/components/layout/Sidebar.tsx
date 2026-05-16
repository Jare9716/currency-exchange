"use client";

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const theme = useTheme();
  const isCollapsed = useMediaQuery(theme.breakpoints.down("sm"));
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Transacción", path: "/dashboard", icon: SwapHorizIcon },
    { label: "Clientes", path: "/dashboard/customers", icon: PeopleIcon },
    { label: "Transacciones", path: "/dashboard/transactions", icon: ReceiptIcon },
  ];

  return (
    <Box
      sx={{
        width: { xs: 72, sm: 240 },
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        borderRight: "1px solid",
        borderColor: "divider",
        zIndex: 1200,
      }}
    >
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {navItems.map((item) => {
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
                    minHeight: 48,
                    justifyContent: { xs: "center", sm: "initial" },
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: { xs: 0, sm: 3 },
                      justifyContent: "center",
                    }}
                  >
                    <Icon color={isActive ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    sx={{ 
                      opacity: { xs: 0, sm: 1 },
                      display: { xs: "none", sm: "block" }
                    }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
