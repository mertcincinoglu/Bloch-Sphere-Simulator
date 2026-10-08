import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { GATES, apply, fromAngles, probFirst, toAngles } from './bloch';

const ZERO = new Vector3(0, 0, 1);
const close = (a: Vector3, b: Vector3) => expect(a.distanceTo(b)).toBeLessThan(1e-9);

describe('gates move the Bloch vector', () => {
  it('X flips |0⟩ to |1⟩', () => close(apply(GATES.X, ZERO), new Vector3(0, 0, -1)));
  it('H takes |0⟩ to |+⟩', () => close(apply(GATES.H, ZERO), new Vector3(1, 0, 0)));
  it('H twice is the identity', () => close(apply(GATES.H, apply(GATES.H, fromAngles(1, 2))), fromAngles(1, 2)));
  it('S takes |+⟩ to |+i⟩', () => close(apply(GATES.S, new Vector3(1, 0, 0)), new Vector3(0, 1, 0)));
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
