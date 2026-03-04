"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function useApiQuery<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<T>(path)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message ?? "Failed to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, setData };
}
