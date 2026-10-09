// Short exercises for the lab. Each starts from a state, may limit the tool to gates and their number,
// and is solved when check() holds for the arrow. Texts live in strings.ts as task.<id>.title / .goal.
import { Vector3 } from 'three';

export interface Task {
  id: string;
  start: Vector3;
  target?: Vector3; // drawn as a ring; left out when finding it is the point
  maxGates?: number;
  gatesOnly: boolean;
  check: (v: Vector3) => boolean;
}

const at = (x: number, y: number, z: number) => new Vector3(x, y, z);
const on = (t: Vector3) => (v: Vector3) => v.distanceTo(t) < 1e-6;
const ZERO = at(0, 0, 1), ONE = at(0, 0, -1), PLUS = at(1, 0, 0), MINUS = at(-1, 0, 0), I = at(0, 1, 0), MINUS_I = at(0, -1, 0);

export const TASKS: Task[] = [
  { id: 'flip', start: ZERO, target: ONE, maxGates: 1, gatesOnly: true, check: on(ONE) },
  { id: 'plus', start: ZERO, target: PLUS, maxGates: 1, gatesOnly: true, check: on(PLUS) },
  { id: 'toi', start: ZERO, target: I, maxGates: 2, gatesOnly: true, check: on(I) },
  { id: 'home', start: MINUS_I, target: ZERO, maxGates: 2, gatesOnly: true, check: on(ZERO) },
  // Z gives 50/50 and X always |−⟩: that is |−⟩, but the task says it only through measurements
  { id: 'minus', start: ZERO, maxGates: 2, gatesOnly: true, check: on(MINUS) },
  // P(|0⟩) = cos²(θ/2) = 3/4 → θ = 60°, any φ, on the surface
  { id: 'odds', start: ZERO, gatesOnly: false, check: (v) => v.length() > 0.995 && Math.abs((1 + v.z) / 2 - 0.75) < 0.005 },
];

/** What a run of steps since the start means for a task. */
export function judge(task: Task, v: Vector3, kinds: Array<'gate' | 'other'>) {
  const gates = kinds.filter((k) => k === 'gate').length;
  const other = kinds.some((k) => k !== 'gate');
  if (task.gatesOnly && other) return { gates, state: 'gatesOnly' as const };
  if (task.maxGates !== undefined && gates > task.maxGates) return { gates, state: 'tooMany' as const };
  return { gates, state: task.check(v) ? ('solved' as const) : ('going' as const) };
}
