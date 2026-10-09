import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { GATES, allBases, apply, customGate, fromAngles, measure, probFirst, sample, stateName, toAngles } from './bloch';

const ZERO = new Vector3(0, 0, 1);
const close = (a: Vector3, b: Vector3) => expect(a.distanceTo(b)).toBeLessThan(1e-9);

describe('gates move the Bloch vector', () => {
  it('X flips |0⟩ to |1⟩', () => close(apply(GATES.X, ZERO), new Vector3(0, 0, -1)));
  it('H takes |0⟩ to |+⟩', () => close(apply(GATES.H, ZERO), new Vector3(1, 0, 0)));
  it('H twice is the identity', () => close(apply(GATES.H, apply(GATES.H, fromAngles(1, 2))), fromAngles(1, 2)));
  it('S takes |+⟩ to |i⟩', () => close(apply(GATES.S, new Vector3(1, 0, 0)), new Vector3(0, 1, 0)));
  it('T twice equals S', () => close(apply(GATES.T, apply(GATES.T, fromAngles(1, 0.3))), apply(GATES.S, fromAngles(1, 0.3))));
  it('Ry(π/4) twice takes |0⟩ to |+⟩', () => close(apply(GATES.Ry, apply(GATES.Ry, ZERO)), new Vector3(1, 0, 0)));
  it('Rx(π/4) twice takes |0⟩ to |−i⟩', () => close(apply(GATES.Rx, apply(GATES.Rx, ZERO)), new Vector3(0, -1, 0)));
  it('a gate keeps a mixed state mixed (same length)', () => expect(apply(GATES.H, new Vector3(0, 0, 0.4)).length()).toBeCloseTo(0.4, 12));
});

describe('angles and probabilities', () => {
  it('θ, φ round-trip', () => {
    const { theta, phi } = toAngles(fromAngles(0.7, 4));
    expect(theta).toBeCloseTo(0.7, 12);
    expect(phi).toBeCloseTo(4, 12);
  });
  it('P(0) = cos²(θ/2)', () => expect(probFirst(fromAngles(1.2, 0.5), 'Z')).toBeCloseTo(Math.cos(0.6) ** 2, 12));
  it('|+⟩ is certain in X, 50/50 in Z', () => {
    expect(probFirst(new Vector3(1, 0, 0), 'X')).toBeCloseTo(1, 12);
    expect(probFirst(new Vector3(1, 0, 0), 'Z')).toBeCloseTo(0.5, 12);
  });
});

// --- checks against the textbook matrices (from the physics audit, 2026-10-09) ---
type C = [number, number];
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
const conj = (a: C): C => [a[0], -a[1]];
const c8 = Math.cos(Math.PI / 8), s8 = Math.sin(Math.PI / 8), h = Math.SQRT1_2;
const U: Record<string, [C, C, C, C]> = {
  X: [[0, 0], [1, 0], [1, 0], [0, 0]], Y: [[0, 0], [0, -1], [0, 1], [0, 0]],
  Z: [[1, 0], [0, 0], [0, 0], [-1, 0]], H: [[h, 0], [h, 0], [h, 0], [-h, 0]],
  S: [[1, 0], [0, 0], [0, 0], [0, 1]], T: [[1, 0], [0, 0], [0, 0], [h, h]],
  Rx: [[c8, 0], [0, -s8], [0, -s8], [c8, 0]], Ry: [[c8, 0], [-s8, 0], [s8, 0], [c8, 0]],
  Rz: [[c8, -s8], [0, 0], [0, 0], [c8, s8]], Sdg: [[1, 0], [0, 0], [0, 0], [0, -1]], Tdg: [[1, 0], [0, 0], [0, 0], [h, -h]],
};
const blochOf = (a: C, b: C) => { const ab = mul(conj(a), b); return new Vector3(2 * ab[0], 2 * ab[1], a[0] ** 2 + a[1] ** 2 - b[0] ** 2 - b[1] ** 2); };
const ket = (th: number, ph: number): [C, C] => [[Math.cos(th / 2), 0], [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]];
const STATES = [[0, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [1, 2], [2.5, 4]];

describe('conventions and measurement', () => {
  it.each(Object.keys(U))('%s: the rotation matches the textbook matrix', (name) => {
    const [u00, u01, u10, u11] = U[name];
    for (const [th, ph] of STATES) {
      const [a, b] = ket(th, ph);
      close(apply(GATES[name], fromAngles(th, ph)), blochOf(add(mul(u00, a), mul(u01, b)), add(mul(u10, a), mul(u11, b))));
    }
  });
  it('a custom Rn(α) about X by π/4 is Rx(π/4)', () => {
    for (const [th, ph] of STATES) close(apply(customGate(Math.PI / 2, 0, Math.PI / 4), fromAngles(th, ph)), apply(GATES.Rx, fromAngles(th, ph)));
  });
  it('a custom gate shows the Rn(α) matrix', () => {
    expect(customGate(Math.PI / 2, 0, Math.PI / 2).cells).toEqual(['0.707', '−0.707i', '−0.707i', '0.707']);
    expect(customGate(0, 0, Math.PI).cells).toEqual(['−1i', '0', '0', '1i']);
  });
  it('a measurement leaves even a mixed state pure, on the pole it found', () => {
    const v = new Vector3(0, 0, 0.3);
    const up = measure(v, 'X', () => 0), down = measure(v, 'X', () => 0.999);
    expect(up.first).toBe(true); close(up.after, new Vector3(1, 0, 0));
    expect(down.first).toBe(false); close(down.after, new Vector3(-1, 0, 0));
  });
  it('P = (1 + r·n)/2 in every basis, mixed states included', () => {
    const v = new Vector3(0.2, -0.4, 0.1);
    expect(probFirst(v, 'X')).toBeCloseTo(0.6, 12);
    expect(probFirst(v, 'Y')).toBeCloseTo(0.3, 12);
    expect(probFirst(v, 'Z')).toBeCloseTo(0.55, 12);
    expect(probFirst(new Vector3(), 'Y')).toBe(0.5);
  });
  it('sample counts the first outcome with probability P', () => {
    let i = 0; const rand = () => ((i++ % 100) + 0.5) / 100;
    expect(sample(fromAngles(Math.PI / 3, 0), 'Z', 1000, rand)).toBe(750);
  });
  it('a mixed state keeps the angles of its direction', () => {
    const { theta, phi } = toAngles(fromAngles(0.7, 4).multiplyScalar(0.4));
    expect(theta).toBeCloseTo(0.7, 12);
    expect(phi).toBeCloseTo(4, 12);
  });
});

describe('names, inverses and readouts (hands-on audit, 2026-10-09)', () => {
  it('H on |0⟩ reads φ = 0, not 2π', () => {
    const { phi } = toAngles(apply(GATES.H, ZERO));
    expect(phi).toBe(0);
  });
  it('S† undoes S and T† undoes T', () => {
    const v = fromAngles(1.1, 0.4);
    close(apply(GATES.Sdg, apply(GATES.S, v)), v);
    close(apply(GATES.Tdg, apply(GATES.T, v)), v);
  });
  it('Rz(π/4) turns |+⟩ toward |i⟩ by 45°', () => close(apply(GATES.Rz, new Vector3(1, 0, 0)), fromAngles(Math.PI / 2, Math.PI / 4)));
  it('names the six axis states, even with rounding noise', () => {
    expect(stateName(apply(GATES.H, ZERO))).toBe('|+⟩');
    expect(stateName(apply(GATES.S, apply(GATES.H, ZERO)))).toBe('|i⟩');
    expect(stateName(fromAngles(1, 1))).toBeNull();
    expect(stateName(new Vector3(0, 0, 0.5))).toBeNull();
  });
  it('gives all three bases at once', () => {
    const b = allBases(new Vector3(0, 1, 0));
    expect(b.Y[0]).toBeCloseTo(1, 12);
    expect(b.Z[0]).toBeCloseTo(0.5, 12);
    expect(b.X[1]).toBeCloseTo(0.5, 12);
  });
});
