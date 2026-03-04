"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Factory,
  LayoutDashboard,
  Package,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buyers", label: "Buyers", icon: Users },
  { href: "/styles", label: "Styles", icon: Shirt },
  { href: "/materials", label: "Materials", icon: Warehouse },
  { href: "/pos", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/plans", label: "Plans", icon: Factory },
  { href: "/cutting", label: "Cutting", icon: Scissors },
  { href: "/sewing", label: "Sewing", icon: Activity },
  { href: "/qc", label: "Quality", icon: ShieldCheck },
];

export function SidebarNav({
  onNavigate,
  forceExpanded = false,
}: {
  onNavigate?: () => void;
  forceExpanded?: boolean;
}) {
  const pathname = usePathname();
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <nav className="space-y-2">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link key={link.href} href={link.href} onClick={onNavigate}>
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-sm transition-all",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.2)]"
                  : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground",
              )}
            >
              {active ? (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/15 via-white/5 to-transparent"
                />
              ) : null}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              {!isCollapsed ? (
                <span className="relative z-10 truncate">{link.label}</span>
              ) : null}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
