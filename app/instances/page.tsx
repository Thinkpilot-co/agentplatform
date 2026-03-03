"use client";

import { Header } from "@/components/dashboard/header";
import { InstanceCard } from "@/components/dashboard/instance-card";
import { useInstances } from "@/hooks/use-instances";
import { Loader2, Server } from "lucide-react";
import Link from "next/link";

export default function InstancesPage() {
  const { data, isLoading } = useInstances();
  const instances = data?.instances ?? [];

  return (
    <>
      <Header
        title="Instances"
        description="Manage connections to OpenClaw gateway instances"
      />

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : instances.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
            <Server className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No instances configured yet
            </p>
            <Link
              href="/instances/add"
              className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline"
            >
              Add your first instance
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {instances.map(
              (inst: {
                id: string;
                name: string;
                url: string;
                status: "connected" | "connecting" | "disconnected" | "error";
                tags: string[];
                agentCount: number;
                serverVersion?: string;
                health?: { ok: boolean };
                lastConnected?: number;
              }) => (
                <InstanceCard key={inst.id} {...inst} />
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
