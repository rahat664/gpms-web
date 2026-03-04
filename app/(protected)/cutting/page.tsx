"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { RightDrawer } from "@/components/RightDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormRow } from "@/components/form-row";
import { SearchableSelect } from "@/components/SearchableSelect";
import { apiGet, apiPost } from "@/lib/api";

type CuttingBatch = {
  id: string;
  batchNo: string;
  poItemId: string;
  bundles: Array<{
    id: string;
    bundleCode: string;
    size: string;
    qty: number;
    status: string;
  }>;
};

export default function CuttingPage() {
  const queryClient = useQueryClient();
  const [selectedPoId, setSelectedPoId] = useState("");
  const [batch, setBatch] = useState({ poItemId: "", batchNo: "" });
  const [batchId, setBatchId] = useState("");
  const [bundleSize, setBundleSize] = useState("");
  const [bundleQty, setBundleQty] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const poQuery = useQuery({
    queryKey: ["pos-for-cutting"],
    queryFn: () =>
      apiGet<Array<{ id: string; poNo: string; buyer?: { name: string } | null }>>("/pos"),
  });
  const poDetailQuery = useQuery({
    queryKey: ["po-items-for-cutting", selectedPoId],
    queryFn: () =>
      apiGet<{
        items: Array<{
          id: string;
          color: string;
          quantity: number;
          style?: { styleNo: string } | null;
        }>;
      }>(`/pos/${selectedPoId}`),
    enabled: Boolean(selectedPoId),
  });

  const batchQuery = useQuery({
    queryKey: ["cutting-batch", batchId],
    queryFn: () => apiGet<CuttingBatch>(`/cutting/batches/${batchId}`),
    enabled: Boolean(batchId),
  });

  const selectedBatchQuery = useQuery({
    queryKey: ["cutting-batch-detail", selectedBatchId],
    queryFn: () => apiGet<CuttingBatch>(`/cutting/batches/${selectedBatchId}`),
    enabled: Boolean(selectedBatchId),
  });

  const createBatch = useMutation({
    mutationFn: () => apiPost<CuttingBatch>("/cutting/batches", batch),
    onSuccess: (response) => {
      setBatchId(response.id);
      queryClient.invalidateQueries({ queryKey: ["cutting-batch", response.id] });
      toast.success("Cutting batch created");
    },
  });

  const createBundles = useMutation({
    mutationFn: () =>
      apiPost(`/cutting/batches/${batchId}/bundles`, {
        bundles: [{ size: bundleSize, qty: Number(bundleQty) }],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batch", batchId] });
      queryClient.invalidateQueries({ queryKey: ["cutting-batch-detail", selectedBatchId] });
      setBundleSize("");
      setBundleQty("");
      toast.success("Bundles generated");
    },
  });

  const bundles = batchQuery.data?.bundles ?? [];

  return (
    <PageShell title="Cutting">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create Batch</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="PO">
                <SearchableSelect
                  value={selectedPoId}
                  onChange={(value) => {
                    setSelectedPoId(value);
                    setBatch({ ...batch, poItemId: "" });
                  }}
                  placeholder="Select PO"
                  options={(poQuery.data ?? []).map((po) => ({
                    value: po.id,
                    label: `${po.poNo} · ${po.buyer?.name ?? "No buyer"}`,
                    keywords: po.id,
                  }))}
                />
              </FormRow>
              <FormRow label="PO Item">
                <SearchableSelect
                  value={batch.poItemId}
                  onChange={(value) => setBatch({ ...batch, poItemId: value })}
                  placeholder="Select PO item"
                  options={(poDetailQuery.data?.items ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.style?.styleNo ?? "Unknown style"} · ${item.color} · ${item.quantity}`,
                    keywords: item.id,
                  }))}
                />
              </FormRow>
              <FormRow label="Batch No">
                <Input value={batch.batchNo} onChange={(e) => setBatch({ ...batch, batchNo: e.target.value })} />
              </FormRow>
              <Button className="w-full" onClick={() => createBatch.mutate()} disabled={createBatch.isPending}>
                {createBatch.isPending ? "Creating..." : "Create Batch"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Generate Bundles</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Batch ID">
                <Input value={batchId} onChange={(e) => setBatchId(e.target.value)} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Size">
                  <Input value={bundleSize} onChange={(e) => setBundleSize(e.target.value)} />
                </FormRow>
                <FormRow label="Qty">
                  <Input value={bundleQty} onChange={(e) => setBundleQty(e.target.value)} />
                </FormRow>
              </div>
              <Button className="w-full" variant="outline" onClick={() => createBundles.mutate()} disabled={createBundles.isPending || !batchId}>
                {createBundles.isPending ? "Generating..." : "Generate Bundles"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Bundle Count</div>
              <div className="mt-3 text-3xl font-semibold">{bundles.length}</div>
              <div className="mt-2 text-sm text-muted-foreground">Open the batch detail drawer for bundle drill-down</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Bundles</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => (
                  <TableRow key={bundle.id} onClick={() => setSelectedBatchId(batchId)} className="cursor-pointer">
                    <TableCell>{bundle.bundleCode}</TableCell>
                    <TableCell>{bundle.size}</TableCell>
                    <TableCell>{bundle.qty}</TableCell>
                    <TableCell>{bundle.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selectedBatchId)}
        onOpenChange={(open) => {
          if (!open) setSelectedBatchId(null);
        }}
        title={selectedBatchQuery.data?.batchNo ?? "Batch Detail"}
        description="Bundle level detail"
      >
        <Card>
          <CardHeader><CardTitle>Bundles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(selectedBatchQuery.data?.bundles ?? []).map((bundle) => (
              <div key={bundle.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{bundle.bundleCode}</div>
                  <div className="text-sm text-muted-foreground">{bundle.status}</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Size {bundle.size} · Qty {bundle.qty}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </RightDrawer>
    </PageShell>
  );
}
