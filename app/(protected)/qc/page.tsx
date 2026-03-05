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
import { SearchableSelect } from "@/components/SearchableSelect";
import { apiGet, apiPost } from "@/lib/api";
import { requirePositiveNumber, requireText } from "@/lib/form-validation";
import { useAppStore } from "@/lib/store";

type QcSummary = {
  totalInspected: number;
  passRate: number;
  dhuEstimate: number;
  topDefects: Array<{ defectType: string; count: number }>;
};

type BundleOption = {
  id: string;
  bundleCode: string;
  size: string;
  status: string;
};

export default function QcPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const queryClient = useQueryClient();
  const [knownBundleIds, setKnownBundleIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    bundleId: "",
    type: "INLINE",
    pass: "true",
    notes: "",
    defectType: "",
    count: "",
  });
  const summaryQuery = useQuery({
    queryKey: ["qc-summary", selectedDate],
    queryFn: () => apiGet<QcSummary>("/qc/summary", { date: selectedDate }),
  });
  const bundleOptionsQuery = useQuery({
    queryKey: ["bundle-options"],
    queryFn: () => apiGet<BundleOption[]>("/cutting/bundles"),
  });

  const inspectMutation = useMutation({
    mutationFn: () => {
      const type = requireText(form.type, "Type");
      if (!["INLINE", "FINAL"].includes(type)) {
        throw new Error("Type must be INLINE or FINAL");
      }
      if (!["true", "false"].includes(form.pass)) {
        throw new Error("Pass must be true or false");
      }

      return apiPost("/qc/inspect", {
        bundleId: requireText(form.bundleId, "Bundle ID"),
        type,
        pass: form.pass === "true",
        notes: form.notes.trim() || undefined,
        defects: form.defectType
          ? [
              {
                defectType: requireText(form.defectType, "Defect Type"),
                count: requirePositiveNumber(form.count, "Count"),
              },
            ]
          : undefined,
      });
    },
    onSuccess: () => {
      if (form.bundleId) {
        setKnownBundleIds((current) =>
          current.includes(form.bundleId) ? current : [form.bundleId, ...current],
        );
      }
      setForm({
        bundleId: "",
        type: "INLINE",
        pass: "true",
        notes: "",
        defectType: "",
        count: "",
      });
      queryClient.invalidateQueries({ queryKey: ["qc-summary", selectedDate] });
      toast.success("Inspection submitted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to submit inspection");
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
                <SearchableSelect
                  value={form.bundleId}
                  onChange={(value) => setForm({ ...form, bundleId: value })}
                  placeholder="Select or type bundle ID"
                  allowCustom
                  options={[
                    ...(bundleOptionsQuery.data ?? []).map((bundle) => ({
                      value: bundle.id,
                      label: `${bundle.bundleCode} · ${bundle.size} · ${bundle.status}`,
                      keywords: `${bundle.id} ${bundle.bundleCode}`,
                    })),
                    ...knownBundleIds.map((bundleId) => ({
                      value: bundleId,
                      label: bundleId,
                      keywords: bundleId,
                    })),
                  ]}
                />
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
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
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
