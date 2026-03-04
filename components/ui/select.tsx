"use client";

import * as React from "react";
import FormControl from "@mui/material/FormControl";
import MuiSelect from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
} | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return <SelectContext.Provider value={{ value, onValueChange }}>{children}</SelectContext.Provider>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <>{placeholder}</>;
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(SelectContext);
  const [content, items] = React.Children.toArray(children ?? []).reduce<React.ReactNode[]>(
    (acc, child) => {
      acc.push(child);
      return acc;
    },
    [],
  );

  return (
    <FormControl size="small" className={cn("min-w-[220px]", className)}>
      <MuiSelect
        value={ctx?.value ?? ""}
        onChange={(event: SelectChangeEvent) => ctx?.onValueChange?.(event.target.value)}
        displayEmpty
        MenuProps={{ PaperProps: { sx: { zIndex: 9999 } } }}
      >
        {items}
      </MuiSelect>
    </FormControl>
  );
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <MenuItem value={value}>{children}</MenuItem>;
}
