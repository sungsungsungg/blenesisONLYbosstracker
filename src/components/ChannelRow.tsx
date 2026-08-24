import type { ChannelTimer } from '../types';
import { formatCountdown, formatTimestampLocal, getChannelStatus } from '../utils/time';

type ChannelRowProps = {
  channel: ChannelTimer;
  now: number;
  onKilled: (channelNumber: number) => void;
  onClear: (channelNumber: number) => void;
  use24Hour?: boolean;
};

export function ChannelRow({ channel, now, onKilled, onClear, use24Hour = true }: ChannelRowProps) {
  const status = getChannelStatus(now, channel.earliestRespawnAt, channel.latestRespawnAt);
  const exactRespawn =
    channel.earliestRespawnAt &&
    channel.latestRespawnAt &&
    channel.earliestRespawnAt === channel.latestRespawnAt;

  return (
    <tr className={`status-${status.toLowerCase()}`}>
      <td>CH {channel.channel}</td>
      <td>
        {status === 'UNKNOWN' && 'Unknown'}
        {status === 'NOT_YET' && 'Not yet'}
        {status === 'IN_WINDOW' && 'IN WINDOW'}
        {status === 'LATE' && 'Late'}
      </td>
      <td>{formatTimestampLocal(channel.earliestRespawnAt, use24Hour)}</td>
      <td>{formatTimestampLocal(channel.latestRespawnAt, use24Hour)}</td>
      <td>
        {!channel.earliestRespawnAt || !channel.latestRespawnAt
          ? '-'
          : exactRespawn
            ? `Exact: ${formatCountdown(channel.earliestRespawnAt, now)}`
            : `${formatCountdown(channel.earliestRespawnAt, now)} / ${formatCountdown(channel.latestRespawnAt, now)}`}
      </td>
      <td>
        <button className="btn-small" onClick={() => onKilled(channel.channel)}>
          Killed
        </button>
      </td>
      <td>
        <button className="btn-small btn-ghost" onClick={() => onClear(channel.channel)}>
          Clear
        </button>
      </td>
    </tr>
  );
}
