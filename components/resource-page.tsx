"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "./page-shell";
import { RightDrawer } from "./RightDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAppStore } from "@/lib/store";

type Column<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  sortValue?: (item: T) => string | number;
};

export function ResourcePage<T extends Record<string, unknown>>({
  title,
  form,
  load,
  columns,
  rowKey,
  actions,
  detail,
}: {
  title: string;
  form: ReactNode;
  load: () => Promise<T[]>;
  columns: Array<Column<T>>;
  rowKey: (item: T) => string;
  actions?: (item: T, refresh: () => void) => ReactNode;
  detail?: (item: T, refresh: () => void) => ReactNode;
}) {
  const globalSearch = useAppStore((state) => state.globalSearch);
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>(columns[0]?.key ?? "id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const pageSize = 8;

  const refresh = async () => {
    try {
      setItems(await load());
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Failed to load");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const query = `${search} ${globalSearch}`.trim().toLowerCase();
    const nextItems = !query
      ? items
      : items.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(query),
        );

    const activeColumn = columns.find((column) => column.key === sortKey);
    const sorted = [...nextItems].sort((left, right) => {
      const leftValue = activeColumn?.sortValue?.(left) ?? String(left[sortKey] ?? "");
      const rightValue = activeColumn?.sortValue?.(right) ?? String(right[sortKey] ?? "");
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [columns, globalSearch, items, search, sortDirection, sortKey]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, globalSearch]);

  return (
    <PageShell title={title}>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="xl:col-span-9">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                    Resource workspace
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative min-w-[260px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder={`Search ${title.toLowerCase()}...`}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                      All
                    </button>
                    <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                      Active
                    </button>
                    <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                      Recent
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="xl:col-span-3">
            <CardContent className="flex h-full items-center justify-between gap-4 p-5">
              <div>
                <div className="text-sm text-muted-foreground">Records</div>
                <div className="mt-2 text-3xl font-semibold">{filtered.length}</div>
              </div>
              <Button className="gap-2" onClick={() => setOpenCreate(true)}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{title} List</CardTitle>
            <Button onClick={refresh} variant="outline">
              Reload
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>
                      <button
                        className="inline-flex items-center gap-2"
                        onClick={() => {
                          if (sortKey === column.key) {
                            setSortDirection((current) =>
                              current === "asc" ? "desc" : "asc",
                            );
                          } else {
                            setSortKey(column.key);
                            setSortDirection("asc");
                          }
                        }}
                        type="button"
                      >
                        {column.header}
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((item) => (
                  <motion.tr
                    key={rowKey(item)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key}>{column.render(item)}</TableCell>
                    ))}
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {actions ? actions(item, refresh) : <Button variant="ghost">Open</Button>}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={`Create ${title.slice(0, -1) || title}`}
        description="Use the form below to create a new record."
      >
        {form}
      </RightDrawer>

      <RightDrawer
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        title={`${title.slice(0, -1) || title} detail`}
        description="Operational detail panel"
      >
        {selectedItem ? (
          detail ? (
            detail(selectedItem, refresh)
          ) : (
            <pre className="overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
              {JSON.stringify(selectedItem, null, 2)}
            </pre>
          )
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
