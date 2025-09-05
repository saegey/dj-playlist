export async function http<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  let data: unknown = null;

  // Try to parse JSON if present
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorObj =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {};
    const message =
      (errorObj.error as string) ||
      (errorObj.message as string) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
