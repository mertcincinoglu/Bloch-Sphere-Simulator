import '@fontsource-variable/eb-garamond';
import '@fontsource-variable/eb-garamond/wght-italic.css';
import '@fontsource-variable/space-grotesk';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/400-italic.css';
import '@fontsource/space-mono/700.css';
import './style.css';
import $ from 'jquery';
import { Quaternion, Vector3 } from 'three';
import { BASIS_LABELS, GATES, fromAngles, measure, probFirst, rotation, sample, toAngles, type Basis } from './bloch';
import { BlochScene } from './scene';

// Material Symbols used by the design, inlined so nothing loads from another site
const ICONS = import.meta.glob('/node_modules/@material-symbols/svg-400/outlined/{menu_book,restart_alt,psychology,lightbulb,keyboard_arrow_down,query_stats,flash_on,bar_chart,undo}.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
$('[data-icon]').each(function () {
  const name = $(this).data('icon') as string;
  this.innerHTML = Object.entries(ICONS).find(([path]) => path.endsWith(`/${name}.svg`))?.[1] ?? '';
  this.setAttribute('aria-hidden', 'true');
});

const scene = new BlochScene($('#sphere')[0]);
let v = fromAngles(Math.PI / 2, 0); // the design opens on |+⟩
let basis: Basis = 'Z';
let busy = false;
let counts = { first: 0, second: 0 };
const undoStack: Vector3[] = [];

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const signed = (x: number) => (Math.abs(x) < 0.0005 ? '0.000' : `${x > 0 ? '+' : ''}${x.toFixed(3)}`);

function render() {
  const r = v.length();
  const { theta, phi } = toAngles(v);
  const thPi = (theta / Math.PI).toFixed(2), phPi = (phi / Math.PI).toFixed(2);
  $('#slider-theta').val(theta);
  $('#slider-phi').val(phi);
  $('#slider-radius').val(r);
  $('#readout-theta').text(`${thPi} π (${((theta * 180) / Math.PI).toFixed(1)}°)`);
  $('#readout-phi').text(`${phPi} π (${((phi * 180) / Math.PI).toFixed(1)}°)`);
  $('#readout-r').text(`${r.toFixed(2)} ${r >= 0.99 ? '(Pure)' : '(Mixed)'}`);
  $('#coord-x').text(signed(v.x));
  $('#coord-y').text(signed(v.y));
  $('#coord-z').text(signed(v.z));

  const p0 = probFirst(v, 'Z');
  $('#prob-0-text').text(pct(p0));
  $('#prob-1-text').text(pct(1 - p0));
  $('#bar-prob-0').css('width', pct(p0));
  $('#bar-prob-1').css('width', pct(1 - p0));
  $('#theory-mark').css('left', pct(probFirst(v, basis)));

  if (r >= 0.99) {
    const phase = phi > 0.05 && Math.sin(theta) > 1e-6 ? `e^(${phPi}πi)·` : '';
    $('#formula-numeric').text(`${Math.cos(theta / 2).toFixed(3)} |0⟩ + ${phase}${Math.sin(theta / 2).toFixed(3)} |1⟩`);
    $('#norm').text('⟨ψ|ψ⟩ = 1.000');
  } else {
    $('#formula-numeric').text(`mixed: no single |ψ⟩ (ρ, r = ${r.toFixed(2)})`);
    $('#norm').text(`Tr ρ² = ${((1 + r * r) / 2).toFixed(3)}`);
  }
  $('#quick-rotation-badge').text(`R(z: ${phPi}π, y: ${thPi}π)`);
  scene.setVector(v);
}

function explain(text: string, tag: string, gate?: { label: string; prefix: string; cells: string[] }) {
  $('#narrative-text').text(text);
  $('#last-action-tag').text(`ACTION: ${tag}`);
  if (!gate) return;
  $('#matrix-label').text(gate.label);
  $('#matrix-prefix').text(gate.prefix);
  $('#matrix-cells').html(gate.cells.map((c) => `<span>${c}</span>`).join(''));
}

// Turn the arrow along a true rotation (or the shortest path), drawing the trail as it goes.
function animate(to: Vector3, q = new Quaternion().setFromUnitVectors(v.clone().normalize(), to.clone().normalize()), ms = 600, done?: () => void) {
  const from = v.clone();
  const lenFrom = from.length(), lenTo = to.length();
  const at = (e: number) => from.clone().normalize().applyQuaternion(new Quaternion().slerp(q, e)).multiplyScalar(lenFrom + (lenTo - lenFrom) * e);
  scene.setTrail(Array.from({ length: 41 }, (_, i) => at(i / 40)));
  busy = true;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    v = at(1 - (1 - t) ** 3); // ease out, as in the design
    render();
    if (t < 1) requestAnimationFrame(step);
    else { v = to.clone(); render(); busy = false; done?.(); }
  };
  requestAnimationFrame(step);
}

function remember() {
  undoStack.push(v.clone());
  if (undoStack.length > 20) undoStack.shift();
}

function preset(theta: number, phi: number, label: string) {
  if (busy) return;
  remember();
  animate(fromAngles(theta, phi).multiplyScalar(v.length() || 1), undefined, 600, () =>
    explain(`Preset chosen: State rotated directly to ${label}.`, 'GATE [PRESET]'));
}

$('[data-gate]').on('click', function () {
  if (busy) return;
  const name = $(this).data('gate') as string;
  const g = GATES[name];
  remember();
  animate(v.clone().applyQuaternion(rotation(g)), rotation(g), 600, () => explain(g.story, `GATE [${name}]`, g));
});

$('[data-preset]').on('click', function () {
  const [t, p] = String($(this).data('preset')).split(',').map(Number);
  preset(t * Math.PI, p * Math.PI, $(this).data('label') as string);
});

$('[data-action="reset-zero"]').on('click', () => preset(0, 0, '|0⟩ (North pole)'));

$('[data-action="undo"]').on('click', () => {
  if (busy) return;
  const prev = undoStack.pop();
  if (!prev) return;
  animate(prev, undefined, 400, () => explain('Undo applied. Restored previous quantum orientation.', 'UNDO'));
});

$('#slider-theta, #slider-phi').on('pointerdown keydown', remember).on('input', () => {
  v = fromAngles(Number($('#slider-theta').val()), Number($('#slider-phi').val())).multiplyScalar(v.length() || 1);
  scene.setTrail([]);
  explain('Angles set by hand: θ tilts the arrow away from |0⟩, φ turns it around the equator.', 'MANUAL ANGLES');
  render();
});

$('#slider-radius').on('pointerdown keydown', remember).on('input', () => {
  const r = Number($('#slider-radius').val());
  const dir = v.length() > 1e-6 ? v.clone().normalize() : fromAngles(Number($('#slider-theta').val()), Number($('#slider-phi').val()));
  v = dir.multiplyScalar(r);
  explain(r >= 0.99
    ? 'Pure state: the arrow reaches the surface of the sphere.'
    : `Mixed state: the arrow is shorter than 1 (r = ${r.toFixed(2)}), so it sits inside the sphere. This is not a superposition but uncertainty about which state was prepared; at the centre the outcome is a coin toss in every basis.`,
  'PURITY');
  render();
});

// measurement
function paintBasis() {
  $('[data-basis]').each(function () {
    const on = $(this).data('basis') === basis;
    this.className = on
      ? 'px-1.5 py-0.5 bg-primary text-on-primary font-bold border border-outline'
      : 'px-1.5 py-0.5 bg-surface-container border border-outline text-on-surface hover:bg-surface';
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
  $('#collapse-status').text(`Ready in ${basis}-basis`);
});

$('[data-action="measure-once"]').on('click', () => {
  if (busy) return;
  const before = probFirst(v, basis);
  const { first, after } = measure(v, basis);
  const [a, b] = BASIS_LABELS[basis];
  counts[first ? 'first' : 'second']++;
  remember();
  animate(after, undefined, 250, () => explain(
    `Measured in the ${basis}-basis: the result was ${first ? a : b} (chance ${pct(first ? before : 1 - before)}). The state collapsed onto that pole: measuring changes the qubit.`, 'MEASURE 1×'));
  $('#collapse-status').html(`<span class="text-primary font-bold">Collapsed to ${first ? a : b}</span>`);
  paintCounts();
});

$('[data-action="measure-many"]').on('click', () => {
  if (busy) return;
  const n = sample(v, basis, 1000);
  counts.first += n;
  counts.second += 1000 - n;
  $('#collapse-status').html('<span class="text-secondary font-bold">Sampled 1000× runs</span>');
  explain(`Measured 1000 fresh copies in the ${basis}-basis. Each copy gives one answer; the bar shows how often each came up, the black tick the prediction. The state itself is unchanged.`, 'MEASURE 1,000×');
  paintCounts();
});

$('[data-action="clear"]').on('click', () => {
  counts = { first: 0, second: 0 };
  paintCounts();
  $('#collapse-status').text('Histogram Cleared');
});

// view and guide
let rotating = false;
$('#btn-autorotate').on('click', function () {
  rotating = !rotating;
  scene.setAutoRotate(rotating);
  $(this).text(`Auto-Rotate: ${rotating ? 'ON' : 'OFF'}`);
  this.className = rotating
    ? 'px-2 py-0.5 text-label-sm font-label-sm bg-primary text-on-primary border border-outline hard-shadow-sm font-bold'
    : 'px-2 py-0.5 text-label-sm font-label-sm bg-surface-container hover:bg-surface-container-highest border border-outline hard-shadow-sm';
});
$('[data-action="reset-view"]').on('click', () => scene.resetView());

const modal = $('#guide-modal');
$('[data-action="guide"]').on('click', () => { modal.removeClass('hidden').addClass('flex'); modal.find('[data-action="close-guide"]').last().trigger('focus'); });
$('[data-action="close-guide"]').on('click', () => modal.addClass('hidden').removeClass('flex'));
modal.on('click', (e) => { if (e.target === modal[0]) modal.addClass('hidden').removeClass('flex'); });
$(document).on('keydown', (e) => { if (e.key === 'Escape') modal.addClass('hidden').removeClass('flex'); });

explain(
  'The qubit rests on the equator in the |+⟩ state. It exists in an equal balanced superposition between |0⟩ and |1⟩. A measurement in the standard Z-basis will yield North or South with precisely 50% probability.',
  'INITIAL SUPERPOSITION', GATES.H);
paintBasis();
paintCounts();
render();
