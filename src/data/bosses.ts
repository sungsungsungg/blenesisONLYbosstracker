import type { BossDef } from '../types';
import { parseDurationToMs } from '../utils/duration';

const BOSSES_RAW = [
  { name: 'Mano', min: '23m', max: '30m' },
  { name: 'Stumpy', min: '23m', max: '30m' },
  { name: 'Deo', min: '1h 8m', max: '1h 30m' },
  { name: 'King Clang', min: '45m', max: '1h' },
  { name: 'Faust', min: '38m', max: '45m' },
  { name: 'Shade', min: '45m', max: '1h' },
  { name: 'Timer', min: '1h 8m', max: '1h 30m' },
  { name: 'Master Dummy', min: '2h 38m', max: '3h' },
  { name: 'Mushmom', min: '3h 15m', max: '3h 45m' },
  { name: 'Scholar Ghost', min: '2h 30m', max: '5h' },
  { name: 'Giant Bellflower Root', min: '1h', max: '2h 15m' },
  { name: 'Rurumo', min: '1h 53m', max: '2h 15m' },
  { name: 'Snow Witch', min: '2h 38m', max: '3h' },
  { name: 'Dyle', min: '1h 30m', max: '1h 45m' },
  { name: 'Zombie Mushmom', min: '3h 15m', max: '3h 45m' },
  { name: 'Riche', min: '45m', max: '1h 45m' },
  { name: 'Zeno', min: '4h 30m', max: '5h 50m' },
  { name: 'Bamboo Warrior', min: '1h 53m', max: '2h 8m' },
  { name: 'Nine-Tailed Fox', min: '3h 30m', max: '9h 30m' },
  { name: 'Tae Roon', min: '1h 53m', max: '2h 8m' },
  { name: 'Security Camera', min: '2h 38m', max: '2h 53m' },
  { name: 'King Sage Cat', min: '2h 30m', max: '2h 50m' },
  { name: 'Jr. Balrog', min: '6h 45m', max: '9h' },
  { name: 'Deet and Roi', min: '2h 30m', max: '2h 45m' },
  { name: 'Eliza', min: '1h 58m', max: '2h 8m' },
  { name: 'Snack Bar', min: '13h', max: '17h' },
  { name: 'Kimera', min: '2h', max: '2h 15m' },
  { name: 'Snowman', min: '45m', max: '1h 8m' },
  { name: 'Blue Mushmom', min: '12h', max: '28h' },
  { name: 'Crazy Meowz', min: '1h 50m', max: '7h' },
  { name: 'Manon', min: '1h', max: '1h' },
  { name: 'Griffey', min: '1h', max: '1h' },
  { name: 'Pianus', min: '3h', max: '5h' },
  { name: 'Leviathan', min: '4h', max: '12h' },
  { name: 'Dodo', min: '45m', max: '5h 15m' },
  { name: 'Lilynouch', min: '45m', max: '5h 15m' },
  { name: 'Lyka', min: '45m', max: '5h 15m' },
] as const;

export const BOSSES: BossDef[] = BOSSES_RAW.map((boss) => ({
  name: boss.name,
  minLabel: boss.min,
  maxLabel: boss.max,
  minMs: parseDurationToMs(boss.min),
  maxMs: parseDurationToMs(boss.max),
}));

export const BOSS_BY_NAME = new Map(BOSSES.map((boss) => [boss.name, boss]));
