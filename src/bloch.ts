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
};

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
  // at the poles φ has no meaning; report 0
  if (Math.sin(theta) < 1e-9) phi = 0;
  return { theta, phi };
}

export function rotation(gate: Gate, t = 1): Quaternion {
  return new Quaternion().setFromAxisAngle(gate.axis.clone().normalize(), gate.angle * t);
}

export function apply(gate: Gate, v: Vector3): Vector3 {
  return v.clone().applyQuaternion(rotation(gate));
}

// Probability of the first outcome (|0⟩, |+⟩ or |+i⟩) when measuring along a basis
export function probFirst(v: Vector3, basis: Basis): number {
  return (1 + v.dot(BASIS_AXIS[basis])) / 2;
}

export function measure(v: Vector3, basis: Basis, rand = Math.random): { first: boolean; after: Vector3 } {
  const first = rand() < probFirst(v, basis);
  const axis = BASIS_AXIS[basis].clone();
  return { first, after: first ? axis : axis.negate() };
}

export function sample(v: Vector3, basis: Basis, shots: number, rand = Math.random): number {
  const p = probFirst(v, basis);
  let n = 0;
  for (let i = 0; i < shots; i++) if (rand() < p) n++;
  return n;
}
