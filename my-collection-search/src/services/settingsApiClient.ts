// src/services/settingsApiClient.ts

export async function streamApiResponse(url: string, options?: RequestInit, onLine?: (line: string) => void): Promise<void> {
  const res = await fetch(url, options);
  if (!res.body) throw new Error("No response body for streaming");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line && onLine) onLine(line);
      }
    }
    done = streamDone;
  }
  if (buffer && onLine) onLine(buffer);
}

export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error((await res.json()).error || "Unknown error");
  return res.json();
}

export async function apiPost<T = unknown>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error || "Unknown error");
  return res.json();
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error || "Unknown error");
  return res.json();
}
