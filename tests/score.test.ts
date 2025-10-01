import { describe, expect, it } from 'vitest';
import { computeScoreDelta, clampLevel } from '../src/lib/utils/score';

describe('score utils', () => {
  it('awards correct points by level', () => {
    expect(computeScoreDelta('beginner', true)).toBe(10);
    expect(computeScoreDelta('intermediate', true)).toBe(20);
    expect(computeScoreDelta('expert', true)).toBe(30);
  });

  it('deducts incorrect points by level', () => {
    expect(computeScoreDelta('beginner', false)).toBe(-5);
    expect(computeScoreDelta('intermediate', false)).toBe(-10);
    expect(computeScoreDelta('expert', false)).toBe(-15);
  });

  it('clamps unknown levels to beginner', () => {
    expect(clampLevel('unknown')).toBe('beginner');
  });
});
