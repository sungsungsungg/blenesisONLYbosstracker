export type BossDef = {
  name: string;
  minMs: number;
  maxMs: number;
  minLabel: string;
  maxLabel: string;
  location: string;
  locationGroup: string;
};

export type ChannelTimer = {
  channel: number;
  killedAt?: number;
  earliestRespawnAt?: number;
  latestRespawnAt?: number;
};

export type BossTable = {
  id: string;
  bossName: string;
  channelsCount: number;
  channels: ChannelTimer[];
  createdAt: number;
};
