"use client";

import { createTheme } from "@mui/material/styles";

// Module augmentation to allow custom header and sidebar background fields in typescript
declare module "@mui/material/styles" {
  interface TypeBackground {
    header: string;
    sidebar: string;
  }
}

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#1976d2", // components/button/primary
          dark: "#1565c0", // primary-dark
          light: "#e3f2fd", // primary-light
        },
        background: {
          default: "#f2f2f2", // surface/secondary
          paper: "#ffffff", // surface/primary
          header: "#0d1b2a", // Navy brand top bar background
          sidebar: "#1a2744", // Medium navy brand sidebar background
        },
        text: {
          primary: "#202020", // text/primary
          secondary: "#979797", // text/contrast
        },
      },
    },
    dark: {
      palette: {
        background: {
          header: "#0a1120", // Dark mode navy header
          sidebar: "#121b2d", // Dark mode deep navy-gray sidebar
        },
      },
    },
  },
  shape: {
    borderRadius: 8, // Cards, Dialogs, Modals get 8px radius
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
      fontSize: "15px", // Matches card/box titles (.card-title)
      fontWeight: 600,
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
      fontSize: "14px", // Scales standard text to mockup's 14px default
      fontWeight: 400,
      letterSpacing: "0.25px",
    },
    body2: {
      fontSize: "13px", // Scales tables & secondary text to mockup's 13px default
      fontWeight: 400,
      letterSpacing: "0.2px",
    },
    button: {
      fontSize: "14px", // Scales button labels to mockup's 14px default
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "6px", // Inputs get 6px radius
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: "medium",
      },
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: "6px", // Buttons get 6px radius
        },
        contained: {
          boxShadow: "0px 1px 5px 0px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "var(--mui-palette-background-default)", // Adapts automatically in light/dark!
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "10px 16px",
        },
        body: {
          padding: "11px 16px",
          fontSize: "13px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          "&.MuiPaper-elevation1": {
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)", // Soft premium shadow from design system
          },
        },
      },
    },
  },
});
