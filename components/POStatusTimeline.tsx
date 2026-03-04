"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["DRAFT", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "CLOSED"] as const;

export function POStatusTimeline({ status }: { status?: string }) {
  const currentIndex = steps.findIndex((step) => step === status);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const complete = currentIndex >= index;
        const current = status === step;

        return (
          <div key={step} className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold",
                  complete
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-white/10 bg-white/5 text-muted-foreground",
                )}
              >
                {complete && !current ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className={cn("text-sm font-medium", current ? "text-foreground" : "text-muted-foreground")}>
                  {step.replaceAll("_", " ")}
                </div>
              </div>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "hidden h-px w-10 md:block",
                  currentIndex > index ? "bg-primary/40" : "bg-white/10",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
