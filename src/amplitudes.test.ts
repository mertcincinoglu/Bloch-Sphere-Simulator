import { describe, expect, it } from 'vitest';
import { blochFromAmplitudes, parseComplex } from './amplitudes';
import { parsePi } from './state-url';

const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-9);

describe('parseComplex', () => {
  it.each([
    ['1', 1, 0], ['0.6', 0.6, 0], ['0,6', 0.6, 0], ['1/√2', Math.SQRT1_2, 0], ['sqrt(2)/2', Math.SQRT1_2, 0],
    ['i', 0, 1], ['-i', 0, -1], ['−i', 0, -1], ['0.8i', 0, 0.8], ['i/2', 0, 0.5], ['i/√2', 0, Math.SQRT1_2],
    ['0.6+0.8i', 0.6, 0.8], ['0.6 - 0.8i', 0.6, -0.8], ['(1+i)/2', 0.5, 0.5], ['1/2 + i/2', 0.5, 0.5], ['-0.5i+0.5', 0.5, -0.5],
  ])('%s', (text, re, im) => {
    const c = parseComplex(text)!;
    near(c.re, re);
    near(c.im, im);
  });
  it.each(['', 'abc', 'ii', '1/', '√-1', '2e3', 'x+1'])('rejects %s', (text) => expect(parseComplex(text)).toBeNull());
});

describe('blochFromAmplitudes', () => {
  const v = (a: string, b: string) => blochFromAmplitudes(parseComplex(a)!, parseComplex(b)!)!.v;
  it('|0⟩, |1⟩, |+⟩, |−⟩, |i⟩, |−i⟩', () => {
    expect(v('1', '0').toArray()).toEqual([0, 0, 1]);
    expect(v('0', '1').toArray()).toEqual([0, 0, -1]);
    [[v('1/√2', '1/√2'), [1, 0, 0]], [v('1/√2', '-1/√2'), [-1, 0, 0]], [v('1/√2', 'i/√2'), [0, 1, 0]], [v('1/√2', '-i/√2'), [0, -1, 0]]]
      .forEach(([got, want]) => (got as { toArray(): number[] }).toArray().forEach((x, k) => near(x, (want as number[])[k])));
  });
  it('normalises, and a global phase changes nothing', () => {
    const a = v('3', '4'); // ∝ 0.6|0⟩ + 0.8|1⟩
    near(a.length(), 1);
    near(a.z, 0.36 - 0.64);
    const b = v('3i', '4i');
    a.toArray().forEach((x, k) => near(x, b.toArray()[k]));
  });
  it('both zero is not a state', () => expect(blochFromAmplitudes({ re: 0, im: 0 }, { re: 0, im: 0 })).toBeNull());
});

describe('parsePi degrees', () => {
  it('reads 60° and 90deg as degrees', () => {
    near(parsePi('60°')!, Math.PI / 3);
    near(parsePi('90deg')!, Math.PI / 2);
    near(parsePi('1/3')!, Math.PI / 3);
  });
});
