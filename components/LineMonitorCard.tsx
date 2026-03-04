"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type LineMonitorCardProps = {
  lineName: string;
  targetQty: number;
  actualQty: number;
  wip: number;
  onClick: () => void;
};

export function LineMonitorCard({
  lineName,
  targetQty,
  actualQty,
  wip,
  onClick,
}: LineMonitorCardProps) {
  const efficiency = targetQty > 0 ? (actualQty / targetQty) * 100 : 0;
  const positive = actualQty >= targetQty;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      className="text-left"
      onClick={onClick}
      type="button"
    >
      <Card className="h-full border-white/10 bg-white/5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-all hover:border-primary/30 hover:shadow-[0_18px_60px_rgba(59,130,246,0.14)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Sewing line</div>
              <div className="mt-1 text-lg font-semibold">{lineName}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-xs">
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
              )}
              {efficiency.toFixed(1)}%
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="mt-1 font-medium">{targetQty}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Actual</div>
              <div className="mt-1 font-medium">{actualQty}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">WIP</div>
              <div className="mt-1 font-medium">{wip}</div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-sky-400/80"
              style={{ width: `${Math.min(efficiency, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Tap for hourly, bundle, and QC breakdown
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );
}
