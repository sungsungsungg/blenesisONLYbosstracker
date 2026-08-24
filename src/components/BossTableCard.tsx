import type { BossDef, BossTable } from '../types';
import { ChannelRow } from './ChannelRow';

type BossTableCardProps = {
  table: BossTable;
  boss: BossDef;
  now: number;
  onRemoveTable: (tableId: string) => void;
  onKilled: (tableId: string, channelNumber: number) => void;
  onClear: (tableId: string, channelNumber: number) => void;
  use24Hour?: boolean;
};

export function BossTableCard({
  table,
  boss,
  now,
  onRemoveTable,
  onKilled,
  onClear,
  use24Hour = true,
}: BossTableCardProps) {
  const rangeLabel = `${boss.minLabel} - ${boss.maxLabel}`;

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
                use24Hour={use24Hour}
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
