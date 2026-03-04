"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "dark" | "light";
type ActionIntent =
  | "create-po"
  | "add-buyer"
  | "record-hourly-output"
  | "qc-inspect"
  | null;

type AppStore = {
  factoryId: string | null;
  selectedDate: string;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  globalSearch: string;
  commandPaletteOpen: boolean;
  actionIntent: ActionIntent;
  setFactoryId: (factoryId: string | null) => void;
  setSelectedDate: (selectedDate: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setGlobalSearch: (value: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openActionIntent: (intent: Exclude<ActionIntent, null>) => void;
  clearActionIntent: () => void;
};

const today = new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      factoryId: null,
      selectedDate: today,
      theme: "dark",
      sidebarCollapsed: false,
      globalSearch: "",
      commandPaletteOpen: false,
      actionIntent: null,
      setFactoryId: (factoryId) => set({ factoryId }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setGlobalSearch: (globalSearch) => set({ globalSearch }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      openActionIntent: (actionIntent) =>
        set({ actionIntent, commandPaletteOpen: false }),
      clearActionIntent: () => set({ actionIntent: null }),
    }),
    {
      name: "gpms-ui-store",
      partialize: (state) => ({
        factoryId: state.factoryId,
        selectedDate: state.selectedDate,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
