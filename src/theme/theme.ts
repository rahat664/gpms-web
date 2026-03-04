import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#06b6d4" },
    secondary: { main: "#22d3ee" },
    background: {
      default: "#0b1220",
      paper: "#111827",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 14, minHeight: 40 },
        contained: { boxShadow: "0 10px 26px rgba(6, 182, 212, 0.22)" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small", fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
        head: {
          fontWeight: 600,
          color: "rgba(255,255,255,0.72)",
          backgroundColor: "rgba(17,24,39,0.92)",
        },
      },
    },
  },
});

export default theme;
