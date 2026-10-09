// The laboratory page.
import { fillIcons } from './common';
import $ from 'jquery';
import { Quaternion, Vector3 } from 'three';
import { BASIS_LABELS, GATES, allBases, apply, customGate, densityMatrix, fromAngles, measure, probFirst, randomState, rotGate, rotation, sample, stateName, toAngles, tomography, type Basis, type Gate } from './bloch';
import { TASKS, judge, type Task } from './tasks';
import { BlochScene } from './scene';
import { onLang, t } from './i18n';
import type { Key } from './strings';
import { parsePi, piText, readShared, shareUrl } from './state-url';
import { blochFromAmplitudes, parseComplex } from './amplitudes';
import { SOURCES } from './content/sources';

// reference numbers match the Notation & Sources page
$('[data-src]').each(function () {
  this.textContent = `[${SOURCES.findIndex((s) => s.id === this.dataset.src) + 1}]`;
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new BlochScene($('#sphere')[0], { guides: true, zoom: true });
let v = fromAngles(Math.PI / 2, 0); // the design opens on |+⟩
let dir = v.clone(); // last direction, kept when the arrow shrinks to the centre
// a measurement basis: Z, X, Y, or a custom axis n ('N')
type MBasis = Basis | 'N';
let basis: MBasis = 'Z';
let nAxis = fromAngles(Math.PI / 4, 0);
const axisFor = (b: MBasis) => (b === 'N' ? nAxis : b);
const labelsFor = (b: MBasis): [string, string] => (b === 'N' ? ['+n', '−n'] : BASIS_LABELS[b]);
const basisName = (b: MBasis) => (b === 'N' ? 'n' : b);
let shots = 1000;
let rotAngle = 'π/4';
const DEG: Record<string, string> = { 'π/8': '22.5°', 'π/4': '45°', 'π/2': '90°', π: '180°' };
let busy = false;
let counts = { first: 0, second: 0 };
const lang = () => document.documentElement.lang;

const pct = (p: number) => `${Math.max(0, p * 100).toFixed(1)}%`; // never “−0.0%” from rounding noise
const signed = (x: number) => (Math.abs(x) < 0.0005 ? '0.000' : `${x > 0 ? '+' : ''}${x.toFixed(3)}`.replace('-', '−'));
const deg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(1)}°`;

function render() {
  const r = v.length();
  const centre = r < 1e-6;
  if (!centre) dir = v.clone().normalize();
  const { theta, phi } = toAngles(dir);
  const thPi = (theta / Math.PI).toFixed(2), phPi = (phi / Math.PI).toFixed(2);
  // the sliders count whole degrees, so their ends are exactly π and 2π. φ = 2π is the same
  // point as 0, and at a pole φ means nothing: there the slider keeps what the user set.
  const atPole = Math.sin(theta) < 1e-9;
  const phiDeg = Math.round((phi * 180) / Math.PI) % 360, phiSlider = Number($('#slider-phi').val());
  const phiShown = atPole ? (phiSlider * Math.PI) / 180 : phiSlider === 360 && phiDeg === 0 ? 2 * Math.PI : phi;
  if (!centre) {
    $('#slider-theta').val(Math.round((theta * 180) / Math.PI));
    if (!atPole && phiDeg !== phiSlider % 360) $('#slider-phi').val(phiDeg);
  }
  $('#slider-radius').val(r);
  const p0 = (1 + v.z) / 2;
  $('#readout-p').text(`P(|0⟩) = ${r >= 0.995 ? 'cos²(θ/2)' : '(1 + r·cos θ)/2'} = ${pct(p0)} · P(|1⟩) = ${pct(1 - p0)}`);
  $('#readout-theta').text(centre ? '—' : `${thPi} π (${deg(theta)})`);
  $('#readout-phi').text(centre ? '—' : `${(phiShown / Math.PI).toFixed(2)} π (${deg(phiShown)})`);
  $('#readout-r').text(`${r.toFixed(2)} (${t(r >= 0.995 ? 'r.pure' : centre ? 'r.maxMixed' : 'r.mixed')})`);
  $('#coord-x').text(signed(v.x));
  $('#coord-y').text(signed(v.y));
  $('#coord-z').text(signed(v.z));

  // chance in all three bases at once
  const all = allBases(v);
  $('#bases [data-row]').each(function () {
    const [p0, p1] = all[this.dataset.row as Basis];
    $(this).find('i').first().css('width', pct(p0));
    $(this).find('b').text(`${pct(p0)} / ${pct(p1)}`);
  });
  $('#theory-mark').css('left', pct(probFirst(v, axisFor(basis))));
  paintCounts();

  // ρ = ½ (I + r·σ), row by row
  const cplx = (re: number, im: number) => {
    const f = (x: number) => x.toFixed(3).replace('-', '−');
    if (Math.abs(im) < 5e-4) return f(Math.abs(re) < 5e-4 ? 0 : re);
    if (Math.abs(re) < 5e-4) return `${f(im)}i`;
    return `${f(re)} ${im < 0 ? '−' : '+'} ${Math.abs(im).toFixed(3)}i`;
  };
  $('#rho-cells').empty().append(densityMatrix(v).map(([re, im]) => $('<span>').text(cplx(re, im))));

  // relative-phase dial: hand at φ, as long as |β|² = P(|1⟩)
  const p1 = all.Z[1];
  const len = 4 + 16 * p1;
  $('#dial-hand').attr({ x2: (len * Math.cos(phi)).toFixed(2), y2: (-len * Math.sin(phi)).toFixed(2), opacity: centre || Math.sin(theta) < 1e-6 ? 0.3 : 1 });
  $('#readout-dial').text(centre ? 'φ = —' : `φ = ${phPi} π (${deg(phi)})`);

  const purity = ((1 + r * r) / 2).toFixed(3);
  if (r >= 0.995) {
    const phase = phi > 0.005 && Math.sin(theta) > 1e-6 ? `e^(i·${phPi}π)·` : '';
    const name = stateName(v);
    $('#formula-numeric').text(`${Math.cos(theta / 2).toFixed(3)} |0⟩ + ${phase}${Math.sin(theta / 2).toFixed(3)} |1⟩${name ? ` = ${name}` : ''}`);
    $('#norm').text(`⟨ψ|ψ⟩ = 1 · Tr ρ² = ${purity}`);
  } else {
    $('#formula-numeric').text(t('formula.mixed', { r: r.toFixed(2) }));
    $('#norm').text(`Tr ρ = 1 · Tr ρ² = ${purity}`);
  }
  $('#quick-rotation-badge').text(centre ? '—' : `Rz(${phPi}π)·Ry(${thPi}π)`);
  scene.setVector(v);
}

// what just happened: kept as keys so a language switch can re-say it
type Said = { text: Key; params: Record<string, string | number>; tag: Key; tagParams: Record<string, string | number> };
let said: Said = { text: 'story.initial', params: {}, tag: 'action.initial', tagParams: {} };
let shownGate: { gate: Gate; label: Key; lp?: Record<string, string> } = { gate: GATES.H, label: 'label.H' };

function explain(text: Key, tag: Key, params: Record<string, string | number> = {}, tagParams: Record<string, string | number> = {}, gate?: { gate: Gate; label: Key; lp?: Record<string, string> }) {
  said = { text, params, tag, tagParams };
  if (gate) shownGate = gate;
  paintExplain();
}

function paintExplain() {
  $('#narrative-text').text(t(said.text, said.params));
  const { gate, label } = shownGate;
  $('#matrix-label').text(t(label, shownGate.lp));
  $('#matrix-prefix').text(gate.prefix);
  $('#matrix-cells').empty().append(gate.cells.map((c) => $('<span>').text(c)));
  const n = gate.axis.clone().normalize();
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2).replace('-', '−'));
  $('#matrix-axis').text(`U = e^(iγ)·Rn(α) · n = (${f(n.x)}, ${f(n.y)}, ${f(n.z)}) · α = ${piText(gate.angle)}`);
}

// ---------- history: every step, a chip for each; undo and the chips move along it ----------
type Step = { label: string; measure?: boolean; kind?: 'gate' | 'other'; v: Vector3; said: Said; gate: typeof shownGate };
let steps: Step[] = [];
let cursor = 0;

function record(label: string, measureStep = false, kind: 'gate' | 'other' = 'other') {
  steps = steps.slice(0, cursor + 1);
  steps.push({ label, measure: measureStep, kind, v: v.clone(), said: { ...said }, gate: shownGate });
  if (steps.length > 40) { steps.shift(); if (task) task.startIdx = Math.max(0, task.startIdx - 1); }
  cursor = steps.length - 1;
  paintHistory();
  paintTask();
}

function paintHistory() {
  const ol = $('#history').empty();
  const first = Math.max(0, Math.min(cursor, steps.length - 6)); // one line: the newest 6 steps
  if (first) ol.append($('<li class="text-on-surface-variant px-1">').text(`… +${first}`));
  steps.forEach((s, i) => {
    if (i < first) return;
    if (i > first || first) ol.append($('<li aria-hidden="true" class="text-outline-variant">').text('→'));
    const chip = $('<button type="button" class="chip px-2 py-0.5 min-h-6 whitespace-nowrap">').text(s.label)
      .attr({ 'aria-current': i === cursor ? 'step' : null, title: t('history.goto', { n: i + 1 }) })
      .addClass(i === cursor ? 'border-2 border-primary bg-white text-primary font-bold'
        : s.measure ? 'border border-tertiary bg-tertiary-fixed text-tertiary font-bold' : 'border border-outline clean-paper text-on-surface')
      .addClass(i > cursor ? 'opacity-50' : '')
      .on('click', () => goTo(i));
    ol.append($('<li>').append(chip));
  });
}

function goTo(i: number) {
  if (busy || i === cursor || !steps[i]) return;
  const from = steps[cursor], to = steps[i], back = i === cursor - 1;
  cursor = i;
  newState();
  animate(to.v, undefined, 400, () => {
    shownGate = to.gate;
    if (back) explain(from.measure ? 'story.undoMeasure' : 'story.undo', 'action.undo');
    else explain('story.goto', 'action.undo', { n: i + 1, label: to.label });
    paintTask();
  });
  paintHistory();
}

// Turn the arrow along a true rotation (or the shortest path); the path joins the fading trail.
function animate(to: Vector3, q?: Quaternion, ms = 600, done?: () => void) {
  const from = v.clone();
  const lenFrom = from.length(), lenTo = to.length();
  const fromDir = lenFrom > 1e-6 ? from.clone().normalize() : dir.clone();
  const toDir = lenTo > 1e-6 ? to.clone().normalize() : fromDir;
  const turn = q ?? new Quaternion().setFromUnitVectors(fromDir, toDir);
  const at = (e: number) => fromDir.clone().applyQuaternion(new Quaternion().slerp(turn, e)).multiplyScalar(lenFrom + (lenTo - lenFrom) * e);
  scene.addHistory(Array.from({ length: 41 }, (_, i) => at(i / 40)));
  if (reduced) ms = 0;
  busy = true;
  const start = performance.now();
  const step = (now: number) => {
    const k = ms ? Math.min(1, (now - start) / ms) : 1;
    v = at(1 - (1 - k) ** 3); // ease out, as in the design
    render();
    if (k < 1) requestAnimationFrame(step);
    else { v = to.clone(); render(); busy = false; scene.showTurn(null); done?.(); }
  };
  requestAnimationFrame(step);
}

// a new state: the counts and the collapse note belonged to the old one
function newState() {
  counts = { first: 0, second: 0 };
  scene.setGhost(null);
  $('#tomo-out').text('');
  paintCounts();
  $('#collapse-status').text(t('status.unmeasured'));
}

const AXES: Array<[string, Vector3]> = [['X', new Vector3(1, 0, 0)], ['Y', new Vector3(0, 1, 0)], ['Z', new Vector3(0, 0, 1)], ['(X+Z)/√2', new Vector3(Math.SQRT1_2, 0, Math.SQRT1_2)]];
function axisName(n: Vector3) {
  const u = n.clone().normalize();
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2));
  return AXES.find(([, a]) => a.distanceTo(u) < 1e-6)?.[0] ?? `(${f(u.x)}, ${f(u.y)}, ${f(u.z)})`;
}

function applyGate(g: Gate, story: Key, tag: Key, label: Key, chip: string, params: Record<string, string | number> = {}, tagParams: Record<string, string | number> = {}, lp?: Record<string, string>) {
  if (busy) return;
  scene.preview(null, null);
  newState();
  // a negative angle is a turn the other way: show it as such
  scene.showTurn(g.axis, t('turn.label', { angle: piText(g.angle), axis: axisName(g.axis) }));
  animate(v.clone().applyQuaternion(rotation(g)), rotation(g), 700, () => {
    explain(story, tag, params, tagParams, { gate: g, label, lp });
    record(chip, false, 'gate');
  });
}

const GATE_CHIP: Record<string, string> = { Sdg: 'S†', Tdg: 'T†', SX: '√X' };
const isRot = (name: string): name is 'Rx' | 'Ry' | 'Rz' => name === 'Rx' || name === 'Ry' || name === 'Rz';
const gateFor = (name: string) => (isRot(name) ? rotGate(name, rotAngle) : GATES[name]);
function gateByName(name: string) {
  const chip = isRot(name) ? `${name}(${rotAngle})` : GATE_CHIP[name] ?? name;
  const p: Record<string, string> = isRot(name) ? { a: rotAngle, deg: DEG[rotAngle] } : {};
  applyGate(gateFor(name), `story.${name}` as Key, 'action.gate', `label.${name}` as Key, chip, p, { gate: chip }, isRot(name) ? { a: rotAngle } : undefined);
}

// the angle the rotation gates turn by
function paintRot() {
  $('[data-rot]').each(function () {
    const on = this.dataset.rot === rotAngle;
    this.setAttribute('aria-pressed', String(on));
    this.className = `px-1.5 min-h-6 border text-[13px] ${on ? 'bg-primary text-on-primary border-primary font-bold' : 'clean-paper border-outline hover:bg-surface-container-high'}`;
  });
  $('[data-rot-sub]').each(function () { this.textContent = t('gate.rotSub', { deg: DEG[rotAngle], axis: this.dataset.rotSub! }); });
}
$('[data-rot]').on('click', function () { rotAngle = this.dataset.rot!; paintRot(); });

$('[data-gate]').on('click', function () { gateByName($(this).data('gate') as string); })
  // before applying: show the axis and where the arrow would land
  .on('mouseenter focus', function () {
    if (busy) return;
    const g = gateFor($(this).data('gate') as string);
    scene.preview(g.axis, apply(g, v));
  })
  .on('mouseleave blur', () => scene.preview(null, null));

$('#custom-rotation').on('submit', (e) => {
  e.preventDefault();
  const [th, ph, a] = ['#cr-theta', '#cr-phi', '#cr-angle'].map((id) => parsePi(String($(id).val())));
  if ([th, ph, a].some((x) => x === null)) { $('#cr-error').text(t('custom.error')); return; }
  $('#cr-error').text('');
  const g = customGate(th!, ph!, a!);
  const n = g.axis;
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2));
  applyGate(g, 'story.custom', 'action.custom', 'label.custom', `Rn(${piText(a!)})`, { angle: piText(a!), nx: f(n.x), ny: f(n.y), nz: f(n.z) });
});

function preset(theta: number, phi: number, label: string, keepLength = true) {
  if (busy) return;
  scene.preview(null, null);
  newState();
  const r = keepLength ? v.length() : 1;
  animate(fromAngles(theta, phi).multiplyScalar(r), undefined, 600, () => {
    if (!keepLength) explain('story.reset', 'action.preset');
    else if (r >= 0.995) explain('story.preset', 'action.preset', { label });
    else explain('story.presetMixed', 'action.preset', { label, r: r.toFixed(2) });
    record(label);
  });
}

$('[data-preset]').on('mouseenter focus', function () {
  if (busy) return;
  const [th, ph] = String($(this).data('preset')).split(',').map(Number);
  scene.preview(null, fromAngles(th * Math.PI, ph * Math.PI).multiplyScalar(v.length() > 1e-6 ? v.length() : 1));
}).on('mouseleave blur', () => scene.preview(null, null));

$('[data-preset]').on('click', function () {
  const [th, ph] = String($(this).data('preset')).split(',').map(Number);
  preset(th * Math.PI, ph * Math.PI, $(this).data('label') as string);
});

const reset = () => preset(0, 0, '|0⟩', false);
const undo = () => goTo(cursor - 1);
const clearTrail = () => scene.clearHistory();
// a fresh start from here: the strip keeps only the present step
function clearHistory() {
  if (busy) return;
  steps = [steps[cursor]];
  cursor = 0;
  if (task) task.startIdx = 0;
  clearTrail();
  paintHistory();
  paintTask();
}
$('[data-action="clear-history"]').on('click', clearHistory);
$('[data-action="reset-zero"]').on('click', reset);
$('[data-action="undo"]').on('click', undo);
$('[data-action="clear-trail"]').on('click', clearTrail);

$('[data-action="random"]').on('click', () => {
  if (busy) return;
  const to = randomState();
  const { theta, phi } = toAngles(to);
  newState();
  animate(to, undefined, 600, () => {
    explain('story.random', 'action.typed', { theta: piText(theta), phi: piText(phi) });
    record(t('chip.random'));
  });
});

// typed values: exact angles, or the amplitudes α and β
function typed(to: Vector3, chip: string, story: Key, params: Record<string, string | number>) {
  if (busy) return;
  $('#ex-error').text('');
  newState();
  animate(to, undefined, 600, () => {
    explain(story, 'action.typed', params);
    record(chip);
  });
}
$('#exact-angles').on('submit', (e) => {
  e.preventDefault();
  const th = parsePi(String($('#ex-theta').val())), ph = parsePi(String($('#ex-phi').val()));
  if (th === null || ph === null || th < -1e-9 || th > Math.PI + 1e-9) { $('#ex-error').text(t('exact.errAngles')); return; }
  const r = v.length() > 1e-6 ? v.length() : 1;
  const phi = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  typed(fromAngles(Math.min(Math.PI, Math.max(0, th)), phi).multiplyScalar(r), 'θ,φ', 'story.typedAngles', { theta: piText(th), phi: piText(phi) });
});
$('#exact-amps').on('submit', (e) => {
  e.preventDefault();
  const a = String($('#ex-alpha').val()), b = String($('#ex-beta').val());
  const ca = parseComplex(a), cb = parseComplex(b);
  const got = ca && cb ? blochFromAmplitudes(ca, cb) : null;
  if (!got) { $('#ex-error').text(t('exact.errAmps')); return; }
  const norm = Math.abs(got.norm - 1) > 1e-6 ? t('exact.normalised', { n: `√${got.norm.toFixed(3).replace(/\.?0+$/, '')}` }) : '';
  typed(got.v, 'α,β', 'story.typedAmps', { a, b, norm });
});

$('#slider-theta, #slider-phi').on('input', () => {
  const r = Number($('#slider-radius').val());
  const rad = (id: string) => (Number($(id).val()) * Math.PI) / 180;
  v = fromAngles(rad('#slider-theta'), rad('#slider-phi')).multiplyScalar(r);
  if (r < 1e-6) dir = fromAngles(rad('#slider-theta'), rad('#slider-phi'));
  scene.addHistory([v.clone()]);
  newState();
  explain('story.angles', 'action.angles');
  render();
}).on('change', () => record('θ,φ'));

$('#slider-radius').on('input', () => {
  const r = Number($('#slider-radius').val());
  v = dir.clone().multiplyScalar(r);
  newState();
  if (r >= 0.995) explain('story.pure', 'action.length');
  else explain('story.mixed', 'action.length', { r: r.toFixed(2) });
  render();
}).on('change', () => record(`r=${v.length().toFixed(2)}`));

// measurement
function paintBasis() {
  $('#custom-axis').toggleClass('hidden', basis !== 'N');
  scene.setMeasureAxis(basis === 'N' ? nAxis : null);
  $('[data-basis]').each(function () {
    const on = $(this).data('basis') === basis;
    this.className = on
      ? 'py-1.5 min-h-6 bg-primary text-on-primary font-bold border border-outline'
      : 'py-1.5 min-h-6 clean-paper border border-outline text-on-surface hover:bg-surface';
    this.setAttribute('aria-pressed', String(on));
  });
}

function paintCounts() {
  const total = counts.first + counts.second;
  const [a, b] = labelsFor(basis);
  const pa = total ? counts.first / total : 0, pb = total ? counts.second / total : 0;
  $('#count-result-0').text(`${a}: ${counts.first} (${pct(pa)})`);
  $('#count-result-1').text(`${b}: ${counts.second} (${pct(pb)})`);
  $('#bar-measure-0').css('width', pct(pa));
  $('#bar-measure-1').css('width', pct(pb));
  // what the black line means, and how far a run may honestly stray from it (one standard deviation)
  const p = probFirst(v, axisFor(basis));
  const spread = total >= 20 ? t('measure.spread', { n: total.toLocaleString(lang()), s: pct(Math.sqrt((p * (1 - p)) / total)) }) : '';
  $('#measure-expect').text(t('measure.expect', { p: pct(p), a }) + spread);
}

$('[data-basis]').on('click', function () {
  basis = $(this).data('basis') as MBasis;
  counts = { first: 0, second: 0 };
  paintBasis();
  paintCounts();
  render();
  $('#collapse-status').text(t('status.ready', { basis: basisName(basis) }));
});

$('#custom-axis').on('submit', (e) => {
  e.preventDefault();
  const th = parsePi(String($('#ax-theta').val())), ph = parsePi(String($('#ax-phi').val()));
  if (th === null || ph === null || th < -1e-9 || th > Math.PI + 1e-9) { $('#ax-error').text(t('measure.axisErr')); return; }
  $('#ax-error').text('');
  nAxis = fromAngles(Math.min(Math.PI, Math.max(0, th)), ph);
  counts = { first: 0, second: 0 };
  paintBasis();
  render();
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2).replace('-', '−'));
  explain('story.axis', 'action.once', { nx: f(nAxis.x), ny: f(nAxis.y), nz: f(nAxis.z) });
});

function paintShots() {
  $('[data-shots]').each(function () {
    const on = Number(this.dataset.shots) === shots;
    this.setAttribute('aria-pressed', String(on));
    this.textContent = Number(this.dataset.shots).toLocaleString(lang());
    this.className = `px-2 min-h-6 border ${on ? 'bg-primary text-on-primary border-primary font-bold' : 'clean-paper border-outline hover:bg-surface-container-high'}`;
  });
  $('#many-label').text(t('measure.manyN', { n: shots.toLocaleString(lang()) }));
}
$('[data-shots]').on('click', function () { shots = Number(this.dataset.shots); paintShots(); });

$('[data-action="tomography"]').on('click', () => {
  if (busy) return;
  const { r, sd } = tomography(v, shots);
  const f = (x: number) => (Math.abs(x) < 5e-4 ? '0.000' : x.toFixed(3).replace('-', '−'));
  scene.setGhost(r, t('tomo.label'));
  $('#tomo-out').text(t('tomo.out', { x: f(r.x), y: f(r.y), z: f(r.z), s: f(Math.max(sd.x, sd.y, sd.z)), rx: f(v.x), ry: f(v.y), rz: f(v.z), d: f(r.distanceTo(v)) }));
  explain('story.tomo', 'action.many', { n: shots.toLocaleString(lang()) });
});

function measureOnce() {
  if (busy) return;
  const before = probFirst(v, axisFor(basis));
  const { first, after } = measure(v, axisFor(basis));
  const [a, b] = labelsFor(basis);
  const result = first ? a : b;
  // the run so far belongs to the state before; after this shot the state is the pole it found
  const sameState = v.distanceTo(after) < 1e-9;
  if (!sameState) counts = { first: 0, second: 0 };
  counts[first ? 'first' : 'second']++;
  animate(after, undefined, 250, () => {
    explain('story.once', 'action.once', { basis: basisName(basis), result, p: pct(first ? before : 1 - before) });
    record(`M(${basisName(basis)})→${result}`, true);
  });
  $('#collapse-status').empty().append($('<span class="text-primary font-bold">').text(t('status.collapsed', { result })));
  paintCounts();
}
$('[data-action="measure-once"]').on('click', measureOnce);

$('[data-action="measure-many"]').on('click', () => {
  if (busy) return;
  const n = sample(v, axisFor(basis), shots);
  counts.first += n;
  counts.second += shots - n;
  $('#collapse-status').empty().append($('<span class="text-secondary font-bold">').text(t('status.sampled', { n: (counts.first + counts.second).toLocaleString(lang()) })));
  explain('story.many', 'action.many', { basis: basisName(basis), n: shots.toLocaleString(lang()) });
  paintCounts();
});

$('[data-action="clear"]').on('click', () => {
  counts = { first: 0, second: 0 };
  paintCounts();
  $('#collapse-status').text(t('status.cleared'));
});

// view, sharing and the guide
let rotating = false;
function paintRotate() {
  const btn = $('#btn-autorotate')[0];
  btn.textContent = t('autorotate', { state: t(rotating ? 'on' : 'off') });
  btn.setAttribute('aria-pressed', String(rotating));
  btn.className = rotating
    ? 'px-2.5 py-1 min-h-6 text-[13px] font-label-sm bg-primary text-on-primary border border-outline font-bold whitespace-nowrap'
    : 'px-2.5 py-1 min-h-6 text-[13px] font-label-sm clean-paper border border-outline hover:bg-surface-container-high whitespace-nowrap';
}
$('#btn-autorotate').on('click', () => {
  rotating = !rotating;
  scene.setAutoRotate(rotating);
  paintRotate();
});
$('[data-action="reset-view"]').on('click', () => scene.resetView());
const zoomIn = () => scene.zoomBy(1.25), zoomOut = () => scene.zoomBy(0.8);
$('[data-action="zoom-in"]').on('click', zoomIn);
$('[data-action="zoom-out"]').on('click', zoomOut);

let toastTimer = 0;
function toast(text: string, ms = 2200) {
  $('#toast').text(text).removeClass('hidden');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $('#toast').addClass('hidden'), ms);
}
$('[data-action="share"]').on('click', async () => {
  const url = shareUrl(v);
  history.replaceState(null, '', url);
  try {
    await navigator.clipboard.writeText(url);
    toast(t('share.copied'));
  } catch {
    toast(t('share.failed'));
  }
});

const modal = $('#guide-modal');
let opener: HTMLElement | null = null;
function closeGuide() {
  if (modal.hasClass('hidden')) return;
  modal.addClass('hidden').removeClass('flex');
  opener?.focus();
}
$('[data-action="guide"]').on('click', function () {
  opener = this;
  modal.removeClass('hidden').addClass('flex');
  modal.find('[data-action="close-guide"]').last().trigger('focus');
});
$('[data-action="close-guide"]').on('click', closeGuide);
modal.on('click', (e) => { if (e.target === modal[0]) closeGuide(); });

// ---------- tasks ----------
let task: { t: Task; startIdx: number } | null = null;
const DONE_KEY = 'bloch-tasks-done';
function doneSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]') as string[]); } catch { return new Set(); }
}
function markDone(id: string) {
  const d = doneSet();
  d.add(id);
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...d])); } catch { /* private mode: the tick lasts this visit */ }
}
function paintTasks() {
  const done = doneSet();
  $('#task-list').empty().append(TASKS.map((tk, i) => $('<li class="clean-paper border border-outline-variant p-3 flex items-start gap-3">').append(
    $('<div class="flex-1 min-w-0">').append(
      $('<h3 class="font-label-md text-[14px] font-bold text-on-surface flex items-center gap-1.5">').append(
        $('<span class="text-on-surface-variant">').text(`${i + 1}.`), $('<span>').text(t(`task.${tk.id}.title` as Key)),
        done.has(tk.id) ? $('<span class="font-label-sm text-[13px] text-secondary flex items-center gap-1">').append($('<i class="icon size-[15px]" data-icon="task_alt">'), $('<span>').text(t('task.done'))) : ''),
      $('<p class="font-body-md text-[15px] text-on-surface-variant leading-snug">').text(t(`task.${tk.id}.goal` as Key)),
    ),
    $('<button type="button" class="shrink-0 px-2.5 py-1 min-h-6 border border-outline clean-paper hover:bg-surface-container-high font-label-sm text-[13px] font-bold">')
      .text(t(done.has(tk.id) ? 'task.again' : 'task.start')).on('click', () => startTask(tk)),
  )));
  fillIcons($('#task-list')[0]);
}
function paintTask() {
  if (!task) { $('#task-active').addClass('hidden'); return; }
  const { t: tk, startIdx } = task;
  const kinds = steps.slice(startIdx + 1, cursor + 1).map((st) => st.kind ?? 'other');
  const res = judge(tk, v, kinds);
  $('#task-active').removeClass('hidden');
  $('#task-title').text(t(`task.${tk.id}.title` as Key));
  $('#task-goal').text(t(`task.${tk.id}.goal` as Key));
  $('#task-progress').text(tk.maxGates !== undefined ? t('task.gatesMax', { k: res.gates, m: tk.maxGates }) : t('task.gates', { k: res.gates }));
  const fb = $('#task-feedback').removeClass('text-secondary text-error text-on-tertiary-fixed');
  if (res.state === 'solved') {
    fb.addClass('text-secondary').text(t('task.solved'));
    if (!doneSet().has(tk.id)) { markDone(tk.id); paintTasks(); }
  } else if (res.state === 'going') fb.addClass('text-on-tertiary-fixed').text(t('task.going'));
  else fb.addClass('text-error').text(t(res.state === 'tooMany' ? 'task.tooMany' : 'task.gatesOnly'));
}
function startTask(tk: Task) {
  if (busy) return;
  task = { t: tk, startIdx: 0 };
  scene.preview(null, null);
  scene.setTarget(tk.target ?? null, t('task.goal'));
  newState();
  animate(tk.start.clone(), undefined, 500, () => {
    explain('story.preset', 'action.preset', { label: stateName(tk.start) ?? '|ψ⟩' });
    steps = [{ label: stateName(tk.start) ?? '|ψ⟩', kind: 'other', v: v.clone(), said: { ...said }, gate: shownGate }];
    cursor = 0;
    clearTrail();
    paintHistory();
    paintTask();
  });
}
$('[data-action="task-restart"]').on('click', () => { if (task) startTask(task.t); });
$('[data-action="task-stop"]').on('click', () => { task = null; scene.setTarget(null); paintTask(); });

// control deck tabs (WAI-ARIA tabs: arrows move between them)
const tabs = $('[role="tab"]');
function showTab(name: string, focus = false) {
  tabs.each(function () {
    const on = this.dataset.tab === name;
    this.setAttribute('aria-selected', String(on));
    this.tabIndex = on ? 0 : -1;
    this.className = on ? 'py-2.5 border-b-2 border-primary text-primary font-bold' : 'py-2.5 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface';
    $(`#panel-${this.dataset.tab}`).toggleClass('hidden', !on);
    if (on && focus) this.focus();
  });
}
tabs.on('click', function () { showTab(this.dataset.tab!); }).on('keydown', function (e) {
  const names = tabs.toArray().map((el) => el.dataset.tab!);
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!step) return;
  e.preventDefault();
  e.stopPropagation();
  showTab(names[(names.indexOf(this.dataset.tab!) + step + names.length) % names.length], true);
});

// keyboard: a key per gate, as in Siddhant Singh's and Quantum Sandbox's simulators
const KEYS: Record<string, () => void> = {
  x: () => gateByName('X'), y: () => gateByName('Y'), z: () => gateByName('Z'), h: () => gateByName('H'),
  s: () => gateByName('S'), S: () => gateByName('Sdg'), t: () => gateByName('T'), T: () => gateByName('Tdg'),
  m: measureOnce, u: undo, c: clearTrail, r: reset, '?': () => toast(t('keys.list'), 6000),
  '+': zoomIn, '=': zoomIn, '-': zoomOut,
};
$(document).on('keydown', (e) => {
  if (e.key === 'Escape') { closeGuide(); return; }
  const el = e.target as unknown as HTMLElement;
  if (e.ctrlKey || e.metaKey || e.altKey || !modal.hasClass('hidden') || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return;
  const key = e.key.length === 1 && e.shiftKey && /[st]/i.test(e.key) ? e.key.toUpperCase() : e.key.length === 1 && !e.shiftKey ? e.key.toLowerCase() : e.key;
  const run = KEYS[key];
  if (!run) return;
  e.preventDefault();
  run();
});

onLang(() => {
  paintExplain();
  paintCounts();
  paintRotate();
  paintHistory();
  paintRot();
  paintShots();
  paintTasks();
  paintTask();
  render();
});

// start: a shared link, or |+⟩
const shared = readShared();
if (shared) {
  v = shared;
  const { theta, phi } = toAngles(v.length() > 1e-6 ? v : dir);
  explain('story.shared', 'action.shared', { theta: piText(theta), phi: piText(phi), r: v.length().toFixed(2) });
} else {
  paintExplain();
}
render();
steps = [{ label: stateName(v) ?? '|ψ⟩', v: v.clone(), said: { ...said }, gate: shownGate }];
cursor = 0;
paintHistory();
paintBasis();
paintCounts();
paintRotate();
paintRot();
paintShots();
paintTasks();
$('#collapse-status').text(t('status.unmeasured'));
