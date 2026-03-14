"use client";

import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: "background.paper",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        pt: 2,
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={pathname === "/dashboard"}
            onClick={() => router.push("/dashboard")}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Lorem" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={pathname === "/dashboard/users"}
            onClick={() => router.push("/dashboard/users")}
            sx={{
              "&.Mui-selected": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Clientes" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
