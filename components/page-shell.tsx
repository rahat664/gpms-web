"use client";

import { ReactNode } from "react";
import { AppShell } from "./AppShell";

export function PageShell({
  title: _title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
