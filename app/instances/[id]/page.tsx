"use client";

import { useParams } from "next/navigation";
import { useInstance } from "@/hooks/use-instance";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Header } from "@/components/dashboard/header";
import { Loader2, Users, Radio, Heart, Server } from "lucide-react";
import { formatUptime, timeAgo } from "@/lib/utils";

export default function InstanceOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useInstance(id);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  const agents = data.agents ?? [];
  const channels = data.channels ?? [];

  return (
    <>
      <Header title={data.name} description={data.url} />

      <div className="space-y-6 p-6">
        {/* Status cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Heart}
            label="Health"
            value={
              <StatusBadge
                status={
                  data.status === "connected"
                    ? data.health?.ok !== false
                      ? "healthy"
                      : "unhealthy"
                    : data.status
                }
              />
            }
          />
          <StatCard
            icon={Users}
            label="Agents"
            value={<span className="text-xl font-semibold">{agents.length}</span>}
          />
          <StatCard
            icon={Radio}
            label="Channels"
            value={
              <span className="text-xl font-semibold">{channels.length}</span>
            }
          />
          <StatCard
            icon={Server}
            label="Version"
            value={
              <span className="text-sm font-mono">
                {data.serverVersion ?? "N/A"}
              </span>
            }
          />
        </div>

        {/* Agents summary */}
        {agents.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium">Agents</h3>
            <div className="rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Model</th>
                    <th className="px-4 py-2">Skills</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(
                    (agent: {
                      key: string;
                      name: string;
                      emoji?: string;
                      model?: string;
                      skills?: string[];
                      enabled?: boolean;
                    }) => (
                      <tr
                        key={agent.key}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-2">
                          {agent.emoji && (
                            <span className="mr-1">{agent.emoji}</span>
                          )}
                          {agent.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                          {agent.model ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                          {agent.skills?.length ?? 0}
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge
                            status={
                              agent.enabled === false
                                ? "disconnected"
                                : "connected"
                            }
                            label={
                              agent.enabled === false ? "disabled" : "active"
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Channels summary */}
        {channels.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium">Channels</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map(
                (ch: {
                  id: string;
                  type: string;
                  name?: string;
                  connected: boolean;
                }) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {ch.name || ch.id}
                      </span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                        {ch.type}
                      </span>
                    </div>
                    <StatusBadge
                      status={ch.connected ? "connected" : "disconnected"}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Connection info */}
        <section>
          <h3 className="mb-2 text-sm font-medium">Connection Info</h3>
          <div className="rounded-lg border border-[var(--border)] p-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Status" value={data.status} />
              <InfoRow label="URL" value={data.url} mono />
              {data.lastConnected && (
                <InfoRow
                  label="Last Connected"
                  value={timeAgo(data.lastConnected)}
                />
              )}
              {data.health?.uptime && (
                <InfoRow
                  label="Uptime"
                  value={formatUptime(data.health.uptime)}
                />
              )}
              {data.error && <InfoRow label="Error" value={data.error} />}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <p className={mono ? "font-mono text-xs" : ""}>{value}</p>
    </div>
  );
}
