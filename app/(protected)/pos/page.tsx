"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { POStatusTimeline } from "@/components/POStatusTimeline";
import { RightDrawer } from "@/components/RightDrawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormRow } from "@/components/form-row";
import { SearchableSelect } from "@/components/SearchableSelect";
import { apiGet, apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type Buyer = { id: string; name: string };
type Style = { id: string; styleNo: string; name?: string };
type PurchaseOrder = {
  id: string;
  poNo: string;
  status: string;
  shipDate?: string | null;
  buyer?: Buyer | null;
  _count?: { items: number };
};
type PurchaseOrderDetail = PurchaseOrder & {
  items: Array<{
    id: string;
    color: string;
    quantity: number;
    style?: Style | null;
  }>;
};
type MaterialRequirement = {
  poNo?: string;
  status?: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    requiredQty: number;
    uom: string;
  }>;
};
type StockRow = {
  materialId: string;
  materialName: string;
  materialType: string;
  availableQty: number;
  uom: string;
};

export default function PosPage() {
  const globalSearch = useAppStore((state) => state.globalSearch).toLowerCase();
  const queryClient = useQueryClient();
  const [poNo, setPoNo] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [poId, setPoId] = useState("");
  const [styleId, setStyleId] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const buyersQuery = useQuery({
    queryKey: ["buyers-lite"],
    queryFn: () => apiGet<Buyer[]>("/buyers"),
  });
  const stylesQuery = useQuery({
    queryKey: ["styles-lite"],
    queryFn: () => apiGet<Style[]>("/styles"),
  });
  const posQuery = useQuery({
    queryKey: ["pos-list"],
    queryFn: () => apiGet<PurchaseOrder[]>("/pos"),
  });
  const poDetailQuery = useQuery({
    queryKey: ["po-detail", detailId],
    queryFn: () => apiGet<PurchaseOrderDetail>(`/pos/${detailId}`),
    enabled: Boolean(detailId),
  });
  const requirementQuery = useQuery({
    queryKey: ["po-requirement", detailId],
    queryFn: () => apiGet<MaterialRequirement>(`/pos/${detailId}/material-requirement`),
    enabled: Boolean(detailId),
    retry: false,
  });
  const stockQuery = useQuery({
    queryKey: ["inventory-stock-for-po", detailId],
    queryFn: () => apiGet<StockRow[]>("/inventory/stock"),
    enabled: Boolean(detailId),
  });

  const createPo = useMutation({
    mutationFn: () => apiPost("/pos", { poNo, buyerId }),
    onSuccess: () => {
      setPoNo("");
      setBuyerId("");
      queryClient.invalidateQueries({ queryKey: ["pos-list"] });
      toast.success("PO created");
    },
  });

  const addPoItem = useMutation({
    mutationFn: () =>
      apiPost(`/pos/${poId}/items`, {
        styleId,
        color,
        quantity: Number(quantity),
      }),
    onSuccess: () => {
      setStyleId("");
      setColor("");
      setQuantity("");
      queryClient.invalidateQueries({ queryKey: ["pos-list"] });
      if (detailId === poId) {
        queryClient.invalidateQueries({ queryKey: ["po-detail", detailId] });
        queryClient.invalidateQueries({ queryKey: ["po-requirement", detailId] });
      }
      toast.success("PO item added");
    },
  });

  const confirmPo = useMutation({
    mutationFn: (id: string) => apiPost(`/pos/${id}/confirm`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pos-list"] });
      queryClient.invalidateQueries({ queryKey: ["po-detail", id] });
      toast.success("PO confirmed");
    },
  });

  const filtered = (posQuery.data ?? []).filter((po) =>
    `${po.poNo} ${po.status} ${po.buyer?.name ?? ""}`.toLowerCase().includes(globalSearch),
  );
  const stockByMaterialId = new Map(
    (stockQuery.data ?? []).map((item) => [item.materialId, item.availableQty]),
  );

  const exportRequirementCsv = () => {
    const rows = (requirementQuery.data?.materials ?? []).map((material) => {
      const stockQty = stockByMaterialId.get(material.materialId) ?? 0;
      const shortage = material.requiredQty > stockQty ? "YES" : "NO";
      return [
        material.materialName,
        material.requiredQty,
        stockQty,
        material.uom,
        shortage,
      ].join(",");
    });

    const csv = [
      "Material,Required Qty,Stock Qty,UOM,Shortage",
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${poDetailQuery.data?.poNo ?? "po-requirement"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell title="Purchase Orders">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create PO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="PO No">
                <Input value={poNo} onChange={(e) => setPoNo(e.target.value)} />
              </FormRow>
              <FormRow label="Buyer ID">
                <SearchableSelect
                  value={buyerId}
                  onChange={setBuyerId}
                  placeholder="Select buyer"
                  options={(buyersQuery.data ?? []).map((buyer) => ({
                    value: buyer.id,
                    label: buyer.name,
                    keywords: buyer.id,
                  }))}
                />
              </FormRow>
              <Button className="w-full" onClick={() => createPo.mutate()} disabled={createPo.isPending}>
                {createPo.isPending ? "Creating..." : "Create PO"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Add PO Item</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="PO ID">
                <SearchableSelect
                  value={poId}
                  onChange={setPoId}
                  placeholder="Select PO"
                  options={(posQuery.data ?? []).map((po) => ({
                    value: po.id,
                    label: `${po.poNo} · ${po.buyer?.name ?? "No buyer"}`,
                    keywords: `${po.id} ${po.status}`,
                  }))}
                />
              </FormRow>
              <FormRow label="Style ID">
                <SearchableSelect
                  value={styleId}
                  onChange={setStyleId}
                  placeholder="Select style"
                  options={(stylesQuery.data ?? []).map((style) => ({
                    value: style.id,
                    label: `${style.styleNo} · ${style.name ?? "Unnamed"}`,
                    keywords: style.id,
                  }))}
                />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Color">
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </FormRow>
                <FormRow label="Quantity">
                  <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </FormRow>
              </div>
              <Button className="w-full" onClick={() => addPoItem.mutate()} disabled={addPoItem.isPending}>
                {addPoItem.isPending ? "Adding..." : "Add Item"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Control</div>
              <div className="mt-3 text-3xl font-semibold">{filtered.length}</div>
              <div className="mt-2 text-sm text-muted-foreground">Purchase orders in current factory scope</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>PO Registry</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((po) => (
                  <TableRow key={po.id} onClick={() => setDetailId(po.id)} className="cursor-pointer">
                    <TableCell>{po.poNo}</TableCell>
                    <TableCell>{po.status}</TableCell>
                    <TableCell>{po.buyer?.name ?? "-"}</TableCell>
                    <TableCell>{po._count?.items ?? 0}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Button
                        variant="outline"
                        disabled={po.status !== "DRAFT" || confirmPo.isPending}
                        onClick={() => confirmPo.mutate(po.id)}
                      >
                        Confirm
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        title={poDetailQuery.data?.poNo ?? "PO Detail"}
        description="Items, status, and material requirement"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>PO Overview</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">PO Number</div>
                  <div className="mt-2 text-lg font-semibold">{poDetailQuery.data?.poNo ?? "-"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Buyer</div>
                  <div className="mt-2 text-lg font-semibold">{poDetailQuery.data?.buyer?.name ?? "-"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Ship Date</div>
                  <div className="mt-2 text-lg font-semibold">
                    {poDetailQuery.data?.shipDate
                      ? new Date(poDetailQuery.data.shipDate).toLocaleDateString()
                      : "Not scheduled"}
                  </div>
                </div>
              </div>
              <POStatusTimeline status={poDetailQuery.data?.status} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>PO Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(poDetailQuery.data?.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.style?.styleNo ?? "Unknown style"}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Material Requirement</CardTitle>
              <Button
                variant="outline"
                className="gap-2"
                onClick={exportRequirementCsv}
                disabled={!requirementQuery.data?.materials?.length}
              >
                <Download className="h-4 w-4" />
                Download requirement CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {requirementQuery.isError ? (
                <div className="text-sm text-muted-foreground">Requirement unavailable for this PO.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(requirementQuery.data?.materials ?? []).map((material) => {
                      const stockQty = stockByMaterialId.get(material.materialId) ?? 0;
                      const shortage = material.requiredQty > stockQty;

                      return (
                        <TableRow key={material.materialId}>
                          <TableCell>{material.materialName}</TableCell>
                          <TableCell>{material.requiredQty}</TableCell>
                          <TableCell>{stockQty}</TableCell>
                          <TableCell>{material.uom}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                shortage
                                  ? "bg-red-500/15 text-red-200"
                                  : "bg-emerald-500/15 text-emerald-200"
                              }
                            >
                              {shortage ? "Shortage" : "Covered"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </RightDrawer>
    </PageShell>
  );
}
