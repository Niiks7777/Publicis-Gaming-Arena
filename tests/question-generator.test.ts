import { describe, expect, it } from 'vitest';
import { hashQuestion, rateLimit } from '../src/lib/server/question-generator';

describe('question generator helpers', () => {
  it('creates stable hashes for identical stems', () => {
    expect(hashQuestion('Test question')).toBe(hashQuestion('Test question'));
  });

  it('rate limit throws after threshold', () => {
    const key = 'test';
    rateLimit(key, 1, 2);
    rateLimit(key, 1, 2);
    expect(() => rateLimit(key, 1, 2)).toThrow('Rate limit exceeded');
  });
});
