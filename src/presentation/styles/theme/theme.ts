"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // components/button/primary
      contrastText: "#ffffff", // Use white for better contrast on dark blue instead of Figma's components/icon/on-primary which was dark gray
    },
    background: {
      default: "#f2f2f2", // surface/secondary
      paper: "#ffffff", // surface/primary
    },
    text: {
      primary: "#202020", // text/primary
      secondary: "#979797", // text/contrast
    },
    success: {
      main: "#388e3c", // components/chip/succes
      contrastText: "#ffffff",
    },
    error: {
      main: "#d32f2f", // components/chip/error
      contrastText: "#ffffff",
    },
    warning: {
      main: "#e64a19", // components/chip/warning
      contrastText: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "45px", // font/size/6xl
      fontWeight: 500, // font/weight/semiBold
      letterSpacing: "0.5px", // font/letter-spacing/6xl
    },
    h2: {
      fontSize: "22px", // font/size/xl
      fontWeight: 500,
      letterSpacing: "0.1px",
    },
    h3: {
      fontSize: "16px", // font/size/md
      fontWeight: 500,
      letterSpacing: "0.15px",
    },
    h4: {
      fontSize: "20px",
      fontWeight: 500,
      letterSpacing: "0.15px",
    },
    subtitle1: {
      fontSize: "16px",
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "14px",
      fontWeight: 600,
    },
    body1: {
      fontSize: "16px",
      fontWeight: 400,
      letterSpacing: "0.5px",
    },
    body2: {
      fontSize: "14px",
      fontWeight: 400,
      letterSpacing: "0.25px",
    },
    button: {
      fontSize: "16px",
      fontWeight: 600,
      textTransform: "none", // Typical for modern designs to not force uppercase
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
    },
    MuiButton: {
      defaultProps: {
        size: "medium",
      },
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
        contained: {
          boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

