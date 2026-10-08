// Single-qubit maths on the Bloch sphere. A pure state is a unit vector (x, y, z);
// every single-qubit gate is a rotation of that vector (up to a global phase).
import { Quaternion, Vector3 } from 'three';

export type Basis = 'Z' | 'X' | 'Y';

export interface Gate {
  axis: Vector3; // rotation axis in Bloch coordinates
  angle: number; // radians
  label: string; // shown above the matrix
  prefix: string; // scalar in front of the matrix
  cells: [string, string, string, string]; // matrix entries, row by row
  story: string;
}

const s2 = Math.SQRT1_2;

export const GATES: Record<string, Gate> = {
  X: { axis: new Vector3(1, 0, 0), angle: Math.PI, label: 'X (BIT FLIP)', prefix: '', cells: ['0', '1', '1', '0'],
    story: 'Applied Pauli X (Bit Flip): Rotates 180° around the X-axis. Inverts the North pole (|0⟩) into South pole (|1⟩) while keeping equatorial points on X static.' },
  Y: { axis: new Vector3(0, 1, 0), angle: Math.PI, label: 'Y (PAULI-Y)', prefix: '', cells: ['0', '−i', 'i', '0'],
    story: 'Applied Pauli Y: 180° rotation around the Y-axis. Flips both the bit value and phase angle simultaneously.' },
  Z: { axis: new Vector3(0, 0, 1), angle: Math.PI, label: 'Z (PHASE FLIP)', prefix: '', cells: ['1', '0', '0', '−1'],
    story: 'Applied Pauli Z (Phase Flip): Rotates 180° around the vertical Z-axis. Leaves the probability of |0⟩ and |1⟩ unchanged, but flips relative quantum phase.' },
  H: { axis: new Vector3(s2, 0, s2), angle: Math.PI, label: 'H (HADAMARD)', prefix: '1/√2', cells: ['1', '1', '1', '−1'],
    story: 'Applied Hadamard (H): Rotates 180° around the diagonal axis halfway between X and Z. Creates an equal 50/50 superposition from standard basis states.' },
  S: { axis: new Vector3(0, 0, 1), angle: Math.PI / 2, label: 'S (PHASE π/2)', prefix: '', cells: ['1', '0', '0', 'i'],
    story: 'Applied Phase S: 90° counter-clockwise rotation around Z. Advances quantum phase angle by π/2 without perturbing pole probability.' },
  T: { axis: new Vector3(0, 0, 1), angle: Math.PI / 4, label: 'T (π/8 ROTATION)', prefix: '', cells: ['1', '0', '0', 'e^(iπ/4)'],
    story: "Applied Gate T: 45° rotation around Z (the 'π/8 gate'). Fundamental building block for fault-tolerant universal quantum computation." },
  Rx: { axis: new Vector3(1, 0, 0), angle: Math.PI / 4, label: 'Rx(π/4)', prefix: '', cells: ['cos(π/8)', '−i·sin(π/8)', '−i·sin(π/8)', 'cos(π/8)'],
    story: 'Rotated 45° (π/4) around X-axis. Tilts the superposition angle in the Y-Z vertical plane.' },
  Ry: { axis: new Vector3(0, 1, 0), angle: Math.PI / 4, label: 'Ry(π/4)', prefix: '', cells: ['cos(π/8)', '−sin(π/8)', 'sin(π/8)', 'cos(π/8)'],
    story: 'Rotated 45° (π/4) around Y-axis. Shifts the latitude coordinate directly toward or away from the North pole.' },
};

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
