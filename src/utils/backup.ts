import type { BossTable, ChannelTimer } from '../types';
import { APP_TIME_ZONE } from './time';

export const BACKUP_PREFIX = 'BOSSTIMER_V1:';
export const BACKUP_VERSION = 1;
export const STORAGE_VERSION = 'boss-timer/v1';

const MIN_CHANNELS = 1;
const MAX_CHANNELS = 50;

type UnknownRecord = Record<string, unknown>;

export type ExportPayload = {
  version: number;
  storageVersion: string;
  exportedAt: number;
  timezone: string;
  tables: BossTable[];
};

export type ImportResult = {
  payload: ExportPayload;
  warnings: string[];
};

function clampChannelsCount(value: number): number {
  return Math.max(MIN_CHANNELS, Math.min(MAX_CHANNELS, Math.floor(value)));
}

function toEpoch(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodeBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function exportState(tables: BossTable[]): string {
  const payload: ExportPayload = {
    version: BACKUP_VERSION,
    storageVersion: STORAGE_VERSION,
    exportedAt: Date.now(),
    timezone: APP_TIME_ZONE,
    tables,
  };

  const json = JSON.stringify(payload);
  return `${BACKUP_PREFIX}${encodeBase64(json)}`;
}

function normalizeChannel(channel: unknown): ChannelTimer | null {
  if (!isObject(channel)) return null;
  const rawChannel = channel.channel;
  if (typeof rawChannel !== 'number' || !Number.isFinite(rawChannel)) return null;

  const channelNumber = Math.max(1, Math.floor(rawChannel));

  return {
    channel: channelNumber,
    killedAt: toEpoch(channel.killedAt),
    earliestRespawnAt: toEpoch(channel.earliestRespawnAt),
    latestRespawnAt: toEpoch(channel.latestRespawnAt),
  };
}

function normalizeTable(table: unknown, index: number, warnings: string[]): BossTable | null {
  if (!isObject(table)) {
    warnings.push(`Skipped table #${index + 1}: not an object.`);
    return null;
  }

  if (typeof table.bossName !== 'string' || table.bossName.trim().length === 0) {
    warnings.push(`Skipped table #${index + 1}: missing bossName.`);
    return null;
  }

  const parsedChannels = Array.isArray(table.channels)
    ? table.channels.map(normalizeChannel).filter((value): value is ChannelTimer => value !== null)
    : [];

  const deduped = new Map<number, ChannelTimer>();
  for (const channel of parsedChannels) {
    deduped.set(channel.channel, channel);
  }

  const uniqueChannels = Array.from(deduped.values()).sort((a, b) => a.channel - b.channel);
  const maxChannel = uniqueChannels.length === 0 ? 0 : uniqueChannels[uniqueChannels.length - 1].channel;

  let requestedCount = MIN_CHANNELS;
  if (typeof table.channelsCount === 'number' && Number.isFinite(table.channelsCount)) {
    requestedCount = Math.floor(table.channelsCount);
  } else if (maxChannel > 0) {
    requestedCount = maxChannel;
  }

  let channelsCount = clampChannelsCount(Math.max(requestedCount, maxChannel));

  if (typeof table.channelsCount === 'number' && Number.isFinite(table.channelsCount)) {
    const clampedOriginal = clampChannelsCount(table.channelsCount);
    if (clampedOriginal !== table.channelsCount) {
      warnings.push(`Table \"${table.bossName}\": channelsCount was clamped to ${clampedOriginal}.`);
    }
  }

  if (channelsCount !== uniqueChannels.length) {
    warnings.push(
      `Table \"${table.bossName}\": channels rebuilt (${uniqueChannels.length} -> ${channelsCount}) to match count.`
    );
  }

  const byChannel = new Map(uniqueChannels.map((channel) => [channel.channel, channel]));
  const channels: ChannelTimer[] = Array.from({ length: channelsCount }, (_, idx) => {
    const channelNumber = idx + 1;
    return byChannel.get(channelNumber) ?? { channel: channelNumber };
  });

  return {
    id: typeof table.id === 'string' && table.id.length > 0 ? table.id : `imported-${Date.now()}-${index}`,
    bossName: table.bossName,
    channelsCount,
    channels,
    createdAt: toEpoch(table.createdAt) ?? Date.now(),
  };
}

export function importState(input: string): ImportResult {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Invalid backup string');
  }

  let jsonText = trimmed;

  if (trimmed.startsWith(BACKUP_PREFIX)) {
    const encoded = trimmed.slice(BACKUP_PREFIX.length);
    try {
      jsonText = decodeBase64(encoded);
    } catch {
      throw new Error('Invalid backup string');
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid backup string');
  }

  if (!isObject(parsed)) {
    throw new Error('Invalid backup string');
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error('Unsupported backup version');
  }

  if (!Array.isArray(parsed.tables)) {
    throw new Error('Invalid backup string');
  }

  const warnings: string[] = [];
  if (parsed.timezone !== APP_TIME_ZONE) {
    warnings.push(`Backup timezone is \"${String(parsed.timezone)}\", expected \"${APP_TIME_ZONE}\".`);
  }

  const tables = parsed.tables
    .map((table, index) => normalizeTable(table, index, warnings))
    .filter((table): table is BossTable => table !== null);

  const payload: ExportPayload = {
    version: BACKUP_VERSION,
    storageVersion:
      typeof parsed.storageVersion === 'string' && parsed.storageVersion.length > 0
        ? parsed.storageVersion
        : STORAGE_VERSION,
    exportedAt: toEpoch(parsed.exportedAt) ?? Date.now(),
    timezone: typeof parsed.timezone === 'string' ? parsed.timezone : APP_TIME_ZONE,
    tables,
  };

  return { payload, warnings };
}
