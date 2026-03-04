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
import { useAppStore } from "@/lib/store";

type LineStatus = {
  lineId: string;
  lineName: string;
  totalOutputToday: number;
  hourlyBreakdown: Record<string, number>;
  wipCounts: Record<string, number>;
};

export default function SewingPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const queryClient = useQueryClient();
  const [selectedLine, setSelectedLine] = useState<LineStatus | null>(null);
  const [form, setForm] = useState({
    lineId: "",
    date: selectedDate,
    hourSlot: "",
    qty: "",
    bundleId: "",
  });

  const statusQuery = useQuery({
    queryKey: ["line-status", form.date || selectedDate],
    queryFn: () => apiGet<LineStatus[]>("/sewing/line-status", { date: form.date || selectedDate }),
    refetchInterval: 10000,
  });

  const postOutput = useMutation({
    mutationFn: () =>
      apiPost("/sewing/hourly-output", {
        ...form,
        date: form.date || selectedDate,
        hourSlot: Number(form.hourSlot),
        qty: Number(form.qty),
        bundleId: form.bundleId || undefined,
      }),
    onSuccess: () => {
      setForm((current) => ({ ...current, qty: "", bundleId: "" }));
      queryClient.invalidateQueries({ queryKey: ["line-status", form.date || selectedDate] });
      toast.success("Output submitted");
    },
  });

  return (
    <PageShell title="Sewing">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader><CardTitle>Hourly Output Entry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Line ID">
                <SearchableSelect
                  value={form.lineId}
                  onChange={(value) => setForm({ ...form, lineId: value })}
                  placeholder="Select sewing line"
                  options={(statusQuery.data ?? []).map((line) => ({
                    value: line.lineId,
                    label: line.lineName,
                    keywords: line.lineId,
                  }))}
                />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Date">
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </FormRow>
                <FormRow label="Hour Slot">
                  <Input value={form.hourSlot} onChange={(e) => setForm({ ...form, hourSlot: e.target.value })} />
                </FormRow>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Qty">
                  <Input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                </FormRow>
                <FormRow label="Bundle ID">
                  <Input value={form.bundleId} onChange={(e) => setForm({ ...form, bundleId: e.target.value })} />
                </FormRow>
              </div>
              <Button className="w-full" onClick={() => postOutput.mutate()} disabled={postOutput.isPending}>
                {postOutput.isPending ? "Submitting..." : "Submit Output"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-8">
            <CardHeader><CardTitle>Live Line Status</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead>Total Output</TableHead>
                    <TableHead>Hourly</TableHead>
                    <TableHead>WIP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(statusQuery.data ?? []).map((line) => (
                    <TableRow key={line.lineId} onClick={() => setSelectedLine(line)} className="cursor-pointer">
                      <TableCell>{line.lineName}</TableCell>
                      <TableCell>{line.totalOutputToday}</TableCell>
                      <TableCell>{Object.entries(line.hourlyBreakdown).map(([hour, qty]) => `${hour}:${qty}`).join(", ") || "-"}</TableCell>
                      <TableCell>{Object.entries(line.wipCounts).map(([statusKey, qty]) => `${statusKey}:${qty}`).join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <RightDrawer
        open={Boolean(selectedLine)}
        onOpenChange={(open) => {
          if (!open) setSelectedLine(null);
        }}
        title={selectedLine?.lineName ?? "Line Detail"}
        description="Hourly and WIP drill-down"
      >
        {selectedLine ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Hourly Output</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(selectedLine.hourlyBreakdown).map(([hour, qty]) => (
                  <div key={hour} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span>{hour}:00</span>
                    <span className="font-medium">{qty}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>WIP State</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(selectedLine.wipCounts).map(([status, qty]) => (
                  <div key={status} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span>{status}</span>
                    <span className="font-medium">{qty}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </RightDrawer>
    </PageShell>
  );
}
