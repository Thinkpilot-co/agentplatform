"use client";

import { useQuery } from "@tanstack/react-query";

export function useInstance(id: string) {
  return useQuery({
    queryKey: ["instance", id],
    queryFn: async () => {
      const res = await fetch(`/api/instances/${id}`);
      if (!res.ok) throw new Error("Failed to fetch instance");
      return res.json();
    },
    refetchInterval: 10_000,
    enabled: !!id,
  });
}
