// Single-qubit maths on the Bloch sphere. A pure state is a unit vector (x, y, z);
// every single-qubit gate is a rotation of that vector (up to a global phase).
import { Quaternion, Vector3 } from 'three';

export type Basis = 'Z' | 'X' | 'Y';

export interface Gate {
  axis: Vector3; // rotation axis in Bloch coordinates
  angle: number; // radians, the turn on the sphere
  prefix: string; // scalar in front of the matrix
  cells: [string, string, string, string]; // matrix entries, row by row
}

const s2 = Math.SQRT1_2;

export const GATES: Record<string, Gate> = {
  X: { axis: new Vector3(1, 0, 0), angle: Math.PI, prefix: '', cells: ['0', '1', '1', '0'] },
  Y: { axis: new Vector3(0, 1, 0), angle: Math.PI, prefix: '', cells: ['0', '−i', 'i', '0'] },
  Z: { axis: new Vector3(0, 0, 1), angle: Math.PI, prefix: '', cells: ['1', '0', '0', '−1'] },
  H: { axis: new Vector3(s2, 0, s2), angle: Math.PI, prefix: '1/√2', cells: ['1', '1', '1', '−1'] },
  S: { axis: new Vector3(0, 0, 1), angle: Math.PI / 2, prefix: '', cells: ['1', '0', '0', 'i'] },
  T: { axis: new Vector3(0, 0, 1), angle: Math.PI / 4, prefix: '', cells: ['1', '0', '0', 'e^(iπ/4)'] },
  Rx: { axis: new Vector3(1, 0, 0), angle: Math.PI / 4, prefix: '', cells: ['cos(π/8)', '−i·sin(π/8)', '−i·sin(π/8)', 'cos(π/8)'] },
  Ry: { axis: new Vector3(0, 1, 0), angle: Math.PI / 4, prefix: '', cells: ['cos(π/8)', '−sin(π/8)', 'sin(π/8)', 'cos(π/8)'] },
  Rz: { axis: new Vector3(0, 0, 1), angle: Math.PI / 4, prefix: '', cells: ['e^(−iπ/8)', '0', '0', 'e^(iπ/8)'] },
  Sdg: { axis: new Vector3(0, 0, 1), angle: -Math.PI / 2, prefix: '', cells: ['1', '0', '0', '−i'] },
  Tdg: { axis: new Vector3(0, 0, 1), angle: -Math.PI / 4, prefix: '', cells: ['1', '0', '0', 'e^(−iπ/4)'] },
  // √X: a quarter turn about X; two make X. A native gate on IBM hardware. SX = e^(iπ/4)·Rx(π/2)
  SX: { axis: new Vector3(1, 0, 0), angle: Math.PI / 2, prefix: '1/2', cells: ['1+i', '1−i', '1−i', '1+i'] },
};

// angles the rotation gates offer, with their half-angles written out for the matrix
const HALF: Record<string, string> = { 'π/8': 'π/16', 'π/4': 'π/8', 'π/2': 'π/4', π: 'π/2' };
export const ROT_ANGLES: Record<string, number> = { 'π/8': Math.PI / 8, 'π/4': Math.PI / 4, 'π/2': Math.PI / 2, π: Math.PI };

/** Rx, Ry or Rz by one of ROT_ANGLES, with its matrix in symbols: Rn(α) = exp(−iα n·σ/2). */
export function rotGate(name: 'Rx' | 'Ry' | 'Rz', angle: string): Gate {
  const h = HALF[angle];
  const axis = { Rx: new Vector3(1, 0, 0), Ry: new Vector3(0, 1, 0), Rz: new Vector3(0, 0, 1) }[name];
  const cells: Gate['cells'] = name === 'Rx' ? [`cos(${h})`, `−i·sin(${h})`, `−i·sin(${h})`, `cos(${h})`]
    : name === 'Ry' ? [`cos(${h})`, `−sin(${h})`, `sin(${h})`, `cos(${h})`]
    : [`e^(−i${h})`, '0', '0', `e^(i${h})`];
  return { axis, angle: ROT_ANGLES[angle], prefix: '', cells };
}

/** Rn(α) = exp(−iα n·σ/2) for the axis n(θn, φn); entries rounded for display. */
export function customGate(axisTheta: number, axisPhi: number, alpha: number): Gate {
  const n = fromAngles(axisTheta, axisPhi);
  const c = Math.cos(alpha / 2), s = Math.sin(alpha / 2);
  const f = (x: number) => (Math.abs(x) < 5e-4 ? '0' : x.toFixed(3).replace(/\.?0+$/, '').replace('-', '−'));
  const cplx = (re: number, im: number) => {
    if (Math.abs(im) < 5e-4) return f(re);
    if (Math.abs(re) < 5e-4) return `${f(im)}i`;
    return `${f(re)}${im < 0 ? '−' : '+'}${f(Math.abs(im))}i`;
  };
  return {
    axis: n, angle: alpha, prefix: '',
    // [[c − i s nz, −i s nx − s ny], [−i s nx + s ny, c + i s nz]]
    cells: [cplx(c, -s * n.z), cplx(-s * n.y, -s * n.x), cplx(s * n.y, -s * n.x), cplx(c, s * n.z)],
  };
}

export const BASIS_AXIS: Record<Basis, Vector3> = {
  Z: new Vector3(0, 0, 1),
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
};

export const BASIS_LABELS: Record<Basis, [string, string]> = {
  Z: ['|0⟩', '|1⟩'],
  X: ['|+⟩', '|−⟩'],
  Y: ['|i⟩', '|−i⟩'],
};

export function fromAngles(theta: number, phi: number): Vector3 {
  return new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
}

export function toAngles(v: Vector3): { theta: number; phi: number } {
  const len = v.length() || 1; // mixed states are shorter than 1; the angles are the arrow's direction
  const theta = Math.acos(Math.min(1, Math.max(-1, v.z / len)));
  let phi = Math.atan2(v.y, v.x);
  if (phi < 0) phi += 2 * Math.PI;
  // rounding noise just below the +X axis must read as 0, not 2π (−0.0001 → 359.99°)
  if (phi > 2 * Math.PI - 1e-6) phi = 0;
  // at the poles φ has no meaning; report 0
  if (Math.sin(theta) < 1e-9) phi = 0;
  return { theta, phi };
}

const NAMED: Array<[string, Vector3]> = [
  ['|0⟩', new Vector3(0, 0, 1)], ['|1⟩', new Vector3(0, 0, -1)],
  ['|+⟩', new Vector3(1, 0, 0)], ['|−⟩', new Vector3(-1, 0, 0)],
  ['|i⟩', new Vector3(0, 1, 0)], ['|−i⟩', new Vector3(0, -1, 0)],
];

/** The usual name of a pure axis state ("|+⟩"), or null; tolerant of rounding noise. */
export function stateName(v: Vector3): string | null {
  for (const [name, n] of NAMED) if (v.distanceTo(n) < 1e-6) return name;
  return null;
}

/** Probability of each outcome in all three bases at once. */
export function allBases(v: Vector3): Record<Basis, [number, number]> {
  const out = {} as Record<Basis, [number, number]>;
  for (const b of ['Z', 'X', 'Y'] as Basis[]) {
    const p = probFirst(v, b);
    out[b] = [p, 1 - p];
  }
  return out;
}

export function rotation(gate: Gate, t = 1): Quaternion {
  return new Quaternion().setFromAxisAngle(gate.axis.clone().normalize(), gate.angle * t);
}

export function apply(gate: Gate, v: Vector3): Vector3 {
  return v.clone().applyQuaternion(rotation(gate));
}

// A measurement asks "+n or −n?" along a unit axis n; Z, X and Y are three such axes.
const axisOf = (b: Basis | Vector3) => (b instanceof Vector3 ? b.clone().normalize() : BASIS_AXIS[b]);

/** Probability of the first outcome (|0⟩, |+⟩, |i⟩ or +n): (1 + r·n)/2, the Born rule. */
export function probFirst(v: Vector3, basis: Basis | Vector3): number {
  return (1 + v.dot(axisOf(basis))) / 2;
}

/** One shot: the answer is random with the Born odds, and the state becomes that pole. */
export function measure(v: Vector3, basis: Basis | Vector3, rand = Math.random): { first: boolean; after: Vector3 } {
  const first = rand() < probFirst(v, basis);
  const axis = axisOf(basis).clone();
  return { first, after: first ? axis : axis.negate() };
}

/** Fresh copies of the state, each measured once: how many gave the first outcome. */
export function sample(v: Vector3, basis: Basis | Vector3, shots: number, rand = Math.random): number {
  const p = probFirst(v, basis);
  let n = 0;
  for (let i = 0; i < shots; i++) if (rand() < p) n++;
  return n;
}

/** State tomography: measure copies in X, Y and Z and rebuild the arrow, r_k = 2·P(+k) − 1. */
export function tomography(v: Vector3, shots: number, rand = Math.random) {
  const est = (b: Basis) => (2 * sample(v, b, shots, rand)) / shots - 1;
  const r = new Vector3(est('X'), est('Y'), est('Z'));
  // one standard deviation of each estimate: 2·√(p(1−p)/N)
  const sd = (b: Basis) => { const p = probFirst(v, b); return 2 * Math.sqrt((p * (1 - p)) / shots); };
  return { r, sd: new Vector3(sd('X'), sd('Y'), sd('Z')) };
}

/** A pure state drawn evenly over the whole sphere (not evenly in θ, which would crowd the poles). */
export function randomState(rand = Math.random): Vector3 {
  const z = 2 * rand() - 1, phi = 2 * Math.PI * rand(), s = Math.sqrt(1 - z * z);
  return new Vector3(s * Math.cos(phi), s * Math.sin(phi), z);
}

/** ρ = ½ (I + x σx + y σy + z σz), row by row as [re, im]. */
export function densityMatrix(v: Vector3): Array<[number, number]> {
  return [[(1 + v.z) / 2, 0], [v.x / 2, -v.y / 2], [v.x / 2, v.y / 2], [(1 - v.z) / 2, 0]];
}
