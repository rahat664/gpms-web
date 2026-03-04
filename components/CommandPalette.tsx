"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  PackagePlus,
  Scissors,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const navCommands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/pos", icon: ShoppingCart },
  { label: "Planning", href: "/plans", icon: Sparkles },
  { label: "Cutting", href: "/cutting", icon: Scissors },
  { label: "Sewing", href: "/sewing", icon: Wrench },
  { label: "QC", href: "/qc", icon: ClipboardCheck },
  { label: "Inventory", href: "/inventory", icon: Package },
];

const actionCommands = [
  { label: "Create PO", intent: "create-po" as const, icon: PackagePlus },
  { label: "Add Buyer", intent: "add-buyer" as const, icon: Users },
  { label: "Record Hourly Output", intent: "record-hourly-output" as const, icon: Boxes },
  { label: "QC Inspect", intent: "qc-inspect" as const, icon: ClipboardCheck },
];

export function CommandPalette() {
  const router = useRouter();
  const open = useAppStore((state) => state.commandPaletteOpen);
  const setOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const openActionIntent = useAppStore((state) => state.openActionIntent);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm">
      <button
        aria-label="Close command palette"
        className="absolute inset-0"
        onClick={() => setOpen(false)}
        type="button"
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,720px)] overflow-hidden rounded-[28px] border border-white/10 bg-background/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <Command className="text-foreground">
          <div className="border-b border-white/10 px-4">
            <Command.Input
              autoFocus
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search navigation and actions..."
            />
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-3">
            <Command.Empty className="px-3 py-6 text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigation" className="mb-3">
              <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Navigation
              </div>
              {navCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-sm outline-none data-[selected=true]:bg-white/10"
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group heading="Actions">
              <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Actions
              </div>
              {actionCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.intent}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-sm outline-none data-[selected=true]:bg-white/10"
                    onSelect={() => openActionIntent(item.intent)}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
