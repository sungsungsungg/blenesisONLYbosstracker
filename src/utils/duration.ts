const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

export function parseDurationToMs(input: string): number {
  const normalized = input.trim().toLowerCase();
  const hoursMatch = normalized.match(/(\d+)\s*h/);
  const minutesMatch = normalized.match(/(\d+)\s*m/);

  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

  return hours * HOUR_MS + minutes * MINUTE_MS;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}h ` : '';
  const mm = `${String(minutes).padStart(2, '0')}m `;
  const ss = `${String(seconds).padStart(2, '0')}s`;

  return `${hh}${mm}${ss}`.trim();
}
