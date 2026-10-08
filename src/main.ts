import '@fontsource-variable/jost';
import '@fontsource-variable/source-serif-4';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import 'katex/dist/katex.min.css';
import './style.css';
import $ from 'jquery';
import katex from 'katex';
import { Quaternion, Vector3 } from 'three';
import { BASIS_LABELS, GATES, apply, fromAngles, measure, probFirst, rotation, sample, toAngles, type Basis } from './bloch';
import { BlochScene } from './scene';

const DEG = Math.PI / 180;
const scene = new BlochScene($('#sphere')[0]);
let v = new Vector3(0, 0, 1);
let basis: Basis = 'Z';
let busy = false;
const undoStack: Vector3[] = [];

const tex = (el: string, s: string, display = false) => katex.render(s, $(el)[0], { displayMode: display, throwOnError: false });
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const angle = (rad: number) => `${Math.round(rad / DEG)}°`;
const num = (x: number) => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2); // no "-0.00"

const GATE_STORY: Record<string, string> = {
  X: 'You applied X, the bit flip: the arrow turned 180° around the X axis, so |0⟩ and |1⟩ swap places.',
  Y: 'You applied Y: the arrow turned 180° around the Y axis. Like X it swaps |0⟩ and |1⟩, but it also shifts the phase.',
  Z: 'You applied Z: the arrow turned 180° around the Z axis. The chances of 0 and 1 stay the same; only the phase flips.',
  H: 'You applied H (Hadamard): the arrow turned 180° around the axis halfway between X and Z. It takes |0⟩ to |+⟩, an even mix of 0 and 1.',
  S: 'You applied S: a quarter turn (90°) around Z. The chances stay the same; the phase moves by 90°.',
  T: 'You applied T: an eighth of a turn (45°) around Z. Two T gates make one S.',
  Rx: 'You applied Rx(π/2): the arrow turned 90° around the X axis.',
  Ry: 'You applied Ry(π/2): the arrow turned 90° around the Y axis.',
  Rz: 'You applied Rz(π/2): the arrow turned 90° around the Z axis.',
};

function render() {
  const { theta, phi } = toAngles(v);
  $('#theta').val(Math.round(theta / DEG));
  $('#phi').val(Math.round(phi / DEG) % 360);
  $('#theta-out').text(angle(theta));
  $('#phi-out').text(angle(phi));
  scene.setVector(v);

  const a = Math.cos(theta / 2), b = Math.sin(theta / 2);
  const phase = b < 1e-9 ? '' : String.raw`\,e^{i\,${(phi / Math.PI).toFixed(2)}\pi}`;
  tex('#psi', String.raw`|\psi\rangle = ${a.toFixed(3)}\,|0\rangle + ${b.toFixed(3)}${phase}\,|1\rangle`);
  $('#xyz').text(`(${num(v.x)}, ${num(v.y)}, ${num(v.z)})`);
  const p0 = probFirst(v, 'Z');
  $('#p0-bar').css('width', pct(p0));
  $('#p0').text(`0: ${pct(p0)}`);
  $('#p1').text(`1: ${pct(1 - p0)}`);
  tex('#math', String.raw`|\psi\rangle = \cos\tfrac{\theta}{2}\,|0\rangle + e^{i\varphi}\sin\tfrac{\theta}{2}\,|1\rangle \\[4pt] \theta = ${angle(theta).replace('°', '^\\circ')},\ \varphi = ${angle(phi).replace('°', '^\\circ')} \\[4pt] P(0) = \cos^2\tfrac{\theta}{2} = ${p0.toFixed(3)}`, true);
}

function say(text: string, matrix = '') {
  $('#story').text(text);
  if (matrix) tex('#matrix', matrix, true);
  else $('#matrix').empty();
}

// Turn the arrow along the shortest path (or a given rotation), drawing the trail as it goes.
function animate(to: Vector3, q = new Quaternion().setFromUnitVectors(v.clone().normalize(), to.clone().normalize()), ms = 700) {
  const from = v.clone();
  const path = Array.from({ length: 41 }, (_, i) => from.clone().applyQuaternion(new Quaternion().slerp(q, i / 40)));
  scene.setTrail(path);
  busy = true;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    v = from.clone().applyQuaternion(new Quaternion().slerp(q, e));
    render();
    if (t < 1) requestAnimationFrame(step);
    else { v = to.clone(); render(); busy = false; }
  };
  requestAnimationFrame(step);
}

function remember() {
  undoStack.push(v.clone());
  if (undoStack.length > 100) undoStack.shift();
}

$('[data-gate]').on('click', function () {
  if (busy) return;
  const g = GATES[$(this).data('gate') as string];
  remember();
  say(GATE_STORY[$(this).data('gate') as string], g.matrix);
  animate(apply(g, v), rotation(g));
});

$('#theta, #phi').on('pointerdown keydown', () => remember()).on('input', () => {
  v = fromAngles(Number($('#theta').val()) * DEG, Number($('#phi').val()) * DEG);
  scene.setTrail([]);
  say('You set the angles directly: θ tilts the arrow away from |0⟩, φ turns it around the equator.');
  render();
});

$('[data-preset]').on('click', function () {
  if (busy) return;
  const [t, p] = String($(this).data('preset')).split(',').map(Number);
  remember();
  say(`You jumped to ${$(this).text()}.`);
  animate(fromAngles(t * DEG, p * DEG));
});

$('#undo').on('click', () => {
  if (busy) return;
  const prev = undoStack.pop();
  if (!prev) return;
  say('Undone: the arrow went back to where it was.');
  animate(prev);
});

$('#reset').on('click', () => {
  if (busy) return;
  remember();
  say('Back to the start: |0⟩, the arrow points straight up.');
  animate(new Vector3(0, 0, 1));
  showHistogram(null);
});

$('[data-basis]').on('click', function () {
  basis = $(this).data('basis') as Basis;
  $('[data-basis]').attr('aria-pressed', 'false');
  $(this).attr('aria-pressed', 'true');
  const [a, b] = BASIS_LABELS[basis];
  $('#l0').text(a);
  $('#l1').text(b);
  showHistogram(null);
});

function showHistogram(counts: [number, number] | null) {
  const p = probFirst(v, basis);
  const [a, b] = counts ?? [0, 0];
  const total = a + b || 1;
  $('#h0').css('height', pct(a / total));
  $('#h1').css('height', pct(b / total));
  $('#m0').css('bottom', pct(p));
  $('#m1').css('bottom', pct(1 - p));
  const [la, lb] = BASIS_LABELS[basis];
  $('#hist-note').text(counts ? `${la}: ${a} times, ${lb}: ${b} times. Predicted ${pct(p)} / ${pct(1 - p)} (the lines).` : `Lines show the predicted chances: ${pct(p)} / ${pct(1 - p)}.`);
}

$('#once').on('click', () => {
  if (busy) return;
  const before = probFirst(v, basis);
  const { first, after } = measure(v, basis);
  const [la, lb] = BASIS_LABELS[basis];
  remember();
  say(`You measured along ${basis} and got ${first ? la : lb}. The arrow jumped to that pole: measuring changes the state. The chance was ${pct(first ? before : 1 - before)}.`);
  animate(after, undefined, 350);
  showHistogram(first ? [1, 0] : [0, 1]);
});

$('#many').on('click', () => {
  if (busy) return;
  const n = sample(v, basis, 1000);
  say(`You measured 1000 fresh copies of this state along ${basis}. Each copy gives one answer; together they show the chances. The state itself is unchanged.`);
  showHistogram([n, 1000 - n]);
});

scene.setColors();
say('The arrow points straight up: this is 0. Try H first: it turns the arrow to an even mix of 0 and 1. Then measure a few times.');
render();
showHistogram(null);
