// Single-qubit maths on the Bloch sphere. A pure state is a unit vector (x, y, z);
// every single-qubit gate is a rotation of that vector (up to a global phase).
import { Quaternion, Vector3 } from 'three';

export type Basis = 'Z' | 'X' | 'Y';

export interface Gate {
  name: string;
  axis: Vector3; // rotation axis in Bloch coordinates
  angle: number; // radians
  matrix: string; // TeX
}

const s2 = Math.SQRT1_2;

export const GATES: Record<string, Gate> = {
  X: { name: 'X', axis: new Vector3(1, 0, 0), angle: Math.PI, matrix: String.raw`\begin{pmatrix}0&1\\1&0\end{pmatrix}` },
  Y: { name: 'Y', axis: new Vector3(0, 1, 0), angle: Math.PI, matrix: String.raw`\begin{pmatrix}0&-i\\i&0\end{pmatrix}` },
  Z: { name: 'Z', axis: new Vector3(0, 0, 1), angle: Math.PI, matrix: String.raw`\begin{pmatrix}1&0\\0&-1\end{pmatrix}` },
  H: { name: 'H', axis: new Vector3(s2, 0, s2), angle: Math.PI, matrix: String.raw`\tfrac{1}{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix}` },
  S: { name: 'S', axis: new Vector3(0, 0, 1), angle: Math.PI / 2, matrix: String.raw`\begin{pmatrix}1&0\\0&i\end{pmatrix}` },
  T: { name: 'T', axis: new Vector3(0, 0, 1), angle: Math.PI / 4, matrix: String.raw`\begin{pmatrix}1&0\\0&e^{i\pi/4}\end{pmatrix}` },
  Rx: { name: 'Rx(π/2)', axis: new Vector3(1, 0, 0), angle: Math.PI / 2, matrix: String.raw`\tfrac{1}{\sqrt2}\begin{pmatrix}1&-i\\-i&1\end{pmatrix}` },
  Ry: { name: 'Ry(π/2)', axis: new Vector3(0, 1, 0), angle: Math.PI / 2, matrix: String.raw`\tfrac{1}{\sqrt2}\begin{pmatrix}1&-1\\1&1\end{pmatrix}` },
  Rz: { name: 'Rz(π/2)', axis: new Vector3(0, 0, 1), angle: Math.PI / 2, matrix: String.raw`\begin{pmatrix}e^{-i\pi/4}&0\\0&e^{i\pi/4}\end{pmatrix}` },
};

export const BASIS_AXIS: Record<Basis, Vector3> = {
  Z: new Vector3(0, 0, 1),
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
};

export const BASIS_LABELS: Record<Basis, [string, string]> = {
  Z: ['0', '1'],
  X: ['+', '−'],
  Y: ['+i', '−i'],
};

export function fromAngles(theta: number, phi: number): Vector3 {
  return new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
}

export function toAngles(v: Vector3): { theta: number; phi: number } {
  const theta = Math.acos(Math.min(1, Math.max(-1, v.z)));
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
