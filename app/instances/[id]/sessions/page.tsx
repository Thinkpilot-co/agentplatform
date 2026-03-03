"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { SessionList } from "@/components/monitoring/session-list";

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header title="Sessions" description="Browse chat sessions" />
      <div className="p-6">
        <SessionList instanceId={id} />
      </div>
    </>
  );
}
