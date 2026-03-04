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

type PlanDetail = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  lines: Array<{
    id: string;
    line?: { name: string } | null;
    po?: { poNo: string } | null;
    poItem?: { style?: { styleNo: string } | null } | null;
    targets: Array<{ date: string; targetQty: number }>;
  }>;
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState("");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assign, setAssign] = useState({
    poId: "",
    poItemId: "",
    lineId: "",
    startDate: "",
    endDate: "",
    date: "",
    targetQty: "",
  });
  const [selectedPoId, setSelectedPoId] = useState("");

  const poQuery = useQuery({
    queryKey: ["pos-for-plans"],
    queryFn: () =>
      apiGet<Array<{ id: string; poNo: string; buyer?: { name: string } | null }>>("/pos"),
  });
  const poDetailQuery = useQuery({
    queryKey: ["po-items-for-plans", selectedPoId],
    queryFn: () =>
      apiGet<{
        items: Array<{ id: string; color: string; quantity: number; style?: { styleNo: string } | null }>;
      }>(`/pos/${selectedPoId}`),
    enabled: Boolean(selectedPoId),
  });
  const lineQuery = useQuery({
    queryKey: ["line-lookup", assign.date || startDate || new Date().toISOString().slice(0, 10)],
    queryFn: () =>
      apiGet<Array<{ lineId: string; lineName: string }>>("/sewing/line-status", {
        date: assign.date || startDate || new Date().toISOString().slice(0, 10),
      }),
  });

  const planQuery = useQuery({
    queryKey: ["plan-detail", planId],
    queryFn: () => apiGet<PlanDetail>(`/plans/${planId}`),
    enabled: Boolean(planId),
  });

  const createPlan = useMutation({
    mutationFn: () => apiPost<PlanDetail>("/plans", { name, startDate, endDate }),
    onSuccess: (response) => {
      setPlanId(response.id);
      queryClient.invalidateQueries({ queryKey: ["plan-detail", response.id] });
      toast.success("Plan created");
    },
  });

  const assignPlan = useMutation({
    mutationFn: () =>
      apiPost(`/plans/${planId}/assign`, {
        ...assign,
        dailyTargets: [{ date: assign.date, targetQty: Number(assign.targetQty) }],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-detail", planId] });
      toast.success("Plan line assigned");
    },
  });

  return (
    <PageShell title="Production Plans">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Create Plan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Start Date">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </FormRow>
                <FormRow label="End Date">
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </FormRow>
              </div>
              <Button className="w-full" onClick={() => createPlan.mutate()} disabled={createPlan.isPending}>
                {createPlan.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Assign Line</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormRow label="Plan ID">
                <Input value={planId} onChange={(e) => setPlanId(e.target.value)} />
              </FormRow>
              <FormRow label="PO ID">
                <SearchableSelect
                  value={assign.poId}
                  onChange={(value) => {
                    setSelectedPoId(value);
                    setAssign({ ...assign, poId: value, poItemId: "" });
                  }}
                  placeholder="Select PO"
                  options={(poQuery.data ?? []).map((po) => ({
                    value: po.id,
                    label: `${po.poNo} · ${po.buyer?.name ?? "No buyer"}`,
                    keywords: po.id,
                  }))}
                />
              </FormRow>
              <FormRow label="PO Item ID">
                <SearchableSelect
                  value={assign.poItemId}
                  onChange={(value) => setAssign({ ...assign, poItemId: value })}
                  placeholder="Select PO item"
                  options={(poDetailQuery.data?.items ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.style?.styleNo ?? "Unknown style"} · ${item.color} · ${item.quantity}`,
                    keywords: item.id,
                  }))}
                />
              </FormRow>
              <FormRow label="Line ID">
                <SearchableSelect
                  value={assign.lineId}
                  onChange={(value) => setAssign({ ...assign, lineId: value })}
                  placeholder="Select sewing line"
                  options={(lineQuery.data ?? []).map((line) => ({
                    value: line.lineId,
                    label: line.lineName,
                    keywords: line.lineId,
                  }))}
                />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Start Date">
                  <Input type="date" value={assign.startDate} onChange={(e) => setAssign({ ...assign, startDate: e.target.value })} />
                </FormRow>
                <FormRow label="End Date">
                  <Input type="date" value={assign.endDate} onChange={(e) => setAssign({ ...assign, endDate: e.target.value })} />
                </FormRow>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Target Date">
                  <Input type="date" value={assign.date} onChange={(e) => setAssign({ ...assign, date: e.target.value })} />
                </FormRow>
                <FormRow label="Target Qty">
                  <Input value={assign.targetQty} onChange={(e) => setAssign({ ...assign, targetQty: e.target.value })} />
                </FormRow>
              </div>
              <Button className="w-full" variant="outline" onClick={() => assignPlan.mutate()} disabled={assignPlan.isPending || !planId}>
                {assignPlan.isPending ? "Assigning..." : "Assign"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Scheduled Lines</div>
              <div className="mt-3 text-3xl font-semibold">{planQuery.data?.lines.length ?? 0}</div>
              <div className="mt-2 text-sm text-muted-foreground">Open line assignments and targets in the detail drawer</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Plan Detail</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Targets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(planQuery.data?.lines ?? []).map((line) => (
                  <TableRow key={line.id} className="cursor-pointer" onClick={() => setSelectedLineId(line.id)}>
                    <TableCell>{line.line?.name ?? "-"}</TableCell>
                    <TableCell>{line.po?.poNo ?? "-"}</TableCell>
                    <TableCell>{line.poItem?.style?.styleNo ?? "-"}</TableCell>
                    <TableCell>
                      {line.targets.map((target) => `${String(target.date).slice(0, 10)}:${target.targetQty}`).join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RightDrawer
        open={Boolean(selectedLineId)}
        onOpenChange={(open) => {
          if (!open) setSelectedLineId(null);
        }}
        title={planQuery.data?.name ?? "Plan Snapshot"}
        description="Production line assignments"
      >
        {planQuery.data?.lines
          .filter((line) => line.id === selectedLineId)
          .map((line) => (
            <div key={line.id} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-muted-foreground">Line</div>
                    <div className="mt-2 font-medium">{line.line?.name ?? "-"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-muted-foreground">PO</div>
                    <div className="mt-2 font-medium">{line.po?.poNo ?? "-"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-muted-foreground">Style</div>
                    <div className="mt-2 font-medium">{line.poItem?.style?.styleNo ?? "-"}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Targets</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {line.targets.map((target) => (
                    <div key={`${line.id}-${target.date}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span>{String(target.date).slice(0, 10)}</span>
                      <span className="font-medium">{target.targetQty}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
      </RightDrawer>
    </PageShell>
  );
}
