"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  PackagePlus,
  PlayCircle,
  TimerReset,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/MetricCard";
import { LineMonitorCard } from "@/components/LineMonitorCard";
import { LineDetailDrawer } from "@/components/LineDetailDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormRow } from "@/components/form-row";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/SearchableSelect";
import { apiGet, apiPost } from "@/lib/api";
import { requirePositiveNumber, requireText } from "@/lib/form-validation";
import { useAppStore } from "@/lib/store";

type PlanActualRow = {
  lineId: string;
  lineName: string;
  targetQty: number;
  actualQty: number;
};

type LineStatusRow = {
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

type DashboardBundle = {
  planRows: PlanActualRow[];
  lineStatus: LineStatusRow[];
  qcSummary: QcSummary;
  lastUpdated: string;
};

type BundleOption = {
  id: string;
  bundleCode: string;
  size: string;
  status: string;
};

const dashboardKey = (date: string, factoryId: string | null) => [
  "dashboard",
  date,
  factoryId,
];

async function loadDashboard(date: string) {
  const [planRows, lineStatus, qcSummary] = await Promise.all([
    apiGet<PlanActualRow[]>("/reports/plan-vs-actual", { date }),
    apiGet<LineStatusRow[]>("/sewing/line-status", { date }),
    apiGet<QcSummary>("/qc/summary", { date }),
  ]);

  return {
    planRows,
    lineStatus,
    qcSummary,
    lastUpdated: new Date().toISOString(),
  } satisfies DashboardBundle;
}

export default function DashboardPage() {
  const router = useRouter();
  const selectedDate = useAppStore((state) => state.selectedDate);
  const factoryId = useAppStore((state) => state.factoryId);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [knownBundleIds, setKnownBundleIds] = useState<string[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [outputForm, setOutputForm] = useState({
    lineId: "",
    hourSlot: String(new Date().getHours()),
    qty: "",
    bundleId: "",
  });
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: dashboardKey(selectedDate, factoryId),
    queryFn: () => loadDashboard(selectedDate),
    refetchInterval: factoryId ? 10000 : false,
    enabled: Boolean(factoryId),
  });
  const bundleOptionsQuery = useQuery({
    queryKey: ["bundle-options"],
    queryFn: () => apiGet<BundleOption[]>("/cutting/bundles"),
    enabled: Boolean(factoryId),
  });

  const outputMutation = useMutation({
    mutationFn: async () => {
      const hourSlot = requirePositiveNumber(outputForm.hourSlot, "Hour Slot", 0);
      if (hourSlot > 23) throw new Error("Hour Slot must be between 0 and 23");
      return apiPost("/sewing/hourly-output", {
        lineId: requireText(outputForm.lineId, "Line"),
        date: selectedDate,
        hourSlot,
        qty: requirePositiveNumber(outputForm.qty, "Qty"),
        bundleId: outputForm.bundleId.trim() || undefined,
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKey(selectedDate, factoryId),
      });

      const previous = queryClient.getQueryData<DashboardBundle>(
        dashboardKey(selectedDate, factoryId),
      );

      if (previous && outputForm.lineId && outputForm.qty) {
        const optimistic = structuredClone(previous) as DashboardBundle;
        const line = optimistic.lineStatus.find(
          (item) => item.lineId === outputForm.lineId,
        );
        if (line) {
          const qty = Number(outputForm.qty);
          const hour = String(Number(outputForm.hourSlot));
          line.totalOutputToday += qty;
          line.hourlyBreakdown[hour] = (line.hourlyBreakdown[hour] ?? 0) + qty;
        }
        const planRow = optimistic.planRows.find(
          (item) => item.lineId === outputForm.lineId,
        );
        if (planRow) {
          planRow.actualQty += Number(outputForm.qty);
        }
        optimistic.lastUpdated = new Date().toISOString();
        queryClient.setQueryData(dashboardKey(selectedDate, factoryId), optimistic);
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          dashboardKey(selectedDate, factoryId),
          context.previous,
        );
      }
      const message =
        (_error as any)?.response?.data?.message ??
        (_error as Error)?.message ??
        "Unable to post hourly output";
      toast.error(message);
    },
    onSuccess: () => {
      if (outputForm.bundleId) {
        setKnownBundleIds((current) =>
          current.includes(outputForm.bundleId) ? current : [outputForm.bundleId, ...current],
        );
      }
      toast.success("Output posted");
      setOutputForm((current) => ({ ...current, qty: "", bundleId: "" }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKey(selectedDate, factoryId),
      });
    },
  });

  const dashboard = dashboardQuery.data;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const secondsSinceUpdate = useMemo(() => {
    if (!dashboard?.lastUpdated) return 0;
    const updatedAt = new Date(dashboard.lastUpdated).getTime();
    const diffSeconds = Math.floor((nowTs - updatedAt) / 1000);
    return diffSeconds > 0 ? diffSeconds : 0;
  }, [dashboard?.lastUpdated, nowTs]);

  const metrics = useMemo(() => {
    const planned = dashboard?.planRows.reduce((sum, row) => sum + row.targetQty, 0) ?? 0;
    const produced = dashboard?.planRows.reduce((sum, row) => sum + row.actualQty, 0) ?? 0;
    const wip =
      dashboard?.lineStatus.reduce(
        (sum, line) => sum + Object.values(line.wipCounts).reduce((a, b) => a + b, 0),
        0,
      ) ?? 0;
    const efficiency = planned > 0 ? (produced / planned) * 100 : 0;
    const defects = dashboard?.qcSummary.dhuEstimate ?? 0;

    return { planned, produced, wip, efficiency, defects };
  }, [dashboard]);

  const hourlySeries = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, index) => index + 8);
    return hours.map((hour) => ({
      hour: `${hour}:00`,
      output:
        dashboard?.lineStatus.reduce(
          (sum, line) => sum + (line.hourlyBreakdown[String(hour)] ?? 0),
          0,
        ) ?? 0,
    }));
  }, [dashboard]);

  const planActualSeries = useMemo(
    () =>
      (dashboard?.planRows ?? []).map((row) => ({
        name: row.lineName,
        plan: row.targetQty,
        actual: row.actualQty,
      })),
    [dashboard],
  );

  const defectSeries = dashboard?.qcSummary.topDefects.slice(0, 5) ?? [];
  const selectedLineSummary =
    selectedLineId && dashboard
      ? (() => {
          const line = dashboard.lineStatus.find((item) => item.lineId === selectedLineId);
          const plan = dashboard.planRows.find((item) => item.lineId === selectedLineId);
          if (!line) return null;
          return {
            lineId: line.lineId,
            lineName: line.lineName,
            targetQty: plan?.targetQty ?? 0,
            actualQty: line.totalOutputToday,
          };
        })()
      : null;

  return (
    <PageShell title="Dashboard">
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-8">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                  Live production orchestration
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  Production Command Center
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Premium operational visibility for today&apos;s sewing, QC, and flow execution.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button className="justify-start gap-2" onClick={() => router.push("/pos")}>
                  <PackagePlus className="h-4 w-4" />
                  Create PO
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => router.push("/sewing")}
                >
                  <PlayCircle className="h-4 w-4" />
                  Record Output
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => router.push("/qc")}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  QC Inspect
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Live Status Strip</div>
                  <div className="mt-2 text-lg font-medium">
                    {dashboard
                      ? new Date(dashboard.lastUpdated).toLocaleTimeString()
                      : "Waiting for data"}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Polling 10s
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Selected date</span>
                  <span className="font-medium text-foreground">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Seconds since update</span>
                  <span className="font-medium text-foreground">
                    {dashboard ? `${secondsSinceUpdate}s` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Factory context</span>
                  <span className="font-medium text-foreground">
                    {factoryId ? "Attached" : "Not selected"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {dashboardQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[24px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Planned Today"
              value={metrics.planned}
              hint="Targeted units"
              icon={<TimerReset className="h-5 w-5 text-primary" />}
            />
            <MetricCard
              label="Produced Today"
              value={metrics.produced}
              hint="Captured from line output"
              icon={<Activity className="h-5 w-5 text-primary" />}
            />
            <MetricCard
              label="Efficiency"
              value={metrics.efficiency}
              suffix="%"
              hint="Actual vs plan"
              icon={<PlayCircle className="h-5 w-5 text-primary" />}
            />
            <MetricCard
              label="WIP"
              value={metrics.wip}
              hint="Bundles in motion"
              icon={<PackagePlus className="h-5 w-5 text-primary" />}
            />
            <MetricCard
              label="Defect Rate"
              value={metrics.defects}
              suffix="%"
              hint="DHU estimate"
              icon={<AlertTriangle className="h-5 w-5 text-primary" />}
            />
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <CardHeader>
              <CardTitle>Quick Output Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormRow label="Line">
                <SearchableSelect
                  value={outputForm.lineId}
                  onChange={(value) =>
                    setOutputForm((current) => ({
                      ...current,
                      lineId: value,
                    }))
                  }
                  placeholder="Select line"
                  options={(dashboard?.lineStatus ?? []).map((line) => ({
                    value: line.lineId,
                    label: line.lineName,
                    keywords: line.lineId,
                  }))}
                />
              </FormRow>
              <div className="grid gap-4 md:grid-cols-2">
                <FormRow label="Hour Slot">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={outputForm.hourSlot}
                    onChange={(event) =>
                      setOutputForm((current) => ({
                        ...current,
                        hourSlot: event.target.value,
                      }))
                    }
                  />
                </FormRow>
                <FormRow label="Qty">
                  <Input
                    type="number"
                    min="1"
                    value={outputForm.qty}
                    onChange={(event) =>
                      setOutputForm((current) => ({
                        ...current,
                        qty: event.target.value,
                      }))
                    }
                  />
                </FormRow>
              </div>
              <FormRow label="Bundle ID">
                <SearchableSelect
                  value={outputForm.bundleId}
                  onChange={(value) =>
                    setOutputForm((current) => ({
                      ...current,
                      bundleId: value,
                    }))
                  }
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
              <Button
                className="w-full"
                disabled={!factoryId || outputMutation.isPending}
                onClick={() => outputMutation.mutate()}
              >
                {outputMutation.isPending ? "Posting..." : "Post Hourly Output"}
              </Button>
            </CardContent>
          </Card>
          <Card className="xl:col-span-4">
            <CardHeader>
              <CardTitle>Line Output by Hour</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
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
          <Card className="xl:col-span-4">
            <CardHeader>
              <CardTitle>Defects Top 5</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectSeries} layout="vertical">
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <YAxis
                    dataKey="defectType"
                    type="category"
                    width={100}
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                    {defectSeries.map((entry) => (
                      <Cell key={entry.defectType} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-6">
            <CardHeader>
              <CardTitle>Plan vs Actual per Line</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planActualSeries} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                    }}
                  />
                  <Bar dataKey="plan" radius={[0, 10, 10, 0]} fill="rgba(255,255,255,0.24)" />
                  <Bar dataKey="actual" radius={[0, 10, 10, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="xl:col-span-6">
            <CardHeader>
              <CardTitle>Line Monitor</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {(dashboard?.lineStatus ?? []).map((line) => {
                const plan = dashboard?.planRows.find((item) => item.lineId === line.lineId);
                const wip = Object.values(line.wipCounts).reduce((sum, count) => sum + count, 0);

                return (
                  <LineMonitorCard
                    key={line.lineId}
                    lineName={line.lineName}
                    targetQty={plan?.targetQty ?? 0}
                    actualQty={line.totalOutputToday}
                    wip={wip}
                    onClick={() => setSelectedLineId(line.lineId)}
                  />
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>

      <LineDetailDrawer
        open={Boolean(selectedLineSummary)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLineId(null);
          }
        }}
        date={selectedDate}
        summary={selectedLineSummary}
      />
    </PageShell>
  );
}
