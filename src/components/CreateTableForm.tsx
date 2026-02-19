import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BOSSES } from '../data/bosses';

type CreateTableFormProps = {
  onAddTable: (bossName: string, channelsCount: number) => void;
};

export function CreateTableForm({ onAddTable }: CreateTableFormProps) {
  const [search, setSearch] = useState('');
  const [selectedBoss, setSelectedBoss] = useState(BOSSES[0]?.name ?? '');
  const [channelsCount, setChannelsCount] = useState(10);

  const filteredBosses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return BOSSES;
    return BOSSES.filter((boss) => boss.name.toLowerCase().includes(term));
  }, [search]);

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
          Search Boss
          <input
            type="text"
            value={search}
            placeholder="Type boss name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label>
          Select Boss
          <select
            value={selectedBoss}
            onChange={(event) => setSelectedBoss(event.target.value)}
          >
            {filteredBosses.map((boss) => (
              <option key={boss.name} value={boss.name}>
                {boss.name} ({boss.minLabel} - {boss.maxLabel})
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
