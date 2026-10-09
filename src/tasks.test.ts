import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { GATES, apply, fromAngles, type Gate } from './bloch';
import { TASKS, judge } from './tasks';

const run = (start: Vector3, gates: Gate[]) => gates.reduce((v, g) => apply(g, v), start.clone());
const task = (id: string) => TASKS.find((t) => t.id === id)!;

describe('every task can be solved within its limits', () => {
  it.each([
    ['flip', ['X']], ['plus', ['H']], ['toi', ['H', 'S']], ['home', ['S', 'H']], ['minus', ['H', 'Z']],
  ])('%s with %j', (id, names) => {
    const t = task(id as string);
    const v = run(t.start, (names as string[]).map((n) => GATES[n]));
    expect(judge(t, v, (names as string[]).map(() => 'gate')).state).toBe('solved');
  });
  it('odds: θ = 60° at any φ', () => {
    expect(judge(task('odds'), fromAngles(Math.PI / 3, 1.3), ['other']).state).toBe('solved');
    expect(judge(task('odds'), fromAngles(Math.PI / 2, 0), ['other']).state).toBe('going');
  });
});

describe('the rules', () => {
  it('too many gates', () => expect(judge(task('flip'), run(task('flip').start, [GATES.H, GATES.H]), ['gate', 'gate']).state).toBe('tooMany'));
  it('a slider or a measurement breaks a gates-only task', () => expect(judge(task('plus'), new Vector3(1, 0, 0), ['other']).state).toBe('gatesOnly'));
  it('not there yet', () => expect(judge(task('toi'), new Vector3(1, 0, 0), ['gate']).state).toBe('going'));
});
