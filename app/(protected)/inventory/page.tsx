"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { RightDrawer } from "@/components/RightDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormRow } from "@/components/form-row";
import { apiGet, apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type StockRow = {
  materialId: string;
  materialName: string;
  materialType: string;
  availableQty: number;
  uom: string;
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const globalSearch = useAppStore((state) => state.globalSearch).toLowerCase();
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [materialId, setMaterialId] = useState("");
  const [qty, setQty] = useState("");

  const stockQuery = useQuery({
    queryKey: ["inventory-stock"],
    queryFn: () => apiGet<StockRow[]>("/inventory/stock"),
  });

  const receiveMutation = useMutation({
    mutationFn: () =>
      apiPost("/inventory/receive", {
        materialId,
        qty: Number(qty),
        refType: "GRN",
      }),
    onSuccess: () => {
      setQty("");
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      toast.success("Inventory received");
    },
  });

  const issueMutation = useMutation({
    mutationFn: () =>
      apiPost("/inventory/issue-to-cutting", {
        materialId,
        qty: Number(qty),
        refType: "ISSUE_CUTTING",
      }),
    onSuccess: () => {
      setQty("");
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      toast.success("Inventory issued");
    },
  });

  const filtered = useMemo(
    () =>
      (stockQuery.data ?? []).filter((row) =>
        `${row.materialName} ${row.materialType} ${row.uom}`
          .toLowerCase()
          .includes(globalSearch),
      ),
    [globalSearch, stockQuery.data],
  );

  return (
    <PageShell title="Inventory">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Receive</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Material ID">
                <Input value={materialId} onChange={(e) => setMaterialId(e.target.value)} />
              </FormRow>
              <FormRow label="Qty">
                <Input value={qty} onChange={(e) => setQty(e.target.value)} />
              </FormRow>
              <Button className="w-full" onClick={() => receiveMutation.mutate()} disabled={receiveMutation.isPending}>
                {receiveMutation.isPending ? "Receiving..." : "Receive Stock"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Issue To Cutting</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Material ID">
                <Input value={materialId} onChange={(e) => setMaterialId(e.target.value)} />
              </FormRow>
              <FormRow label="Qty">
                <Input value={qty} onChange={(e) => setQty(e.target.value)} />
              </FormRow>
              <Button className="w-full" variant="outline" onClick={() => issueMutation.mutate()} disabled={issueMutation.isPending}>
                {issueMutation.isPending ? "Issuing..." : "Issue Stock"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Available SKUs</div>
              <div className="mt-3 text-3xl font-semibold">{filtered.length}</div>
              <div className="mt-2 text-sm text-muted-foreground">Live material balances with factory-scoped stock positions</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Stock Ledger</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.materialId} onClick={() => setSelected(row)} className="cursor-pointer">
                    <TableCell>{row.materialName}</TableCell>
                    <TableCell>{row.materialType}</TableCell>
                    <TableCell>{row.availableQty}</TableCell>
                    <TableCell>{row.uom}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.materialName ?? "Material Detail"}
        description="Current stock position"
      >
        {selected ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div className="mt-2 font-medium">{selected.materialType}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Available</div>
                  <div className="mt-2 font-medium">{selected.availableQty}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Unit</div>
                  <div className="mt-2 font-medium">{selected.uom}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
