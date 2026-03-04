"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/button";
import { SidebarNav } from "./SidebarNav";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { RightDrawer } from "./RightDrawer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const setCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  const actionIntent = useAppStore((state) => state.actionIntent);
  const clearActionIntent = useAppStore((state) => state.clearActionIntent);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <CommandPalette />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto grid min-h-screen max-w-[1800px] gap-6 px-4 py-4 lg:grid-cols-[auto_1fr] xl:px-6">
        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.button
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                type="button"
              />
              <motion.aside
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                className="fixed left-4 top-4 z-50 w-[min(86vw,320px)] rounded-[32px] border border-white/10 bg-background/95 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden"
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                      GPMS
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Factory OS
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl border border-white/10 bg-white/5"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SidebarNav
                  forceExpanded
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
        <aside
          className={cn(
            "hidden rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:block",
            collapsed ? "w-[92px]" : "w-[280px]",
          )}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            {!collapsed ? (
              <div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                  GPMS
                </div>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Factory OS
                </div>
              </div>
            ) : (
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl border border-white/10 bg-white/5"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
          <SidebarNav />
        </aside>
        <div className="min-w-0">
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <RightDrawer
        open={Boolean(actionIntent)}
        onOpenChange={(open) => {
          if (!open) clearActionIntent();
        }}
        title={
          actionIntent === "create-po"
            ? "Create PO"
            : actionIntent === "add-buyer"
              ? "Add Buyer"
              : actionIntent === "record-hourly-output"
                ? "Record Hourly Output"
                : actionIntent === "qc-inspect"
                  ? "QC Inspect"
                  : "Action"
        }
        description="Use the command palette to jump directly into the relevant workspace."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          {actionIntent === "create-po" && "Go to Purchase Orders to create a new PO."}
          {actionIntent === "add-buyer" && "Go to Buyers to add a new buyer record."}
          {actionIntent === "record-hourly-output" &&
            "Go to Sewing to record hourly line output."}
          {actionIntent === "qc-inspect" &&
            "Go to QC to submit a new inspection entry."}
          </div>
          <Button
            onClick={() => {
              const href =
                actionIntent === "create-po"
                  ? "/pos"
                  : actionIntent === "add-buyer"
                    ? "/buyers"
                    : actionIntent === "record-hourly-output"
                      ? "/sewing"
                      : "/qc";
              clearActionIntent();
              router.push(href);
            }}
          >
            Open Workspace
          </Button>
        </div>
      </RightDrawer>
    </div>
  );
}
