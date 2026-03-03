"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { SchemaForm } from "@/components/config/schema-form";

export default function ConfigPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header
        title="Configuration"
        description="View and edit instance configuration"
      />
      <div className="p-6">
        <SchemaForm instanceId={id} />
      </div>
    </>
  );
}
