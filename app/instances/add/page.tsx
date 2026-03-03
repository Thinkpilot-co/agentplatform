"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { useAddInstance } from "@/hooks/use-instances";

export default function AddInstancePage() {
  const router = useRouter();
  const addInstance = useAddInstance();

  const [form, setForm] = useState({
    id: "",
    name: "",
    url: "ws://localhost:18789",
    token: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = form.id || form.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    await addInstance.mutateAsync({
      id,
      name: form.name,
      url: form.url,
      token: form.token || undefined,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim())
        : [],
    });

    router.push("/instances");
  };

  return (
    <>
      <Header
        title="Add Instance"
        description="Connect to an OpenClaw gateway instance"
      />

      <div className="flex-1 p-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-lg space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My OpenClaw Instance"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ID (optional)</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="auto-generated-from-name"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Gateway URL</label>
            <input
              type="text"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="ws://localhost:18789"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              WebSocket URL of the OpenClaw gateway (ws:// or wss://)
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Auth Token (optional)
            </label>
            <input
              type="password"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              placeholder="Gateway authentication token"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tags (optional)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="production, primary"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Comma-separated tags for organizing instances
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={addInstance.isPending}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {addInstance.isPending ? "Connecting..." : "Add Instance"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md bg-[var(--secondary)] px-4 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
          </div>

          {addInstance.isError && (
            <p className="text-sm text-red-400">
              {addInstance.error.message}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
