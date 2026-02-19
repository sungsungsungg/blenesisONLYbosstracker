import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ALL_LOCATIONS, BOSSES, LOCATION_GROUPS } from '../data/bosses';

type CreateTableFormProps = {
  onAddTable: (bossName: string, channelsCount: number) => void;
};

const ALL_GROUPS = 'ALL_GROUPS';
const ALL_LOCATIONS_VALUE = 'ALL_LOCATIONS';

export function CreateTableForm({ onAddTable }: CreateTableFormProps) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [selectedLocation, setSelectedLocation] = useState(ALL_LOCATIONS_VALUE);
  const [selectedBoss, setSelectedBoss] = useState(BOSSES[0]?.name ?? '');
  const [channelsCount, setChannelsCount] = useState(10);

  const visibleLocations = useMemo(() => {
    if (selectedGroup === ALL_GROUPS) return ALL_LOCATIONS;
    const group = LOCATION_GROUPS.find((item) => item.label === selectedGroup);
    if (!group) return ALL_LOCATIONS;
    return group.locations;
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedLocation !== ALL_LOCATIONS_VALUE && !visibleLocations.includes(selectedLocation)) {
      setSelectedLocation(ALL_LOCATIONS_VALUE);
    }
  }, [selectedLocation, visibleLocations]);

  const filteredBosses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return BOSSES.filter((boss) => {
      const matchesSearch =
        term.length === 0 ||
        boss.name.toLowerCase().includes(term) ||
        boss.location.toLowerCase().includes(term);
      const matchesGroup = selectedGroup === ALL_GROUPS || boss.locationGroup === selectedGroup;
      const matchesLocation =
        selectedLocation === ALL_LOCATIONS_VALUE || boss.location === selectedLocation;

      return matchesSearch && matchesGroup && matchesLocation;
    });
  }, [search, selectedGroup, selectedLocation]);

  useEffect(() => {
    if (filteredBosses.length === 0) return;
    const exists = filteredBosses.some((boss) => boss.name === selectedBoss);
    if (!exists) {
      setSelectedBoss(filteredBosses[0].name);
    }
  }, [filteredBosses, selectedBoss]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBoss) return;

    const normalizedChannels = Math.max(1, Math.min(50, Math.floor(channelsCount)));
    onAddTable(selectedBoss, normalizedChannels);
  };

  return (
    <section className="panel">
      <h2>Create Boss Table</h2>
      <form className="create-form" onSubmit={handleSubmit}>
        <label>
          Search Boss / Location
          <input
            type="text"
            value={search}
            placeholder="Type boss or location"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label>
          Location Group
          <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
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
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
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
          Select Boss
          <select value={selectedBoss} onChange={(event) => setSelectedBoss(event.target.value)}>
            {filteredBosses.map((boss) => (
              <option key={boss.name} value={boss.name}>
                {boss.name} - {boss.location} ({boss.minLabel} - {boss.maxLabel})
              </option>
            ))}
          </select>
        </label>

        <label>
          Channels (1-50)
          <input
            type="number"
            min={1}
            max={50}
            value={channelsCount}
            onChange={(event) => setChannelsCount(Number(event.target.value || 1))}
          />
        </label>

        <button type="submit" disabled={!selectedBoss || filteredBosses.length === 0}>
          Add Table
        </button>
      </form>
    </section>
  );
}
