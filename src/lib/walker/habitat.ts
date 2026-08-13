import type { RandomSource } from './simulation';

export type TimingWindow = readonly [minimum: number, maximum: number];

export const HABITAT_TIMING = {
  firstAscent: [4, 12],
  terrainStay: [120, 300],
  sealRest: [45, 120],
} as const satisfies Record<string, TimingWindow>;

export const sampleHabitatDelay = (
  random: RandomSource,
  [minimum, maximum]: TimingWindow,
) => minimum + random() * (maximum - minimum);
