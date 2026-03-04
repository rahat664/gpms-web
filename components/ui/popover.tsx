"use client";

import * as React from "react";
import MuiPopover, { type PopoverProps } from "@mui/material/Popover";
import { cn } from "@/lib/utils";

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
} | null>(null);

export function Popover({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return (
    <PopoverContext.Provider value={{ open, setOpen: onOpenChange, anchorEl, setAnchorEl }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }: { asChild?: boolean; children: React.ReactElement<any> }) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) return children;

  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      ctx.setAnchorEl(event.currentTarget);
      ctx.setOpen(!ctx.open);
      const original = (children.props as { onClick?: (e: React.MouseEvent<HTMLElement>) => void }).onClick;
      original?.(event);
    },
  });
}

export function PopoverAnchor() {
  return null;
}

export function PopoverContent({
  className,
  align = "left",
  sideOffset = 8,
  children,
}: {
  className?: string;
  align?: string;
  sideOffset?: number;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) return null;

  const anchorOrigin: PopoverProps["anchorOrigin"] = { vertical: "bottom", horizontal: align === "start" ? "left" : "left" };
  const transformOrigin: PopoverProps["transformOrigin"] = { vertical: "top", horizontal: align === "start" ? "left" : "left" };

  return (
    <MuiPopover
      open={ctx.open}
      anchorEl={ctx.anchorEl}
      onClose={() => ctx.setOpen(false)}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{ paper: { className: cn("z-[9999]", className), sx: { mt: `${sideOffset}px` } } }}
    >
      {children}
    </MuiPopover>
  );
}
