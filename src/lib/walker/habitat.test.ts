import { describe, expect, test } from 'bun:test';
import { HABITAT_TIMING, sampleHabitatDelay } from './habitat';

describe('pet habitat timing', () => {
  test('waits between two and five active minutes before returning to the seal', () => {
    expect(sampleHabitatDelay(() => 0, HABITAT_TIMING.terrainStay)).toBe(120);
    expect(sampleHabitatDelay(() => 1, HABITAT_TIMING.terrainStay)).toBe(300);
    expect(sampleHabitatDelay(() => 0.5, HABITAT_TIMING.terrainStay)).toBe(210);
  });

  test('uses a short first ascent and a longer rest after returning', () => {
    expect(sampleHabitatDelay(() => 0, HABITAT_TIMING.firstAscent)).toBe(4);
    expect(sampleHabitatDelay(() => 1, HABITAT_TIMING.firstAscent)).toBe(12);
    expect(sampleHabitatDelay(() => 0, HABITAT_TIMING.sealRest)).toBe(45);
    expect(sampleHabitatDelay(() => 1, HABITAT_TIMING.sealRest)).toBe(120);
  });
});
