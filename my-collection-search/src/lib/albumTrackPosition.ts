export type TrackPositionValue = string | number | null | undefined;

type ParsedTrackPosition = {
  raw: string;
  side: string;
  sideLabel: string | null;
  num: number;
  rest: string;
};

export function parseTrackPosition(position: TrackPositionValue): ParsedTrackPosition {
  const raw = String(position ?? "").trim();
  const match = raw.match(/^([A-Za-z]+)?\s*(\d+)?(.*)$/);

  if (!match) {
    return { raw, side: "", sideLabel: null, num: 0, rest: raw };
  }

  const side = (match[1] ?? "").toUpperCase();
  const num = match[2] ? Number.parseInt(match[2], 10) : 0;
  const rest = (match[3] ?? "").trim();

  return {
    raw,
    side,
    sideLabel: side ? `Side ${side}` : null,
    num,
    rest,
  };
}

export function compareTrackPositions(
  a: TrackPositionValue,
  b: TrackPositionValue
): number {
  const parsedA = parseTrackPosition(a);
  const parsedB = parseTrackPosition(b);

  if (parsedA.side !== parsedB.side) {
    if (!parsedA.side) return -1;
    if (!parsedB.side) return 1;
    return parsedA.side.localeCompare(parsedB.side);
  }

  if (parsedA.num !== parsedB.num) return parsedA.num - parsedB.num;
  if (parsedA.rest !== parsedB.rest) return parsedA.rest.localeCompare(parsedB.rest);
  return parsedA.raw.localeCompare(parsedB.raw);
}

export function getTrackSideLabel(position: TrackPositionValue): string | null {
  return parseTrackPosition(position).sideLabel;
}
