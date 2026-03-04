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
import { api, apiGet, apiPost } from "@/lib/api";
import { requireText } from "@/lib/form-validation";
import { useAppStore } from "@/lib/store";

type Buyer = { id: string; name: string; country?: string };

export default function BuyersPage() {
  const queryClient = useQueryClient();
  const globalSearch = useAppStore((state) => state.globalSearch).toLowerCase();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", country: "" });

  const buyersQuery = useQuery({
    queryKey: ["buyers"],
    queryFn: () => apiGet<Buyer[]>("/buyers"),
  });

  const createBuyer = useMutation({
    mutationFn: () =>
      apiPost("/buyers", {
        name: requireText(name, "Name"),
        country: country.trim() || undefined,
      }),
    onSuccess: () => {
      setName("");
      setCountry("");
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast.success("Buyer created");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to create buyer");
    },
  });

  const updateBuyer = useMutation({
    mutationFn: () => {
      if (!selectedBuyer?.id) throw new Error("Buyer is required");
      return api.put(`/buyers/${selectedBuyer.id}`, {
        name: requireText(editForm.name, "Name"),
        country: editForm.country.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast.success("Buyer updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update buyer");
    },
  });

  const deleteBuyer = useMutation({
    mutationFn: (id: string) => api.delete(`/buyers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      setSelectedBuyer(null);
      toast.success("Buyer deleted");
    },
  });

  const filtered = useMemo(
    () =>
      (buyersQuery.data ?? []).filter((buyer) =>
        `${buyer.name} ${buyer.country ?? ""}`.toLowerCase().includes(globalSearch),
      ),
    [buyersQuery.data, globalSearch],
  );

  return (
    <PageShell title="Buyers">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create Buyer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </FormRow>
              <FormRow label="Country">
                <Input value={country} onChange={(event) => setCountry(event.target.value)} />
              </FormRow>
              <Button className="w-full" onClick={() => createBuyer.mutate()} disabled={createBuyer.isPending}>
                {createBuyer.isPending ? "Creating..." : "Save Buyer"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-8">
            <CardContent className="flex h-full items-center justify-between p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Buyer Registry</div>
                <div className="mt-3 text-3xl font-semibold">{filtered.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">Active buyer records in the current factory context</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Buyers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((buyer) => (
                  <TableRow
                    key={buyer.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedBuyer(buyer);
                      setEditForm({
                        name: buyer.name,
                        country: buyer.country ?? "",
                      });
                    }}
                  >
                    <TableCell>{buyer.name}</TableCell>
                    <TableCell>{buyer.country ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selectedBuyer)}
        onOpenChange={(open) => {
          if (!open) setSelectedBuyer(null);
        }}
        title={selectedBuyer?.name ?? "Buyer Detail"}
        description="Edit buyer details"
      >
        {selectedBuyer ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Buyer Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormRow label="Name">
                  <Input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </FormRow>
                <FormRow label="Country">
                  <Input
                    value={editForm.country}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, country: event.target.value }))
                    }
                  />
                </FormRow>
                <div className="flex gap-3">
                  <Button onClick={() => updateBuyer.mutate()} disabled={updateBuyer.isPending}>
                    Save Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteBuyer.mutate(selectedBuyer.id)}
                    disabled={deleteBuyer.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
