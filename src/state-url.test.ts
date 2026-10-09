import { describe, expect, it } from 'vitest';
import { parsePi, piText, readShared } from './state-url';

describe('typed angles and shared links', () => {
  it.each([['0.5π', 0.5], ['0.5pi', 0.5], ['π/4', 0.25], ['1/4', 0.25], ['0.25', 0.25], ['π', 1], ['-0.5π', -0.5], ['−1/2π', -0.5], ['2π', 2], ['0,5π', 0.5]])('%s', (text, k) => {
    expect(parsePi(text)).toBeCloseTo(k * Math.PI, 12);
  });
  it.each(['', 'abc', 'π/0', '1..2'])('rejects %s', (text) => expect(parsePi(text)).toBeNull());
  it('writes multiples of π', () => {
    expect(piText(Math.PI / 4)).toBe('0.25π');
    expect(piText(Math.PI)).toBe('π');
    expect(piText(0)).toBe('0');
    expect(piText(-Math.PI / 2)).toBe('−0.5π');
  });
  it('reads a state from a link and clamps it', () => {
    const v = readShared('#t=1.5708&p=0&r=0.5')!;
    expect(v.x).toBeCloseTo(0.5, 4);
    expect(v.z).toBeCloseTo(0, 4);
    expect(readShared('#t=9&p=0&r=7')!.length()).toBeCloseTo(1, 12);
    expect(readShared('#x=1')).toBeNull();
  });
});
