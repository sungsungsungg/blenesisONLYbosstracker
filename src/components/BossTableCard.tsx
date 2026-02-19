import type { BossDef, BossTable } from '../types';
import { ChannelRow } from './ChannelRow';

type BossTableCardProps = {
  table: BossTable;
  boss: BossDef;
  now: number;
  onRemoveTable: (tableId: string) => void;
  onSetChannelsCount: (tableId: string, nextCount: number) => void;
  onKilled: (tableId: string, channelNumber: number) => void;
  onClear: (tableId: string, channelNumber: number) => void;
};

export function BossTableCard({
  table,
  boss,
  now,
  onRemoveTable,
  onSetChannelsCount,
  onKilled,
  onClear,
}: BossTableCardProps) {
  const rangeLabel = `${boss.minLabel} - ${boss.maxLabel}`;

  const handleChannelsChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const nextCount = Math.max(1, Math.min(50, Math.floor(value)));

    if (nextCount < table.channelsCount) {
      const ok = window.confirm(
        `Reduce channels from ${table.channelsCount} to ${nextCount}? Extra channels will be removed from the end.`
      );
      if (!ok) return;
    }

    onSetChannelsCount(table.id, nextCount);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>{table.bossName}</h3>
          <p className="muted">
            {boss.location} | Respawn range: {rangeLabel}
          </p>
        </div>
        <button className="btn-danger" onClick={() => onRemoveTable(table.id)}>
          Remove table
        </button>
      </div>

      <div className="settings-row">
        <label>
          Channels
          <input
            type="number"
            min={1}
            max={50}
            value={table.channelsCount}
            onChange={(event) => handleChannelsChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Status</th>
              <th>Earliest (Local)</th>
              <th>Latest (Local)</th>
              <th>Countdown</th>
              <th>Killed</th>
              <th>Clear</th>
            </tr>
          </thead>
          <tbody>
            {table.channels.map((channel) => (
              <ChannelRow
                key={channel.channel}
                channel={channel}
                now={now}
                onKilled={(channelNumber) => onKilled(table.id, channelNumber)}
                onClear={(channelNumber) => onClear(table.id, channelNumber)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
