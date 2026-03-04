"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { POStatusTimeline } from "@/components/POStatusTimeline";
import { RightDrawer } from "@/components/RightDrawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiPost } from "@/lib/api";
import { requirePositiveNumber, requireText } from "@/lib/form-validation";
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
    mutationFn: () =>
      apiPost("/pos", {
        poNo: requireText(poNo, "PO No"),
        buyerId: requireText(buyerId, "Buyer"),
      }),
    onSuccess: () => {
      setPoNo("");
      setBuyerId("");
      queryClient.invalidateQueries({ queryKey: ["pos-list"] });
      toast.success("PO created");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create PO");
    },
  });

  const addPoItem = useMutation({
    mutationFn: () => {
      const nextPoId = requireText(poId, "PO");
      return apiPost(`/pos/${nextPoId}/items`, {
        styleId: requireText(styleId, "Style"),
        color: requireText(color, "Color"),
        quantity: requirePositiveNumber(quantity, "Quantity"),
      });
    },
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
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to add PO item");
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

  const selectedBuyer = useMemo(
    () => (buyersQuery.data ?? []).find((buyer) => buyer.id === buyerId) ?? null,
    [buyersQuery.data, buyerId],
  );
  const selectedPo = useMemo(
    () => (posQuery.data ?? []).find((po) => po.id === poId) ?? null,
    [posQuery.data, poId],
  );
  const selectedStyle = useMemo(
    () => (stylesQuery.data ?? []).find((style) => style.id === styleId) ?? null,
    [stylesQuery.data, styleId],
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader title="Create PO" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="PO No"
                  value={poNo}
                  onChange={(event) => setPoNo(event.target.value)}
                  fullWidth
                />
                <Autocomplete
                  options={buyersQuery.data ?? []}
                  value={selectedBuyer}
                  onChange={(_, next) => setBuyerId(next?.id ?? "")}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Buyer ID" />}
                  slotProps={{
                    popper: {
                      sx: { zIndex: 9999 },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => createPo.mutate()}
                  disabled={createPo.isPending}
                  fullWidth
                >
                  {createPo.isPending ? "Creating..." : "Create PO"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4">
            <CardHeader title="Add PO Item" />
            <CardContent>
              <Stack spacing={2}>
                <Autocomplete
                  options={posQuery.data ?? []}
                  value={selectedPo}
                  onChange={(_, next) => setPoId(next?.id ?? "")}
                  getOptionLabel={(option) => `${option.poNo} · ${option.buyer?.name ?? "No buyer"}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="PO ID" />}
                  slotProps={{
                    popper: {
                      sx: { zIndex: 9999 },
                    },
                  }}
                />
                <Autocomplete
                  options={stylesQuery.data ?? []}
                  value={selectedStyle}
                  onChange={(_, next) => setStyleId(next?.id ?? "")}
                  getOptionLabel={(option) => `${option.styleNo} · ${option.name ?? "Unnamed"}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Style ID" />}
                  slotProps={{
                    popper: {
                      sx: { zIndex: 9999 },
                    },
                  }}
                />
                <Box className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Quantity"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    fullWidth
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={() => addPoItem.mutate()}
                  disabled={addPoItem.isPending}
                  fullWidth
                >
                  {addPoItem.isPending ? "Adding..." : "Add Item"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4">
            <CardContent sx={{ pt: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Control
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, fontWeight: 700 }}>
                {filtered.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Purchase orders in current factory scope
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardHeader title="PO Registry" />
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
                        variant="outlined"
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
      </Box>

      <RightDrawer
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        title={poDetailQuery.data?.poNo ?? "PO Detail"}
        description="Items, status, and material requirement"
      >
        <Stack spacing={3}>
          <Card>
            <CardHeader title="PO Overview" />
            <CardContent>
              <Box className="grid gap-4 md:grid-cols-3">
                <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Typography variant="caption" color="text.secondary">
                    PO Number
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {poDetailQuery.data?.poNo ?? "-"}
                  </Typography>
                </Box>
                <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Typography variant="caption" color="text.secondary">
                    Buyer
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {poDetailQuery.data?.buyer?.name ?? "-"}
                  </Typography>
                </Box>
                <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Typography variant="caption" color="text.secondary">
                    Ship Date
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {poDetailQuery.data?.shipDate
                      ? new Date(poDetailQuery.data.shipDate).toLocaleDateString()
                      : "Not scheduled"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 3 }}>
                <POStatusTimeline status={poDetailQuery.data?.status} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="PO Items" />
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
            <CardHeader
              title="Material Requirement"
              action={
                <Button
                  variant="outlined"
                  onClick={exportRequirementCsv}
                  disabled={!requirementQuery.data?.materials?.length}
                >
                  <Box component="span" sx={{ display: "inline-flex", mr: 1 }}>
                    <Download size={16} />
                  </Box>
                  Download requirement CSV
                </Button>
              }
            />
            <CardContent>
              {requirementQuery.isError ? (
                <Typography variant="body2" color="text.secondary">
                  Requirement unavailable for this PO.
                </Typography>
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
                            <Chip
                              size="small"
                              label={shortage ? "Shortage" : "Covered"}
                              color={shortage ? "error" : "success"}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Stack>
      </RightDrawer>
    </PageShell>
  );
}
