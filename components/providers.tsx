"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import theme from "@/src/theme/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const appTheme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", appTheme === "dark");
    document.documentElement.style.colorScheme = "dark";
  }, [appTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
