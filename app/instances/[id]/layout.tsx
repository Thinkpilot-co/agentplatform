"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Radio,
  Puzzle,
  GitBranch,
  ScrollText,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { segment: "", label: "Overview", icon: LayoutDashboard },
  { segment: "/agents", label: "Agents", icon: Users },
  { segment: "/channels", label: "Channels", icon: Radio },
  { segment: "/skills", label: "Skills", icon: Puzzle },
  { segment: "/swarm", label: "Swarm", icon: GitBranch },
  { segment: "/logs", label: "Logs", icon: ScrollText },
  { segment: "/sessions", label: "Sessions", icon: MessageSquare },
  { segment: "/config", label: "Config", icon: Settings },
  { segment: "/usage", label: "Usage", icon: BarChart3 },
];

export default function InstanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/instances/${id}`;

  return (
    <div className="flex flex-1 flex-col">
      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--card)] px-4">
        {tabs.map((tab) => {
          const href = `${base}${tab.segment}`;
          const active =
            tab.segment === ""
              ? pathname === base
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
                active
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
