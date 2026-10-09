// The laboratory page.
import './common';
import $ from 'jquery';
import { Quaternion, Vector3 } from 'three';
import { BASIS_LABELS, GATES, customGate, fromAngles, measure, probFirst, rotation, sample, toAngles, type Basis, type Gate } from './bloch';
import { BlochScene } from './scene';
import { onLang, t } from './i18n';
import type { Key } from './strings';
import { parsePi, piText, readShared, shareUrl } from './state-url';
import { SOURCES } from './content/sources';

// reference numbers match the Notation & Sources page
$('[data-src]').each(function () {
  this.textContent = `[${SOURCES.findIndex((s) => s.id === this.dataset.src) + 1}]`;
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new BlochScene($('#sphere')[0]);
let v = fromAngles(Math.PI / 2, 0); // the design opens on |+⟩
let dir = v.clone(); // last direction, kept when the arrow shrinks to the centre
let basis: Basis = 'Z';
let busy = false;
let counts = { first: 0, second: 0 };
const undoStack: Array<{ v: Vector3; measured: boolean }> = [];

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const signed = (x: number) => (Math.abs(x) < 0.0005 ? '0.000' : `${x > 0 ? '+' : ''}${x.toFixed(3)}`.replace('-', '−'));
const deg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(1)}°`;

function render() {
  const r = v.length();
  const centre = r < 1e-6;
  if (!centre) dir = v.clone().normalize();
  const { theta, phi } = toAngles(dir);
  const thPi = (theta / Math.PI).toFixed(2), phPi = (phi / Math.PI).toFixed(2);
  if (!centre) {
    $('#slider-theta').val(theta);
    $('#slider-phi').val(phi);
  }
  $('#slider-radius').val(r);
  $('#readout-theta').text(centre ? '—' : `${thPi} π (${deg(theta)})`);
  $('#readout-phi').text(centre ? '—' : `${phPi} π (${deg(phi)})`);
  $('#readout-half').text(centre ? '—' : deg(theta / 2));
  $('#readout-r').text(`${r.toFixed(2)} (${t(r >= 0.995 ? 'r.pure' : 'r.mixed')})`);
  $('#coord-x').text(signed(v.x));
  $('#coord-y').text(signed(v.y));
  $('#coord-z').text(signed(v.z));

  const p0 = probFirst(v, 'Z');
  $('#prob-0-text').text(pct(p0));
  $('#prob-1-text').text(pct(1 - p0));
  $('#bar-prob-0').css('width', pct(p0));
  $('#bar-prob-1').css('width', pct(1 - p0));
  $('#theory-mark').css('left', pct(probFirst(v, basis)));

  const purity = ((1 + r * r) / 2).toFixed(3);
  if (r >= 0.995) {
    const phase = phi > 0.005 && Math.sin(theta) > 1e-6 ? `e^(i·${phPi}π)·` : '';
    $('#formula-numeric').text(`${Math.cos(theta / 2).toFixed(3)} |0⟩ + ${phase}${Math.sin(theta / 2).toFixed(3)} |1⟩`);
    $('#norm').text(`⟨ψ|ψ⟩ = 1 · Tr ρ² = ${purity}`);
  } else {
    $('#formula-numeric').text(t('formula.mixed', { r: r.toFixed(2) }));
    $('#norm').text(`Tr ρ = 1 · Tr ρ² = ${purity}`);
  }
  $('#quick-rotation-badge').text(centre ? '—' : `Rz(${phPi}π)·Ry(${thPi}π)`);
  scene.setVector(v);
}

// what just happened: kept as keys so a language switch can re-say it
let said: { text: Key; params: Record<string, string | number>; tag: Key; tagParams: Record<string, string | number> } =
  { text: 'story.initial', params: {}, tag: 'action.initial', tagParams: {} };
let shownGate: { gate: Gate; label: Key } = { gate: GATES.H, label: 'label.H' };

function explain(text: Key, tag: Key, params: Record<string, string | number> = {}, tagParams: Record<string, string | number> = {}, gate?: { gate: Gate; label: Key }) {
  said = { text, params, tag, tagParams };
  if (gate) shownGate = gate;
  paintExplain();
}

function paintExplain() {
  $('#narrative-text').text(t(said.text, said.params));
  $('#last-action-tag').text(`${t('action.prefix')}: ${t(said.tag, said.tagParams)}`);
  const { gate, label } = shownGate;
  $('#matrix-label').text(t(label));
  $('#matrix-prefix').text(gate.prefix);
  $('#matrix-cells').empty().append(gate.cells.map((c) => $('<span>').text(c)));
  const n = gate.axis.clone().normalize();
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2).replace('-', '−'));
  $('#matrix-axis').text(`U = e^(iγ)·Rn(α) · n = (${f(n.x)}, ${f(n.y)}, ${f(n.z)}) · α = ${piText(gate.angle)}`);
}

// Turn the arrow along a true rotation (or the shortest path), drawing the trail as it goes.
function animate(to: Vector3, q?: Quaternion, ms = 600, done?: () => void) {
  const from = v.clone();
  const lenFrom = from.length(), lenTo = to.length();
  const fromDir = lenFrom > 1e-6 ? from.clone().normalize() : dir.clone();
  const toDir = lenTo > 1e-6 ? to.clone().normalize() : fromDir;
  const turn = q ?? new Quaternion().setFromUnitVectors(fromDir, toDir);
  const at = (e: number) => fromDir.clone().applyQuaternion(new Quaternion().slerp(turn, e)).multiplyScalar(lenFrom + (lenTo - lenFrom) * e);
  scene.setTrail(Array.from({ length: 41 }, (_, i) => at(i / 40)));
  if (reduced) ms = 0;
  busy = true;
  const start = performance.now();
  const step = (now: number) => {
    const k = ms ? Math.min(1, (now - start) / ms) : 1;
    v = at(1 - (1 - k) ** 3); // ease out, as in the design
    render();
    if (k < 1) requestAnimationFrame(step);
    else { v = to.clone(); render(); busy = false; done?.(); }
  };
  requestAnimationFrame(step);
}

function remember(measured = false) {
  undoStack.push({ v: v.clone(), measured });
  if (undoStack.length > 30) undoStack.shift();
}

// a new state: the counts and the collapse note belonged to the old one
function newState() {
  counts = { first: 0, second: 0 };
  paintCounts();
  $('#collapse-status').text(t('status.unmeasured'));
}

function applyGate(g: Gate, story: Key, tag: Key, label: Key, params: Record<string, string | number> = {}, tagParams: Record<string, string | number> = {}) {
  if (busy) return;
  remember();
  newState();
  animate(v.clone().applyQuaternion(rotation(g)), rotation(g), 600, () => explain(story, tag, params, tagParams, { gate: g, label }));
}

$('[data-gate]').on('click', function () {
  const name = $(this).data('gate') as string;
  applyGate(GATES[name], `story.${name}` as Key, 'action.gate', `label.${name}` as Key, {}, { gate: name });
});

$('#custom-rotation').on('submit', (e) => {
  e.preventDefault();
  const [th, ph, a] = ['#cr-theta', '#cr-phi', '#cr-angle'].map((id) => parsePi(String($(id).val())));
  if ([th, ph, a].some((x) => x === null)) { $('#cr-error').text(t('custom.error')); return; }
  $('#cr-error').text('');
  const g = customGate(th!, ph!, a!);
  const n = g.axis;
  const f = (x: number) => (Math.abs(x) < 5e-3 ? '0' : x.toFixed(2));
  applyGate(g, 'story.custom', 'action.custom', 'label.custom', { angle: piText(a!), nx: f(n.x), ny: f(n.y), nz: f(n.z) });
});

function preset(theta: number, phi: number, label: string, keepLength = true) {
  if (busy) return;
  remember();
  newState();
  const r = keepLength ? v.length() : 1;
  animate(fromAngles(theta, phi).multiplyScalar(r), undefined, 600, () => {
    if (!keepLength) explain('story.reset', 'action.preset');
    else if (r >= 0.995) explain('story.preset', 'action.preset', { label });
    else explain('story.presetMixed', 'action.preset', { label, r: r.toFixed(2) });
  });
}

$('[data-preset]').on('click', function () {
  const [th, ph] = String($(this).data('preset')).split(',').map(Number);
  preset(th * Math.PI, ph * Math.PI, $(this).data('label') as string);
});

$('[data-action="reset-zero"]').on('click', () => preset(0, 0, '|0⟩', false));

$('[data-action="undo"]').on('click', () => {
  if (busy) return;
  const prev = undoStack.pop();
  if (!prev) return;
  newState();
  animate(prev.v, undefined, 400, () => explain(prev.measured ? 'story.undoMeasure' : 'story.undo', 'action.undo'));
});

$('#slider-theta, #slider-phi').on('pointerdown keydown', () => remember()).on('input', () => {
  const r = Number($('#slider-radius').val());
  v = fromAngles(Number($('#slider-theta').val()), Number($('#slider-phi').val())).multiplyScalar(r);
  if (r < 1e-6) dir = fromAngles(Number($('#slider-theta').val()), Number($('#slider-phi').val()));
  scene.setTrail([]);
  newState();
  explain('story.angles', 'action.angles');
  render();
});

$('#slider-radius').on('pointerdown keydown', () => remember()).on('input', () => {
  const r = Number($('#slider-radius').val());
  v = dir.clone().multiplyScalar(r);
  scene.setTrail([]);
  newState();
  if (r >= 0.995) explain('story.pure', 'action.length');
  else explain('story.mixed', 'action.length', { r: r.toFixed(2) });
  render();
});

// measurement
function paintBasis() {
  $('[data-basis]').each(function () {
    const on = $(this).data('basis') === basis;
    this.className = on
      ? 'px-1.5 py-1 min-h-6 bg-primary text-on-primary font-bold border border-outline'
      : 'px-1.5 py-1 min-h-6 bg-surface-container border border-outline text-on-surface hover:bg-surface';
    this.setAttribute('aria-pressed', String(on));
  });
}

function paintCounts() {
  const total = counts.first + counts.second;
  const [a, b] = BASIS_LABELS[basis];
  const pa = total ? counts.first / total : 0, pb = total ? counts.second / total : 0;
  $('#count-result-0').text(`${a}: ${counts.first} (${pct(pa)})`);
  $('#count-result-1').text(`${b}: ${counts.second} (${pct(pb)})`);
  $('#bar-measure-0').css('width', total ? pct(pa) : '50%');
  $('#bar-measure-1').css('width', total ? pct(pb) : '50%');
}

$('[data-basis]').on('click', function () {
  basis = $(this).data('basis') as Basis;
  counts = { first: 0, second: 0 };
  paintBasis();
  paintCounts();
  render();
  $('#collapse-status').text(t('status.ready', { basis }));
});

$('[data-action="measure-once"]').on('click', () => {
  if (busy) return;
  const before = probFirst(v, basis);
  const { first, after } = measure(v, basis);
  const [a, b] = BASIS_LABELS[basis];
  const result = first ? a : b;
  // the run so far belongs to the state before; after this shot the state is the pole it found
  const sameState = v.distanceTo(after) < 1e-9;
  remember(true);
  if (!sameState) counts = { first: 0, second: 0 };
  counts[first ? 'first' : 'second']++;
  animate(after, undefined, 250, () => explain('story.once', 'action.once', { basis, result, p: pct(first ? before : 1 - before) }));
  $('#collapse-status').empty().append($('<span class="text-primary font-bold">').text(t('status.collapsed', { result })));
  paintCounts();
});

$('[data-action="measure-many"]').on('click', () => {
  if (busy) return;
  const n = sample(v, basis, 1000);
  counts.first += n;
  counts.second += 1000 - n;
  $('#collapse-status').empty().append($('<span class="text-secondary font-bold">').text(t('status.sampled')));
  explain('story.many', 'action.many', { basis });
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
    ? 'px-2 py-1 min-h-6 text-label-sm font-label-sm bg-primary text-on-primary border border-outline hard-shadow-sm font-bold'
    : 'px-2 py-1 min-h-6 text-label-sm font-label-sm bg-surface-container hover:bg-surface-container-highest border border-outline hard-shadow-sm';
}
$('#btn-autorotate').on('click', () => {
  rotating = !rotating;
  scene.setAutoRotate(rotating);
  paintRotate();
});
$('[data-action="reset-view"]').on('click', () => scene.resetView());

let toastTimer = 0;
function toast(text: string) {
  $('#toast').text(text).removeClass('hidden');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $('#toast').addClass('hidden'), 2200);
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
$(document).on('keydown', (e) => { if (e.key === 'Escape') closeGuide(); });

onLang(() => {
  paintExplain();
  paintCounts();
  paintRotate();
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
paintBasis();
paintCounts();
paintRotate();
render();
$('#collapse-status').text(t('status.unmeasured'));
