import { createTheme } from '@mui/material/styles';

// Example Theme Definition
const theme = createTheme({
  palette: {
    primary: {
      main: '#800000', // Maroon
    },
    secondary: {
      main: '#FFD700', // Gold (Accent)
    },
    background: {
      default: '#FFFFFF', // White
      paper: '#FFFFFF',   // White
    },
    text: {
      primary: '#000000', // Black
      secondary: '#333333', // Dark grey for secondary text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
  },
  spacing: 8, // The default spacing unit (8px)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Example: Disable uppercase transformation
          borderRadius: '8px',
        },
      },
    },
  },
});

export default theme;