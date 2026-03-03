"use client";

import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import type { ChannelInfo } from "@/core/types";

export function useChannels(instanceId: string) {
  return useQuery({
    queryKey: ["rpc", instanceId, "channels.status"],
    queryFn: () =>
      rpc<{ channels: ChannelInfo[] }>(instanceId, "channels.status"),
    enabled: !!instanceId,
    refetchInterval: 15_000,
  });
}
