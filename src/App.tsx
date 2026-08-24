import { useEffect, useMemo, useState } from 'react';
import { ALL_LOCATIONS, BOSSES, BOSS_BY_NAME, LOCATION_GROUPS } from './data/bosses';
import { CreateTableForm } from './components/CreateTableForm';
import { BossTableCard } from './components/BossTableCard';
import { BackupPanel } from './components/BackupPanel';
import { useNow } from './hooks/useNow';
import type { BossDef, BossTable, ChannelTimer } from './types';
import { APP_TIME_ZONE, getChannelStatus } from './utils/time';

const STORAGE_KEY = 'boss-timer/v1';
const ALL_GROUPS = 'ALL_GROUPS';
const ALL_LOCATIONS_VALUE = 'ALL_LOCATIONS';
const DEFAULT_GLOBAL_CHANNELS = 10;

type StoredState = {
  tables: BossTable[];
};

function createTimedChannel(channel: number, boss: BossDef, baseMs: number): ChannelTimer {
  return {
    channel,
    killedAt: baseMs,
    earliestRespawnAt: baseMs + boss.minMs,
    latestRespawnAt: baseMs + boss.maxMs,
  };
}

function createEmptyChannel(channel: number): ChannelTimer {
  return { channel };
}

function makeChannels(count: number): ChannelTimer[] {
  return Array.from({ length: count }, (_, index) => createEmptyChannel(index + 1));
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
  const [onlySpawnAvailable, setOnlySpawnAvailable] = useState(false);
  const [isGlobalControlsExpanded, setIsGlobalControlsExpanded] = useState(true);
  const [globalChannelsCount, setGlobalChannelsCount] = useState<number>(() => {
    const loaded = loadTables();
    return loaded[0]?.channelsCount ?? DEFAULT_GLOBAL_CHANNELS;
  });
  const now = useNow(1000);

  useEffect(() => {
    const payload: StoredState = { tables };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tables]);

  const addTable = (bossName: string) => {
    const exists = tables.some((table) => table.bossName === bossName);
    if (exists) {
      window.alert(`${bossName} table already exists.`);
      return;
    }

    const table: BossTable = {
      id: makeTableId(),
      bossName,
      channelsCount: globalChannelsCount,
      channels: makeChannels(globalChannelsCount),
      createdAt: Date.now(),
    };

    setTables((prev) => [table, ...prev]);
  };

  const removeTable = (tableId: string) => {
    setTables((prev) => prev.filter((table) => table.id !== tableId));
  };

  const applyGlobalChannelsCount = () => {
    const nextCount = Math.max(1, Math.min(50, Math.floor(globalChannelsCount)));
    const currentMaxCount = tables.reduce((max, table) => Math.max(max, table.channelsCount), 0);

    if (nextCount < currentMaxCount) {
      const ok = window.confirm(
        `Reduce all tables to ${nextCount} channels? Extra channels will be removed from the end.`,
      );
      if (!ok) return;
    }

    setTables((prev) =>
      prev.map((table) => {
        if (nextCount <= table.channelsCount) {
          return {
            ...table,
            channelsCount: nextCount,
            channels: table.channels.slice(0, nextCount),
          };
        }

        const extraChannels = Array.from({ length: nextCount - table.channelsCount }, (_, idx) =>
          createEmptyChannel(table.channelsCount + idx + 1),
        );

        return {
          ...table,
          channelsCount: nextCount,
          channels: [...table.channels, ...extraChannels],
        };
      }),
    );

    setGlobalChannelsCount(nextCount);
  };

  const addTimedChannelToAllTables = () => {
    const createdAt = Date.now();

    setTables((prev) =>
      prev.map((table) => {
        const boss = BOSS_BY_NAME.get(table.bossName);
        const nextChannelNumber = table.channelsCount + 1;
        const nextChannel = boss
          ? createTimedChannel(nextChannelNumber, boss, createdAt)
          : createEmptyChannel(nextChannelNumber);

        return {
          ...table,
          channelsCount: nextChannelNumber,
          channels: [...table.channels, nextChannel],
        };
      }),
    );

    setGlobalChannelsCount((prev) => Math.min(50, prev + 1));
  };

  const clearAllChannels = () => {
    const ok = window.confirm('Clear every channel timer in all existing tables?');
    if (!ok) return;

    setTables((prev) =>
      prev.map((table) => ({
        ...table,
        channels: table.channels.map((channel) => ({ channel: channel.channel })),
      })),
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
      }),
    );
  };

  const clearChannel = (tableId: string, channelNumber: number) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id !== tableId) return table;

        return {
          ...table,
          channels: table.channels.map((channel) =>
            channel.channel === channelNumber ? { channel: channelNumber } : channel,
          ),
        };
      }),
    );
  };

  const replaceTables = (nextTables: BossTable[]) => {
    setTables(nextTables);
    if (nextTables.length > 0) {
      setGlobalChannelsCount(nextTables[0].channelsCount);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const matchesSpawnAvailability =
          !onlySpawnAvailable ||
          item.table.channels.some((channel) => {
            const status = getChannelStatus(
              now,
              channel.earliestRespawnAt,
              channel.latestRespawnAt,
            );
            return status === 'IN_WINDOW' || status === 'LATE';
          });
        return matchesSearch && matchesGroup && matchesLocation && matchesSpawnAvailability;
      })
      .filter((item): item is { table: BossTable; boss: (typeof BOSSES)[number] } => item !== null);
  }, [tables, tableSearch, tableLocation, tableLocationGroup, onlySpawnAvailable, now]);

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
        <p className="muted">
          All timestamps are displayed in your local timezone ({APP_TIME_ZONE}).
        </p>
      </header>

      <div
        className={`app-layout ${isGlobalControlsExpanded ? 'with-sidebar' : 'without-sidebar'}`}
      >
        <div className="main-column">
          <BackupPanel tables={tables} onReplaceTables={replaceTables} />
          <CreateTableForm onAddTable={addTable} channelsCount={globalChannelsCount} />

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
                <select
                  value={tableLocation}
                  onChange={(event) => setTableLocation(event.target.value)}
                >
                  <option value={ALL_LOCATIONS_VALUE}>All locations</option>
                  {visibleLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Spawn Filter
                <select
                  value={onlySpawnAvailable ? 'available' : 'all'}
                  onChange={(event) => setOnlySpawnAvailable(event.target.value === 'available')}
                >
                  <option value="all">All tables</option>
                  <option value="available">Spawn available (any CH)</option>
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
                  onKilled={markKilled}
                  onClear={clearChannel}
                />
              ))
            )}
          </main>
        </div>

        {isGlobalControlsExpanded ? (
          <aside className="sidebar expanded">
            <section className="panel sticky-panel">
              <div className="panel-header">
                <h2>Global Table Controls</h2>
                <button
                  type="button"
                  className="panel-header-toggle"
                  onClick={() => setIsGlobalControlsExpanded(false)}
                  aria-label="Collapse Global Table Controls"
                  title="Collapse Global Table Controls"
                >
                  <span className="panel-arrow expanded" aria-hidden="true">
                    ▾
                  </span>
                </button>
              </div>
              <div className="create-form">
                <div className="global-count-control">
                  <label className="global-count-label">
                    Channels For All Tables (1-50)
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={globalChannelsCount}
                      onChange={(event) => setGlobalChannelsCount(Number(event.target.value || 1))}
                    />
                  </label>
                  <button onClick={applyGlobalChannelsCount}>Apply To All Tables</button>
                </div>
                <div className="tooltip-button-wrap">
                  <button onClick={addTimedChannelToAllTables}>Add Timed CH To All Tables</button>
                  <span className="info-tooltip" aria-label="Help for Add Timed CH To All Tables">
                    ?
                    <span className="tooltip-text">
                      Use this as soon as a new channel is created. The respawn timer starts the
                      moment you press it, so it tracks the very first boss spawn from that exact
                      point.
                    </span>
                  </span>
                </div>
                <button className="btn-danger" onClick={clearAllChannels}>
                  Clear All Rows (All Tables)
                </button>
              </div>
              <p className="muted global-note">
                Apply To All Tables adds empty channels only. Use Add Timed CH To All Tables to
                append a channel with respawn timers starting now.
              </p>
              <button type="button" className="scroll-top-btn" onClick={scrollToTop}>
                Scroll to Top
              </button>
            </section>
          </aside>
        ) : (
          <aside className="sidebar collapsed">
            <div className="sidebar-collapsed-tab" aria-label="Collapsed Global Table Controls">
              <button
                type="button"
                className="side-tab-button side-tab-scroll"
                onClick={scrollToTop}
                aria-label="Scroll to top"
                title="Scroll to top"
              >
                ↑
              </button>
              <button
                type="button"
                className="side-tab-button side-tab-menu"
                onClick={() => setIsGlobalControlsExpanded(true)}
                aria-label="Expand Global Table Controls"
                title="Expand Global Table Controls"
              >
                ☰
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
