import type { BossDef } from '../types';
import { parseDurationToMs } from '../utils/duration';

type LocationGroupDef = {
  id: string;
  label: string;
  locations: string[];
};

const BASE_LOCATION_GROUPS: LocationGroupDef[] = [
  {
    id: 'group-1',
    label: 'Ludibrium, Korean Folk Town, Omega Sector',
    locations: ['Ludibrium', 'Korean Folk Town', 'Omega Sector'],
  },
  {
    id: 'group-2',
    label: 'Orbis, El Nath, Aquarium',
    locations: ['Orbis', 'El Nath', 'Aqua Road'],
  },
  {
    id: 'group-3',
    label: 'Japan, Taiwan',
    locations: ['Japan', 'Taiwan'],
  },
  {
    id: 'group-4',
    label: 'Mu Lung, Herb Town',
    locations: ['Mu Lung', 'Herb Town'],
  },
  {
    id: 'group-5',
    label: 'Magatia, Ariant',
    locations: ['Magatia', 'Ariant'],
  },
  {
    id: 'group-6',
    label: 'Leafre, Temple of Time',
    locations: ['Leafre', 'Temple of Time'],
  },
];

const BOSSES_RAW = [
  { name: 'Mano', min: '23m', max: '30m', location: 'Victoria Island' },
  { name: 'Stumpy', min: '23m', max: '30m', location: 'Victoria Island' },
  { name: 'Deo', min: '1h 8m', max: '1h 30m', location: 'Ariant' },
  { name: 'King Clang', min: '45m', max: '1h', location: 'Florina Beach' },
  { name: 'Faust', min: '38m', max: '45m', location: 'Victoria Island' },
  { name: 'Shade', min: '45m', max: '1h', location: 'Victoria Island' },
  { name: 'Timer', min: '1h 8m', max: '1h 30m', location: 'Ludibrium' },
  { name: 'Master Dummy', min: '2h 38m', max: '3h', location: 'Mu Lung' },
  { name: 'Mushmom', min: '3h 15m', max: '3h 45m', location: 'Victoria Island' },
  { name: 'Scholar Ghost', min: '2h 30m', max: '5h', location: 'Korean Folk Town' },
  { name: 'Giant Bellflower Root', min: '1h', max: '2h 15m', location: 'Herb Town' },
  { name: 'Rurumo', min: '1h 53m', max: '2h 15m', location: 'Magatia' },
  { name: 'Snow Witch', min: '2h 38m', max: '3h', location: 'El Nath' },
  { name: 'Dyle', min: '1h 30m', max: '1h 45m', location: 'Victoria Island' },
  { name: 'Zombie Mushmom', min: '3h 15m', max: '3h 45m', location: 'Victoria Island' },
  { name: 'Riche', min: '45m', max: '1h 45m', location: 'El Nath' },
  { name: 'Zeno', min: '4h 30m', max: '5h 50m', location: 'Omega Sector' },
  { name: 'Bamboo Warrior', min: '1h 53m', max: '2h 8m', location: 'Japan' },
  { name: 'Nine-Tailed Fox', min: '3h 30m', max: '9h 30m', location: 'Korean Folk Town' },
  { name: 'Tae Roon', min: '1h 53m', max: '2h 8m', location: 'Mu Lung' },
  { name: 'Security Camera', min: '2h 38m', max: '2h 53m', location: 'Magatia' },
  { name: 'King Sage Cat', min: '2h 30m', max: '2h 50m', location: 'Mu Lung' },
  { name: 'Jr. Balrog', min: '6h 45m', max: '9h', location: 'Victoria Island' },
  { name: 'Deet and Roi', min: '2h 30m', max: '2h 45m', location: 'Magatia' },
  { name: 'Eliza', min: '1h 58m', max: '2h 8m', location: 'Orbis' },
  { name: 'Snack Bar (qab)', min: '13h', max: '17h', location: 'Taiwan' },
  { name: 'Snack Bar (qba)', min: '13h', max: '17h', location: 'Taiwan' },
  { name: 'Kimera', min: '2h', max: '2h 15m', location: 'Magatia' },
  { name: 'Snowman', min: '45m', max: '1h 8m', location: 'El Nath' },
  { name: 'Blue Mushmom', min: '12h', max: '28h', location: 'Japan' },
  { name: 'Crazy Meowz', min: '1h 50m', max: '7h', location: 'Taiwan' },
  { name: 'Manon', min: '1h', max: '1h', location: 'Leafre' },
  { name: 'Griffey', min: '1h', max: '1h', location: 'Leafre' },
  { name: 'Pianus', min: '3h', max: '5h', location: 'Aqua Road' },
  { name: 'Leviathan', min: '4h', max: '12h', location: 'Leafre' },
  { name: 'Dodo', min: '45m', max: '5h 15m', location: 'Temple of Time' },
  { name: 'Lilynouch', min: '45m', max: '5h 15m', location: 'Temple of Time' },
  { name: 'Lyka', min: '45m', max: '5h 15m', location: 'Temple of Time' },
] as const;

const groupedLocations = new Set(BASE_LOCATION_GROUPS.flatMap((group) => group.locations));
const extraLocations = Array.from(
  new Set(
    BOSSES_RAW.map((boss) => boss.location).filter((location) => !groupedLocations.has(location)),
  ),
).sort();

const independentLocationGroups: LocationGroupDef[] = extraLocations.map((location) => ({
  id: `independent-${location.toLowerCase().replace(/\s+/g, '-')}`,
  label: location,
  locations: [location],
}));

export const LOCATION_GROUPS: LocationGroupDef[] = [
  ...BASE_LOCATION_GROUPS,
  ...independentLocationGroups,
];

const LOCATION_TO_GROUP = new Map<string, string>();
for (const group of LOCATION_GROUPS) {
  for (const location of group.locations) {
    LOCATION_TO_GROUP.set(location, group.label);
  }
}

export const BOSSES: BossDef[] = BOSSES_RAW.map((boss) => ({
  name: boss.name,
  minLabel: boss.min,
  maxLabel: boss.max,
  minMs: parseDurationToMs(boss.min),
  maxMs: parseDurationToMs(boss.max),
  location: boss.location,
  locationGroup: LOCATION_TO_GROUP.get(boss.location) ?? boss.location,
}));

export const BOSS_BY_NAME = new Map(BOSSES.map((boss) => [boss.name, boss]));
export const ALL_LOCATIONS = Array.from(new Set(BOSSES.map((boss) => boss.location))).sort();
export const ALL_LOCATION_GROUPS = Array.from(
  new Set(BOSSES.map((boss) => boss.locationGroup)),
).sort();
