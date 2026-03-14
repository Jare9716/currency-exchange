import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // components/button/primary
      contrastText: '#ffffff', // Use white for better contrast on dark blue instead of Figma's components/icon/on-primary which was dark gray
    },
    background: {
      default: '#f2f2f2', // surface/secondary
      paper: '#ffffff', // surface/primary
    },
    text: {
      primary: '#202020', // text/primary
      secondary: '#979797', // text/contrast
    },
    success: {
      main: '#388e3c', // components/chip/succes
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // components/chip/error
      contrastText: '#ffffff',
    },
    warning: {
      main: '#e64a19', // components/chip/warning
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '45px', // font/size/6xl
      fontWeight: 500, // font/weight/semiBold
      letterSpacing: '0.5px', // font/letter-spacing/6xl
    },
    h2: {
      fontSize: '22px', // font/size/xl
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    h3: {
      fontSize: '16px', // font/size/md
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      letterSpacing: '0.25px',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // Typical for modern designs to not force uppercase
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Based on user request "Let the radius as they are on MUI."
          // So we intentionally omit borderRadius: "360px" overrides.
          boxShadow: 'none', // Removing defaults for a flatter, more modern look unless specified
        },
        contained: {
          boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12)', // Subtle shadow from Figma variables
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Ensure flat surfaces in dark mode if configured later
        },
      },
    },
  },
});

export default theme;
