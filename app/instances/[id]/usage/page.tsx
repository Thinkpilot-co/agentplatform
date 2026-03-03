"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { UsageChart } from "@/components/monitoring/usage-chart";

export default function UsagePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header title="Usage" description="Token usage and cost estimates" />
      <div className="p-6">
        <UsageChart instanceId={id} />
      </div>
    </>
  );
}
