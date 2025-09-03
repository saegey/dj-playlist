export async function streamLines(
  url: string,
  options: RequestInit = {},
  onLine: (line: string) => void
): Promise<void> {
  const res = await fetch(url, { ...options });
  if (!res.body) throw new Error("No response body for streaming");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) if (line.trim()) onLine(line);
  }
  if (buffer.trim()) onLine(buffer);
}