"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormRow } from "@/components/form-row";
import { apiGet, apiPost } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type QcSummary = {
  totalInspected: number;
  passRate: number;
  dhuEstimate: number;
  topDefects: Array<{ defectType: string; count: number }>;
};

export default function QcPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    bundleId: "",
    type: "INLINE",
    pass: "true",
    notes: "",
    defectType: "",
    count: "",
  });
  const [date, setDate] = useState(selectedDate);

  const summaryQuery = useQuery({
    queryKey: ["qc-summary", date],
    queryFn: () => apiGet<QcSummary>("/qc/summary", { date }),
  });

  const inspectMutation = useMutation({
    mutationFn: () =>
      apiPost("/qc/inspect", {
        bundleId: form.bundleId,
        type: form.type,
        pass: form.pass === "true",
        notes: form.notes || undefined,
        defects: form.defectType
          ? [{ defectType: form.defectType, count: Number(form.count) }]
          : undefined,
      }),
    onSuccess: () => {
      setForm({
        bundleId: "",
        type: "INLINE",
        pass: "true",
        notes: "",
        defectType: "",
        count: "",
      });
      queryClient.invalidateQueries({ queryKey: ["qc-summary", date] });
      toast.success("Inspection submitted");
    },
  });

  return (
    <PageShell title="Quality Control">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Inspection Entry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Bundle ID">
                <Input value={form.bundleId} onChange={(e) => setForm({ ...form, bundleId: e.target.value })} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Type">
                  <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                </FormRow>
                <FormRow label="Pass">
                  <Input value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
                </FormRow>
              </div>
              <FormRow label="Notes">
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Defect Type">
                  <Input value={form.defectType} onChange={(e) => setForm({ ...form, defectType: e.target.value })} />
                </FormRow>
                <FormRow label="Count">
                  <Input value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} />
                </FormRow>
              </div>
              <Button className="w-full" onClick={() => inspectMutation.mutate()} disabled={inspectMutation.isPending}>
                {inspectMutation.isPending ? "Submitting..." : "Submit Inspection"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-8">
            <CardHeader><CardTitle>QC Summary</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormRow label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Total inspected</div>
                  <div className="mt-2 text-2xl font-semibold">{summaryQuery.data?.totalInspected ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">Pass rate</div>
                  <div className="mt-2 text-2xl font-semibold">{summaryQuery.data?.passRate.toFixed(1) ?? "0.0"}%</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-muted-foreground">DHU</div>
                  <div className="mt-2 text-2xl font-semibold">{summaryQuery.data?.dhuEstimate.toFixed(1) ?? "0.0"}%</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Defect</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summaryQuery.data?.topDefects ?? []).map((defect) => (
                    <TableRow key={defect.defectType}>
                      <TableCell>{defect.defectType}</TableCell>
                      <TableCell>{defect.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
