"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { SkillBrowser } from "@/components/skills/skill-browser";
import { useRpc } from "@/hooks/use-rpc";
import { Loader2 } from "lucide-react";
import type { SkillInfo } from "@/core/types";

export default function SkillsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useRpc<{ skills: SkillInfo[] }>(
    id,
    "skills.status",
    undefined,
    { refetchInterval: 15_000 }
  );

  const skills = data?.skills ?? [];

  return (
    <>
      <Header
        title="Skills"
        description="Browse and manage installed skills"
      />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : (
          <SkillBrowser instanceId={id} skills={skills} />
        )}
      </div>
    </>
  );
}
