"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock3 } from "lucide-react";
import { RightDrawer } from "./RightDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { apiGet } from "@/lib/api";

export type LineStatusRow = {
  lineId: string;
  lineName: string;
  totalOutputToday: number;
  hourlyBreakdown: Record<string, number>;
  wipCounts: Record<string, number>;
};

type QcSummary = {
  totalInspected: number;
  passRate: number;
  dhuEstimate: number;
  topDefects: Array<{ defectType: string; count: number }>;
};

type DashboardLineSummary = {
  lineId: string;
  lineName: string;
  targetQty: number;
  actualQty: number;
};

async function loadLineDetail(date: string, lineId: string) {
  const [lineStatus, qcSummary] = await Promise.all([
    apiGet<LineStatusRow[]>("/sewing/line-status", { date }),
    apiGet<QcSummary>("/qc/summary", { date }),
  ]);

  return {
    line: lineStatus.find((item) => item.lineId === lineId) ?? null,
    qcSummary,
  };
}

export function LineDetailDrawer({
  open,
  onOpenChange,
  date,
  summary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  summary: DashboardLineSummary | null;
}) {
  const detailQuery = useQuery({
    queryKey: ["line-detail", date, summary?.lineId],
    queryFn: () => loadLineDetail(date, summary!.lineId),
    enabled: open && Boolean(summary?.lineId),
    refetchInterval: open ? 10000 : false,
  });

  const line = detailQuery.data?.line;
  const qcSummary = detailQuery.data?.qcSummary;
  const efficiency =
    summary && summary.targetQty > 0
      ? (summary.actualQty / summary.targetQty) * 100
      : 0;

  const hourlySeries = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 8;
    return {
      hour: `${hour}:00`,
      output: line?.hourlyBreakdown[String(hour)] ?? 0,
    };
  });

  const wipEntries = Object.entries(line?.wipCounts ?? {});
  const defects = qcSummary?.topDefects.slice(0, 5) ?? [];

  return (
    <RightDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={summary?.lineName ?? "Line Detail"}
      description="Hourly output, WIP mix, and QC signal"
    >
      {summary ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">Efficiency</div>
                <div className="mt-2 text-3xl font-semibold">
                  {efficiency.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">Target</div>
                <div className="mt-2 text-3xl font-semibold">{summary.targetQty}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-muted-foreground">Actual</div>
                <div className="mt-2 text-3xl font-semibold">{summary.actualQty}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                Hourly Output
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlySeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="hour" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                    }}
                  />
                  <Bar dataKey="output" radius={[10, 10, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WIP Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {wipEntries.length ? (
                wipEntries.map(([status, qty]) => (
                  <div
                    key={status}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{status}</span>{" "}
                    <span className="font-medium">{qty}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No WIP data available.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Top Defects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {defects.length ? (
                defects.map((defect) => (
                  <div
                    key={defect.defectType}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span>{defect.defectType}</span>
                    <span className="text-sm text-muted-foreground">{defect.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No line-level defects available. Showing overall QC when present.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </RightDrawer>
  );
}
