import { useEffect, useMemo, useState } from 'react';
import { ALL_LOCATIONS, BOSSES, BOSS_BY_NAME, LOCATION_GROUPS } from './data/bosses';
import { CreateTableForm } from './components/CreateTableForm';
import { BossTableCard } from './components/BossTableCard';
import { BackupPanel } from './components/BackupPanel';
import { useNow } from './hooks/useNow';
import type { BossTable, ChannelTimer } from './types';
import { APP_TIME_ZONE } from './utils/time';

const STORAGE_KEY = 'boss-timer/v1';
const ALL_GROUPS = 'ALL_GROUPS';
const ALL_LOCATIONS_VALUE = 'ALL_LOCATIONS';

type StoredState = {
  tables: BossTable[];
};

function makeChannels(count: number): ChannelTimer[] {
  return Array.from({ length: count }, (_, index) => ({
    channel: index + 1,
  }));
}

function makeTableId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTables(): BossTable[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || !Array.isArray(parsed.tables)) return [];
    return parsed.tables;
  } catch {
    return [];
  }
}

export default function App() {
  const [tables, setTables] = useState<BossTable[]>(() => loadTables());
  const [tableSearch, setTableSearch] = useState('');
  const [tableLocationGroup, setTableLocationGroup] = useState(ALL_GROUPS);
  const [tableLocation, setTableLocation] = useState(ALL_LOCATIONS_VALUE);
  const now = useNow(1000);

  useEffect(() => {
    const payload: StoredState = { tables };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tables]);

  const addTable = (bossName: string, channelsCount: number) => {
    const table: BossTable = {
      id: makeTableId(),
      bossName,
      channelsCount,
      channels: makeChannels(channelsCount),
      createdAt: Date.now(),
    };

    setTables((prev) => [table, ...prev]);
  };

  const removeTable = (tableId: string) => {
    setTables((prev) => prev.filter((table) => table.id !== tableId));
  };

  const setChannelsCount = (tableId: string, nextCount: number) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;

        const nextChannels =
          nextCount > table.channelsCount
            ? [
                ...table.channels,
                ...Array.from({ length: nextCount - table.channelsCount }, (_, idx) => ({
                  channel: table.channelsCount + idx + 1,
                })),
              ]
            : table.channels.slice(0, nextCount);

        return {
          ...table,
          channelsCount: nextCount,
          channels: nextChannels,
        };
      })
    );
  };

  const markKilled = (tableId: string, channelNumber: number) => {
    const killedAt = Date.now();

    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;

        const boss = BOSS_BY_NAME.get(table.bossName);
        if (!boss) return table;

        return {
          ...table,
          channels: table.channels.map((channel) => {
            if (channel.channel !== channelNumber) return channel;

            return {
              ...channel,
              killedAt,
              earliestRespawnAt: killedAt + boss.minMs,
              latestRespawnAt: killedAt + boss.maxMs,
            };
          }),
        };
      })
    );
  };

  const clearChannel = (tableId: string, channelNumber: number) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;

        return {
          ...table,
          channels: table.channels.map((channel) =>
            channel.channel === channelNumber ? { channel: channelNumber } : channel
          ),
        };
      })
    );
  };

  const replaceTables = (nextTables: BossTable[]) => {
    setTables(nextTables);
  };

  const tableViews = useMemo(() => {
    return tables
      .map((table) => {
        const boss = BOSSES.find((value) => value.name === table.bossName);
        if (!boss) return null;
        return { table, boss };
      })
      .filter((item) => {
        if (!item) return false;
        const term = tableSearch.trim().toLowerCase();
        const matchesSearch =
          term.length === 0 ||
          item.boss.name.toLowerCase().includes(term) ||
          item.boss.location.toLowerCase().includes(term);
        const matchesGroup =
          tableLocationGroup === ALL_GROUPS || item.boss.locationGroup === tableLocationGroup;
        const matchesLocation =
          tableLocation === ALL_LOCATIONS_VALUE || item.boss.location === tableLocation;
        return matchesSearch && matchesGroup && matchesLocation;
      })
      .filter((item): item is { table: BossTable; boss: (typeof BOSSES)[number] } => item !== null);
  }, [tables, tableSearch, tableLocation, tableLocationGroup]);

  const visibleLocations = useMemo(() => {
    if (tableLocationGroup === ALL_GROUPS) return ALL_LOCATIONS;
    const group = LOCATION_GROUPS.find((item) => item.label === tableLocationGroup);
    if (!group) return ALL_LOCATIONS;
    return group.locations;
  }, [tableLocationGroup]);

  useEffect(() => {
    if (tableLocation !== ALL_LOCATIONS_VALUE && !visibleLocations.includes(tableLocation)) {
      setTableLocation(ALL_LOCATIONS_VALUE);
    }
  }, [tableLocation, visibleLocations]);

  return (
    <div className="app">
      <header>
        <h1>Boss Timer Tracker</h1>
        <p className="muted">All timestamps are displayed in your local timezone ({APP_TIME_ZONE}).</p>
      </header>

      <BackupPanel tables={tables} onReplaceTables={replaceTables} />

      <CreateTableForm onAddTable={addTable} />

      <section className="panel">
        <h2>Search Existing Tables</h2>
        <div className="create-form">
          <label>
            Search Boss / Location
            <input
              type="text"
              value={tableSearch}
              placeholder="Type boss or location"
              onChange={(event) => setTableSearch(event.target.value)}
            />
          </label>

          <label>
            Location Group
            <select
              value={tableLocationGroup}
              onChange={(event) => setTableLocationGroup(event.target.value)}
            >
              <option value={ALL_GROUPS}>All groups</option>
              {LOCATION_GROUPS.map((group) => (
                <option key={group.id} value={group.label}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Location
            <select value={tableLocation} onChange={(event) => setTableLocation(event.target.value)}>
              <option value={ALL_LOCATIONS_VALUE}>All locations</option>
              {visibleLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <main className="tables">
        {tableViews.length === 0 ? (
          <section className="panel muted">No tables yet. Create one above.</section>
        ) : (
          tableViews.map(({ table, boss }) => (
            <BossTableCard
              key={table.id}
              table={table}
              boss={boss}
              now={now}
              onRemoveTable={removeTable}
              onSetChannelsCount={setChannelsCount}
              onKilled={markKilled}
              onClear={clearChannel}
            />
          ))
        )}
      </main>
    </div>
  );
}
