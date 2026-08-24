import { formatDurationMs } from './duration';

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const APP_TIME_ZONE = getUserTimeZone();
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(timeZone: string, use24Hour: boolean): Intl.DateTimeFormat {
  const key = `${timeZone}|${use24Hour ? '24' : '12'}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
    timeZoneName: 'short',
  });
  formatterCache.set(key, formatter);
  return formatter;
}

export function formatTimestampLocal(ms?: number, use24Hour = true): string {
  if (!ms) return '-';
  return getDateTimeFormatter(APP_TIME_ZONE, use24Hour).format(new Date(ms));
}

export function formatCountdown(targetMs?: number, nowMs = Date.now()): string {
  if (!targetMs) return '-';
  const diff = targetMs - nowMs;
  if (diff <= 0) return '00m 00s';
  return formatDurationMs(diff);
}

export type ChannelStatus = 'UNKNOWN' | 'NOT_YET' | 'IN_WINDOW' | 'LATE';

export function getChannelStatus(
  nowMs: number,
  earliestRespawnAt?: number,
  latestRespawnAt?: number,
): ChannelStatus {
  if (!earliestRespawnAt || !latestRespawnAt) return 'UNKNOWN';
  if (nowMs < earliestRespawnAt) return 'NOT_YET';
  if (nowMs > latestRespawnAt) return 'LATE';
  return 'IN_WINDOW';
}
