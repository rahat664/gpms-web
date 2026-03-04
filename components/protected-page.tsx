"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isReady, pathname, router, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-sm text-muted-foreground backdrop-blur-xl">
          Checking session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
