"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyText = "No matches found",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.label} ${option.keywords ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const commit = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-card/70 px-3 text-left text-sm"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter" && open && filtered[activeIndex]) {
            event.preventDefault();
            commit(filtered[activeIndex].value);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        type="button"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-white/10 bg-background/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none"
              placeholder="Search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    Math.min(current + 1, Math.max(filtered.length - 1, 0)),
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === "Enter" && filtered[activeIndex]) {
                  event.preventDefault();
                  commit(filtered[activeIndex].value);
                }
                if (event.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length ? (
              filtered.map((option, index) => (
                <button
                  key={option.value}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/5",
                    index === activeIndex && "bg-white/10",
                  )}
                  onClick={() => {
                    commit(option.value);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
