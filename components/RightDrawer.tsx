"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function RightDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "fixed right-0 top-0 z-50 h-screen w-full max-w-2xl border-l border-white/10 bg-background/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
              className,
            )}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <div className="h-[calc(100vh-112px)] overflow-y-auto pr-2">{children}</div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
