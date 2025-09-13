// Lightweight date formatting helpers
// Avoids external deps; keeps consistent display across app

/** Formats a timestamp or Date into 'MMM d, yyyy' (e.g., Jan 5, 2025) */
export function formatDate(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

/** Formats a timestamp into a short relative string like '2d ago' */
export function formatRelativeShort(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.round(Math.abs(diff) / 1000);
  const sign = diff >= 0 ? "ago" : "from now";
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years}y ${sign}`;
  if (months > 0) return `${months}mo ${sign}`;
  if (days > 0) return `${days}d ${sign}`;
  if (hrs > 0) return `${hrs}h ${sign}`;
  if (mins > 0) return `${mins}m ${sign}`;
  return `${sec}s ${sign}`;
}

/** Convenience: 'MMM d, yyyy • 2d ago' */
export function formatDateWithRelative(input: string | number | Date): string {
  const date = formatDate(input);
  const rel = formatRelativeShort(input);
  return rel ? `${date} • ${rel}` : date;
}
