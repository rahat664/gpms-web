"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";

function useCountUp(value: number) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 700;

    const frame = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [value]);

  return display;
}

export function MetricCard({
  label,
  value,
  suffix,
  hint,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  const display = useCountUp(value);

  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">
                {suffix === "%"
                  ? `${display.toFixed(1)}${suffix}`
                  : `${Math.round(display).toLocaleString()}${suffix ?? ""}`}
              </div>
              {hint ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  {hint}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
