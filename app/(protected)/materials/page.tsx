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
import { requireText } from "@/lib/form-validation";
import { useAppStore } from "@/lib/store";

type Material = { id: string; name: string; type: string; uom: string };

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const globalSearch = useAppStore((state) => state.globalSearch).toLowerCase();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [uom, setUom] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: () => apiGet<Material[]>("/materials"),
  });

  const createMaterial = useMutation({
    mutationFn: () =>
      apiPost("/materials", {
        name: requireText(name, "Name"),
        type: requireText(type, "Type"),
        uom: requireText(uom, "UOM"),
      }),
    onSuccess: () => {
      setName("");
      setType("");
      setUom("");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material created");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? error?.message ?? "Failed to create material",
      );
    },
  });

  const filtered = useMemo(
    () =>
      (materialsQuery.data ?? []).filter((material) =>
        `${material.name} ${material.type} ${material.uom}`
          .toLowerCase()
          .includes(globalSearch),
      ),
    [globalSearch, materialsQuery.data],
  );

  return (
    <PageShell title="Materials">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create Material</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Type">
                  <Input value={type} onChange={(event) => setType(event.target.value)} />
                </FormRow>
                <FormRow label="UOM">
                  <Input value={uom} onChange={(event) => setUom(event.target.value)} />
                </FormRow>
              </div>
              <Button className="w-full" onClick={() => createMaterial.mutate()} disabled={createMaterial.isPending}>
                {createMaterial.isPending ? "Creating..." : "Save Material"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-8">
            <CardContent className="flex h-full items-center justify-between p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Material Library</div>
                <div className="mt-3 text-3xl font-semibold">{filtered.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">Core bill-of-material inputs available for planning and PO requirements</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((material) => (
                  <TableRow
                    key={material.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.type}</TableCell>
                    <TableCell>{material.uom}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selectedMaterial)}
        onOpenChange={(open) => {
          if (!open) setSelectedMaterial(null);
        }}
        title={selectedMaterial?.name ?? "Material Detail"}
        description="Material profile"
      >
        {selectedMaterial ? (
          <Card>
            <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="mt-2 font-medium">{selectedMaterial.name}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="mt-2 font-medium">{selectedMaterial.type}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">UOM</div>
                <div className="mt-2 font-medium">{selectedMaterial.uom}</div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
