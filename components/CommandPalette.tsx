"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
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
  const [query, setQuery] = useState("");

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

  const q = query.trim().toLowerCase();
  const filteredNav = useMemo(
    () => navCommands.filter((item) => !q || item.label.toLowerCase().includes(q)),
    [q],
  );
  const filteredActions = useMemo(
    () => actionCommands.filter((item) => !q || item.label.toLowerCase().includes(q)),
    [q],
  );

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogContent sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search navigation and actions..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <Typography variant="overline" sx={{ mt: 2, display: "block" }}>Navigation</Typography>
        <List dense>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.href}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <ListItemIcon><Icon size={16} /></ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Typography variant="overline" sx={{ mt: 1, display: "block" }}>Actions</Typography>
        <List dense>
          {filteredActions.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.intent}
                onClick={() => {
                  setOpen(false);
                  openActionIntent(item.intent);
                }}
              >
                <ListItemIcon><Icon size={16} /></ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
}
