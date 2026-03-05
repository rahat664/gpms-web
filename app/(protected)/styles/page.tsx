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
import { SearchableSelect } from "@/components/SearchableSelect";
import { api, apiGet, apiPost } from "@/lib/api";
import { requirePositiveNumber, requireText } from "@/lib/form-validation";
import { useAppStore } from "@/lib/store";

type Material = { id: string; name: string; uom: string };
type Style = {
  id: string;
  styleNo: string;
  name?: string;
  season?: string;
  bom?: { items: Array<{ materialId: string; consumption: number; material: Material }> };
};
type BomDraftLine = {
  key: string;
  materialId: string;
  consumption: string;
};

function createBomDraftLine(overrides?: Partial<Omit<BomDraftLine, "key">>): BomDraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    materialId: overrides?.materialId ?? "",
    consumption: overrides?.consumption ?? "",
  };
}

function toBomDraftLines(style: Style | null): BomDraftLine[] {
  const items = style?.bom?.items ?? [];

  if (items.length === 0) {
    return [createBomDraftLine()];
  }

  return items.map((item) =>
    createBomDraftLine({
      materialId: item.materialId,
      consumption: String(item.consumption),
    }),
  );
}

export default function StylesPage() {
  const queryClient = useQueryClient();
  const globalSearch = useAppStore((state) => state.globalSearch).toLowerCase();
  const [styleNo, setStyleNo] = useState("");
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [editForm, setEditForm] = useState({ styleNo: "", name: "", season: "" });
  const [bomLines, setBomLines] = useState<BomDraftLine[]>([createBomDraftLine()]);

  const stylesQuery = useQuery({
    queryKey: ["styles"],
    queryFn: () => apiGet<Style[]>("/styles"),
  });
  const materialsQuery = useQuery({
    queryKey: ["materials-lite"],
    queryFn: () => apiGet<Material[]>("/materials"),
  });

  const createStyle = useMutation({
    mutationFn: () =>
      apiPost("/styles", {
        styleNo: requireText(styleNo, "Style No"),
        name: requireText(name, "Name"),
        season: season.trim() || undefined,
      }),
    onSuccess: () => {
      setStyleNo("");
      setName("");
      setSeason("");
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      toast.success("Style created");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create style");
    },
  });

  const updateStyle = useMutation({
    mutationFn: () => {
      if (!selectedStyle?.id) throw new Error("Style is required");
      return api.put(`/styles/${selectedStyle.id}`, {
        styleNo: requireText(editForm.styleNo, "Style No"),
        name: requireText(editForm.name, "Name"),
        season: editForm.season.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      toast.success("Style updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update style");
    },
  });

  const deleteStyle = useMutation({
    mutationFn: (id: string) => api.delete(`/styles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      setSelectedStyle(null);
      toast.success("Style deleted");
    },
  });

  const saveBom = useMutation({
    mutationFn: () => {
      if (!selectedStyle?.id) throw new Error("Style is required");

      const items = bomLines.map((line, index) => ({
        materialId: requireText(line.materialId, `Material ${index + 1}`),
        consumption: requirePositiveNumber(line.consumption, `Consumption ${index + 1}`),
      }));

      const uniqueMaterialIds = new Set(items.map((item) => item.materialId));
      if (uniqueMaterialIds.size !== items.length) {
        throw new Error("Duplicate materials are not allowed in BOM");
      }

      return apiPost(`/styles/${selectedStyle.id}/bom`, {
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      toast.success("BOM saved");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to save BOM");
    },
  });

  const filtered = useMemo(
    () =>
      (stylesQuery.data ?? []).filter((style) =>
        `${style.styleNo} ${style.name ?? ""} ${style.season ?? ""}`
          .toLowerCase()
          .includes(globalSearch),
      ),
    [globalSearch, stylesQuery.data],
  );
  const materialOptions = useMemo(
    () =>
      (materialsQuery.data ?? []).map((material) => ({
        value: material.id,
        label: `${material.name} · ${material.uom}`,
        keywords: material.id,
      })),
    [materialsQuery.data],
  );
  const materialById = useMemo(
    () => new Map((materialsQuery.data ?? []).map((material) => [material.id, material])),
    [materialsQuery.data],
  );

  return (
    <PageShell title="Styles & BOM">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create Style</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Style No">
                <Input value={styleNo} onChange={(event) => setStyleNo(event.target.value)} />
              </FormRow>
              <FormRow label="Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </FormRow>
              <FormRow label="Season">
                <Input value={season} onChange={(event) => setSeason(event.target.value)} />
              </FormRow>
              <Button className="w-full" onClick={() => createStyle.mutate()} disabled={createStyle.isPending}>
                {createStyle.isPending ? "Creating..." : "Save Style"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-8">
            <CardContent className="flex h-full items-center justify-between p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Style Intelligence</div>
                <div className="mt-3 text-3xl font-semibold">{filtered.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">Styles with BOM visibility for planning and material requirement checks</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Styles</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Style No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>BOM Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((style) => (
                  <TableRow
                    key={style.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedStyle(style);
                      setEditForm({
                        styleNo: style.styleNo,
                        name: style.name ?? "",
                        season: style.season ?? "",
                      });
                      setBomLines(toBomDraftLines(style));
                    }}
                  >
                    <TableCell>{style.styleNo}</TableCell>
                    <TableCell>{style.name ?? "-"}</TableCell>
                    <TableCell>{style.season ?? "-"}</TableCell>
                    <TableCell>{style.bom?.items.length ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selectedStyle)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStyle(null);
            setBomLines([createBomDraftLine()]);
          }
        }}
        title={selectedStyle?.styleNo ?? "Style Detail"}
        description="Style profile and BOM editor"
      >
        {selectedStyle ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Style Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormRow label="Style No">
                  <Input
                    value={editForm.styleNo}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, styleNo: event.target.value }))
                    }
                  />
                </FormRow>
                <FormRow label="Name">
                  <Input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </FormRow>
                <FormRow label="Season">
                  <Input
                    value={editForm.season}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, season: event.target.value }))
                    }
                  />
                </FormRow>
                <div className="flex gap-3">
                  <Button onClick={() => updateStyle.mutate()} disabled={updateStyle.isPending}>
                    Save Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteStyle.mutate(selectedStyle.id)}
                    disabled={deleteStyle.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>BOM Editor</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {bomLines.map((line, index) => (
                  <div
                    key={line.key}
                    className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormRow label={`Material ${index + 1}`}>
                        <SearchableSelect
                          value={line.materialId}
                          onChange={(value) =>
                            setBomLines((current) =>
                              current.map((entry) =>
                                entry.key === line.key ? { ...entry, materialId: value } : entry,
                              ),
                            )
                          }
                          placeholder="Select material"
                          options={materialOptions}
                        />
                      </FormRow>
                      <FormRow label="Consumption">
                        <Input
                          value={line.consumption}
                          onChange={(event) =>
                            setBomLines((current) =>
                              current.map((entry) =>
                                entry.key === line.key
                                  ? { ...entry, consumption: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </FormRow>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={bomLines.length === 1 || saveBom.isPending}
                        onClick={() =>
                          setBomLines((current) => current.filter((entry) => entry.key !== line.key))
                        }
                      >
                        Remove Line
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setBomLines((current) => [...current, createBomDraftLine()])
                    }
                    disabled={saveBom.isPending}
                  >
                    Add Line
                  </Button>
                  <Button onClick={() => saveBom.mutate()} disabled={saveBom.isPending}>
                    Save BOM
                  </Button>
                </div>
                <div className="space-y-3">
                  {bomLines.map((line, index) => {
                    const material = materialById.get(line.materialId);

                    return (
                    <div
                      key={line.key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span>{material?.name ?? `Line ${index + 1}`}</span>
                      <span className="text-sm text-muted-foreground">
                        {line.consumption || "-"} / {material?.uom ?? "-"}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
