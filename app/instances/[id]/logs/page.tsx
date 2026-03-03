"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { LogViewer } from "@/components/monitoring/log-viewer";

export default function LogsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header title="Logs" description="Real-time application logs" />
      <div className="p-6">
        <LogViewer instanceId={id} />
      </div>
    </>
  );
}
