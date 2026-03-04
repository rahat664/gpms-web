"use client";

import { Bell, CalendarDays, ChevronDown, LogOut, Menu, Moon, Search, SunMedium } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const titles: Record<string, string> = {
  "/dashboard": "Production Command Center",
  "/buyers": "Buyer Registry",
  "/styles": "Style Intelligence",
  "/materials": "Material Library",
  "/pos": "Purchase Orders",
  "/inventory": "Inventory Control",
  "/plans": "Planning Studio",
  "/cutting": "Cutting Floor",
  "/sewing": "Sewing Pulse",
  "/qc": "Quality Command",
};

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const factoryId = useAppStore((state) => state.factoryId);
  const setFactoryId = useAppStore((state) => state.setFactoryId);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const globalSearch = useAppStore((state) => state.globalSearch);
  const setGlobalSearch = useAppStore((state) => state.setGlobalSearch);

  return (
    <div className="sticky top-0 z-30 mb-6 rounded-[28px] border border-white/10 bg-background/65 px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
              onClick={onOpenMobileNav}
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              GPMS
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            GPMS Control Panel
          </div>
          <motion.h1
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-2xl font-semibold tracking-tight"
          >
            {titles[pathname] ?? "Operations"}
          </motion.h1>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:flex xl:items-center">
          <Select value={factoryId ?? undefined} onValueChange={setFactoryId}>
            <SelectTrigger className="w-full min-w-[220px] border-white/10 bg-white/5">
              <SelectValue placeholder="Select factory" />
            </SelectTrigger>
            <SelectContent>
              {user?.factories.map((factory) => (
                <SelectItem key={factory.id} value={factory.id}>
                  {factory.code} · {factory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex h-10 min-w-[180px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <input
              className="w-full bg-transparent text-foreground outline-none"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="border-white/10 bg-white/5 pl-9 pr-16"
              placeholder="Search buyers, PO, styles..."
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-muted-foreground">
              Ctrl+K
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl border border-white/10 bg-white/5"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-10 rounded-xl border border-white/10 bg-white/5">
            <Bell className="h-4 w-4" />
          </Button>
          <button
            className="flex h-10 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-left"
            onClick={() => router.push("/dashboard")}
            type="button"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold">
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl border border-white/10 bg-white/5"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
