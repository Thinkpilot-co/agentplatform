/** Client-side helper to call RPC methods on an instance via the API proxy */

export async function rpc<T = unknown>(
  instanceId: string,
  method: string,
  params?: unknown
): Promise<T> {
  const res = await fetch(`/api/instances/${instanceId}/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `RPC failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchInstances() {
  const res = await fetch("/api/instances");
  if (!res.ok) throw new Error("Failed to fetch instances");
  return res.json();
}

export async function addInstance(data: {
  id: string;
  name: string;
  url: string;
  token?: string;
  tags?: string[];
}) {
  const res = await fetch("/api/instances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to add instance");
  }
  return res.json();
}

export async function removeInstance(id: string) {
  const res = await fetch(`/api/instances/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove instance");
  return res.json();
}

export async function fetchDockerContainers() {
  const res = await fetch("/api/docker");
  if (!res.ok) throw new Error("Failed to fetch containers");
  return res.json();
}

export async function dockerAction(
  containerId: string,
  action: "start" | "stop" | "restart"
) {
  const res = await fetch(`/api/docker/${containerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Docker action failed");
  }
  return res.json();
}
