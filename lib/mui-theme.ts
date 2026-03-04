import { createTheme } from "@mui/material/styles";

export function buildMuiTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#06b6d4",
      },
      secondary: {
        main: "#22d3ee",
      },
      background:
        mode === "dark"
          ? {
              default: "#0b1220",
              paper: "#111827",
            }
          : {
              default: "#f4f7fb",
              paper: "#ffffff",
            },
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: "var(--font-sans), sans-serif",
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          },
        },
      },
    },
  });
}

