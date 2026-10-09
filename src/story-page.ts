// Theory & Story: one chapter at a time, each with a small working version of the lab.
import { fillIcons } from './common';
import $ from 'jquery';
import { Quaternion, Vector3 } from 'three';
import { BASIS_LABELS, GATES, fromAngles, measure, probFirst, rotation, sample, toAngles, type Basis } from './bloch';
import { BlochScene } from './scene';
import { lang, onLang, t } from './i18n';
import type { Key } from './strings';
import { STORY, type Chapter, type Figure } from './content/story';
import { SOURCES } from './content/sources';
import { piText } from './state-url';

const SOURCES_URL = '/projects/bloch-sphere-simulator/sources';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const srcNo = (id: string) => SOURCES.findIndex((s) => s.id === id) + 1;
const srcLink = (id: string) => `${SOURCES_URL}#src-${id}`;

let disposers: Array<() => void> = [];
const COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }; // written out so Tailwind sees them

// ---------- figures ----------

/** A small bordered frame holding one 3D sphere. */
function sphereFrame(height: string) {
  const frame = $('<div class="flex flex-col items-center justify-center p-3 pt-7 border border-outline-variant technical-grid-bg relative w-full">');
  frame.append($('<div class="absolute top-1 left-2 right-2 flex justify-between font-label-sm text-[13px] text-on-surface-variant select-none" aria-hidden="true">').append(['-1.0', '-0.5', '0.0', '+0.5', '+1.0'].map((x) => $('<span>').text(x))));
  const host = $(`<div class="mini-sphere relative w-full ${height} cursor-grab" tabindex="0" role="img">`).attr('aria-label', t('sp.fig'));
  frame.append(host);
  return { frame, host: host[0] };
}

function chip(text: string, on: boolean) {
  return $('<button type="button" class="px-2 py-1.5 min-h-8 font-label-sm text-label-sm text-center">')
    .text(text)
    .attr('aria-pressed', String(on))
    .addClass(on ? 'border border-on-surface bg-primary text-on-primary font-bold' : 'border border-outline bg-surface text-on-surface hover:bg-surface-container');
}

function outcomeBar() {
  const wrap = $('<div class="pt-2 border-t border-outline-variant space-y-1.5">');
  const top = $('<div class="flex justify-between items-center gap-2 font-label-sm text-label-sm font-mono">');
  const a = $('<span class="text-primary font-bold">'), b = $('<span class="text-secondary font-bold text-right">');
  top.append(a, b);
  const bar = $('<div class="relative w-full h-5 bg-surface-container border border-on-surface overflow-hidden flex">');
  const fa = $('<div class="bg-primary h-full transition-all duration-300" style="width:50%">');
  const fb = $('<div class="bg-secondary h-full transition-all duration-300" style="width:50%">');
  const tick = $('<div class="absolute top-0 bottom-0 w-0.5 bg-on-surface z-10" style="left:50%">');
  bar.append(fa, fb, tick);
  const note = $('<div class="text-[13px] font-label-sm text-on-surface-variant">').text(t('sp.tick'));
  wrap.append(top, bar, note);
  return {
    el: wrap,
    paint(basis: Basis, counts: [number, number], predicted: number) {
      const total = counts[0] + counts[1];
      const [la, lb] = BASIS_LABELS[basis];
      a.text(`${la}: ${counts[0]} (${pct(total ? counts[0] / total : 0)})`);
      b.text(`${lb}: ${counts[1]} (${pct(total ? counts[1] / total : 0)})`);
      fa.css('width', total ? pct(counts[0] / total) : '50%');
      fb.css('width', total ? pct(counts[1] / total) : '50%');
      tick.css('left', pct(predicted));
    },
  };
}

function slider(label: string, min: number, max: number, step: number, value: number) {
  const id = `s${Math.random().toString(36).slice(2, 8)}`;
  const wrap = $('<div class="space-y-1.5">');
  const out = $('<span class="text-primary font-bold">');
  wrap.append($('<div class="flex justify-between items-center font-label-sm text-label-sm">').append($(`<label for="${id}" class="font-body-md text-[15px] font-semibold text-on-surface">`).text(label), out));
  const input = $(`<input id="${id}" class="w-full cursor-pointer" type="range">`).attr({ min, max, step }).val(value);
  wrap.append(input);
  return { el: wrap, input, out };
}

/** The single-sphere figure: sliders, gates and measurement as the chapter asks. */
function sphereFigure(fig: Extract<Figure, { type: 'sphere' }>) {
  const grid = $('<div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">');
  const left = $('<div class="md:col-span-6 flex flex-col items-center">');
  const { frame, host } = sphereFrame('h-56');
  const readout = $('<div class="mt-2 font-label-sm text-[13px] text-on-surface-variant text-center">');
  left.append(frame, readout);
  const right = $('<div class="md:col-span-6 space-y-4">');
  grid.append(left, right);

  const scene = new BlochScene(host);
  disposers.push(() => scene.dispose());
  let v = fromAngles(fig.state.theta, fig.state.phi).multiplyScalar(fig.state.r ?? 1);
  let basis: Basis = fig.bases?.[0] ?? 'Z';
  let counts: [number, number] = [0, 0];
  let busy = false;
  const bar = outcomeBar();

  const sTheta = fig.controls.includes('theta') ? slider(t('sp.theta'), 0, Math.PI, 0.01, toAngles(v).theta) : null;
  const sPhi = fig.controls.includes('phi') ? slider(t('sp.phi'), 0, 2 * Math.PI, 0.01, toAngles(v).phi) : null;
  const sR = fig.controls.includes('purity') ? slider(t('sp.r'), 0, 1, 0.05, v.length()) : null;
  for (const s of [sTheta, sPhi, sR]) if (s) right.append(s.el);

  const paint = () => {
    const { theta, phi } = toAngles(v);
    const r = v.length();
    readout.text(t('sp.state', { t: piText(theta), p: piText(phi), r: r.toFixed(2) }));
    sTheta?.out.text(`${piText(theta)} (${Math.round((theta * 180) / Math.PI)}°)`);
    sPhi?.out.text(`${piText(phi)} (${Math.round((phi * 180) / Math.PI)}°)`);
    sR?.out.text(r.toFixed(2));
    scene.setVector(v);
    if (fig.controls.includes('measure')) bar.paint(basis, counts, probFirst(v, basis));
  };
  const changed = () => { counts = [0, 0]; latest.text(t('sp.ready')); total.text(t('sp.total', { n: 0 })); };

  const fromSliders = () => {
    const { theta, phi } = toAngles(v);
    const th = sTheta ? Number(sTheta.input.val()) : theta;
    const ph = sPhi ? Number(sPhi.input.val()) : phi;
    const r = sR ? Number(sR.input.val()) : v.length();
    v = fromAngles(th, ph).multiplyScalar(r);
    scene.setTrail([]);
    changed();
    paint();
  };
  for (const s of [sTheta, sPhi, sR]) s?.input.on('input', fromSliders);
  const syncSliders = () => {
    const { theta, phi } = toAngles(v);
    sTheta?.input.val(theta);
    sPhi?.input.val(phi);
    sR?.input.val(v.length());
  };

  const turn = (to: Vector3, q?: Quaternion, ms = 600) => {
    const from = v.clone(), len = from.length() || 1;
    const fromDir = from.clone().normalize();
    const rot = q ?? new Quaternion().setFromUnitVectors(fromDir, to.clone().normalize());
    const at = (e: number) => fromDir.clone().applyQuaternion(new Quaternion().slerp(rot, e)).multiplyScalar(len + (to.length() - len) * e);
    scene.setTrail(Array.from({ length: 41 }, (_, i) => at(i / 40)));
    busy = true;
    const start = performance.now();
    const dur = reduced ? 0 : ms;
    const step = (now: number) => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1;
      v = at(1 - (1 - k) ** 3);
      paint();
      if (k < 1) requestAnimationFrame(step);
      else { v = to.clone(); syncSliders(); paint(); busy = false; }
    };
    requestAnimationFrame(step);
  };

  if (fig.controls.includes('gates')) {
    const box = $('<div class="space-y-1">');
    box.append($('<span class="font-body-md text-[15px] font-semibold text-on-surface block">').text(t('sp.gates')));
    const gates = $('<div class="grid grid-cols-4 gap-1.5">');
    for (const name of fig.gates ?? []) {
      $('<button type="button" class="bg-surface-container hover:bg-surface-container-high border border-outline px-1 py-2 min-h-8 font-label-sm text-label-sm font-bold hard-shadow-sm active:translate-x-0.5 active:translate-y-0.5">')
        .text(name)
        .on('click', () => {
          if (busy) return;
          changed();
          turn(v.clone().applyQuaternion(rotation(GATES[name])), rotation(GATES[name]));
        })
        .appendTo(gates);
    }
    const reset = $('<button type="button" class="font-label-sm text-label-sm text-primary font-bold underline min-h-6">').text(t('sp.reset'))
      .on('click', () => { if (!busy) { changed(); turn(new Vector3(0, 0, 1)); } });
    box.append(gates, reset);
    right.append(box);
  }

  const latest = $('<span class="px-2 py-0.5 font-bold uppercase border border-secondary text-secondary bg-surface-container">').text(t('sp.ready'));
  const total = $('<span class="text-on-surface-variant">').text(t('sp.total', { n: 0 }));
  if (fig.controls.includes('measure')) {
    const bases = fig.bases ?? ['Z'];
    const box = $('<div class="space-y-1">').append($('<span class="font-body-md text-[15px] font-semibold text-on-surface block">').text(t('sp.basis')));
    const chips = $('<div class="grid gap-2">').addClass(COLS[bases.length]);
    const paintChips = () => {
      chips.empty();
      for (const b of bases) {
        const [la, lb] = BASIS_LABELS[b];
        chip(`${b} (${la} / ${lb})`, b === basis).on('click', () => { basis = b; counts = [0, 0]; paintChips(); paint(); }).appendTo(chips);
      }
    };
    paintChips();
    box.append(chips);
    const once = $('<button type="button" class="flex-1 bg-surface-container border border-on-surface px-3 py-2 font-label-md text-label-md font-bold uppercase shadow-hard-press text-on-surface hover:bg-surface-container-high transition-all">').text(t('sp.once'));
    const many = $('<button type="button" class="flex-1 bg-secondary text-on-secondary border border-on-surface px-3 py-2 font-label-md text-label-md font-bold uppercase shadow-hard-press hover:opacity-90 transition-all flex items-center justify-center gap-1.5">')
      .append($('<i class="icon size-[16px]" data-icon="bar_chart">'), $('<span>').text(t('sp.many')));
    once.on('click', () => {
      if (busy) return;
      const res = measure(v, basis);
      if (v.distanceTo(res.after) > 1e-9) counts = [0, 0];
      counts[res.first ? 0 : 1]++;
      latest.text(BASIS_LABELS[basis][res.first ? 0 : 1]);
      total.text(t('sp.total', { n: counts[0] + counts[1] }));
      turn(res.after, undefined, 250);
    });
    many.on('click', () => {
      const n = sample(v, basis, 1000);
      counts = [counts[0] + n, counts[1] + 1000 - n];
      total.text(t('sp.total', { n: counts[0] + counts[1] }));
      paint();
    });
    right.append(box, $('<div class="pt-2 flex items-center gap-3">').append(once, many),
      $('<div class="bg-surface border border-outline-variant p-2 flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm">')
        .append($('<span class="font-body-md text-[15px] text-on-surface-variant">').text(t('sp.latest')), latest, total));
  }

  const out = $('<div class="space-y-4">').append(grid);
  if (fig.controls.includes('measure')) out.append(bar.el);
  setTimeout(paint);
  return out;
}

/** Two spheres side by side, measured in the same basis. */
function compareFigure(fig: Extract<Figure, { type: 'compare' }>) {
  let basis: Basis = fig.bases[0];
  const cards = [fig.left, fig.right].map((side) => {
    const v = fromAngles(side.state.theta, side.state.phi).multiplyScalar(side.state.r ?? 1);
    const card = $('<div class="bg-surface border border-on-surface p-4 space-y-3">');
    card.append($('<div class="flex justify-between items-center gap-2 border-b border-outline-variant pb-1">')
      .append($('<span class="font-label-md text-label-md font-bold text-primary">').text(side.label),
        $('<span class="font-label-sm text-label-sm px-1.5 bg-surface-container border border-outline">').text(`|r| = ${v.length().toFixed(1)}`)));
    const { frame, host } = sphereFrame('h-44');
    card.append(frame);
    const scene = new BlochScene(host);
    disposers.push(() => scene.dispose());
    setTimeout(() => scene.setVector(v));
    const lines = $('<div class="space-y-1.5 font-label-sm text-label-sm">');
    card.append(lines);
    const bar = outcomeBar();
    card.append(bar.el);
    let counts: [number, number] = [0, 0];
    return {
      card,
      paint() {
        lines.empty();
        for (const b of fig.bases) {
          const p = probFirst(v, b);
          const [la, lb] = BASIS_LABELS[b];
          lines.append($('<div class="flex justify-between gap-2">').toggleClass('text-secondary font-bold', b === basis)
            .append($('<span>').text(t('sp.predicted', { basis: b })), $('<span class="text-right">').text(`${pct(p)} ${la} / ${pct(1 - p)} ${lb}`)));
        }
        bar.paint(basis, counts, probFirst(v, basis));
      },
      run() { const n = sample(v, basis, 1000); counts = [counts[0] + n, counts[1] + 1000 - n]; },
      reset() { counts = [0, 0]; },
    };
  });
  const chips = $('<div class="grid gap-2">').addClass(COLS[fig.bases.length]);
  const paintAll = () => {
    chips.empty();
    for (const b of fig.bases) {
      const [la, lb] = BASIS_LABELS[b];
      chip(`${b} (${la} / ${lb})`, b === basis).on('click', () => { basis = b; cards.forEach((c) => c.reset()); paintAll(); }).appendTo(chips);
    }
    cards.forEach((c) => c.paint());
  };
  const both = $('<button type="button" class="bg-secondary text-on-secondary border border-on-surface px-3 py-2 font-label-md text-label-md font-bold uppercase shadow-hard-press hover:opacity-90 transition-all flex items-center justify-center gap-1.5">')
    .append($('<i class="icon size-[16px]" data-icon="bar_chart">'), $('<span>').text(t('sp.both')))
    .on('click', () => { cards.forEach((c) => c.run()); paintAll(); });
  paintAll();
  return $('<div class="space-y-4">').append(
    $('<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">').append($('<div class="space-y-1">').append($('<span class="font-body-md text-[15px] font-semibold text-on-surface block">').text(t('sp.basis')), chips), both),
    $('<div class="grid grid-cols-1 md:grid-cols-2 gap-4">').append(cards.map((c) => c.card)),
  );
}

/** Two qubits blended from |00⟩ toward (|00⟩ + |11⟩)/√2; each one's own arrow shrinks. */
function entangleFigure() {
  const s = slider(t('sp.t'), 0, 1, 0.01, 0);
  const pair = $('<div class="font-label-md text-label-md text-center text-on-surface">');
  const each = $('<div class="font-label-sm text-label-sm text-center text-on-surface-variant">');
  const scenes = [t('sp.qubitA'), t('sp.qubitB')].map((name) => {
    const card = $('<div class="bg-surface border border-on-surface p-3 space-y-2">').append($('<div class="font-label-md text-label-md font-bold text-primary border-b border-outline-variant pb-1">').text(name));
    const { frame, host } = sphereFrame('h-44');
    card.append(frame);
    const scene = new BlochScene(host);
    disposers.push(() => scene.dispose());
    return { card, scene };
  });
  const paint = () => {
    const tt = Number(s.input.val());
    const a = Math.cos((tt * Math.PI) / 4), b = Math.sin((tt * Math.PI) / 4);
    const r = Math.cos((tt * Math.PI) / 2);
    s.out.text(tt.toFixed(2));
    pair.text(`|ψ⟩ = ${a.toFixed(3)} |00⟩ + ${b.toFixed(3)} |11⟩`);
    each.text(t('sp.reduced', { r: r.toFixed(2), p: ((1 + r * r) / 2).toFixed(3) }));
    scenes.forEach((x) => x.scene.setVector(new Vector3(0, 0, r)));
  };
  s.input.on('input', paint);
  setTimeout(paint);
  return $('<div class="space-y-4">').append(s.el, pair, each, $('<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">').append(scenes.map((x) => x.card)));
}

function figurePlate(ch: Chapter, index: number) {
  const plate = $('<section class="clean-paper-low border border-on-surface shadow-hard-card p-4 sm:p-6 space-y-5">');
  plate.append($('<div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2">').append(
    $('<h2 class="font-headline-sm text-[15px] font-bold uppercase tracking-[0.04em] text-on-surface flex items-center gap-2">')
      .append($('<span class="w-2.5 h-2.5 bg-primary inline-block" aria-hidden="true">'), $('<span>').text(`${t('sp.fig')} ${index} — ${ch.title}`)),
    $('<span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">').text(`APPARATUS REF. BM-64 • ${t(`tag.${ch.id}` as Key)}`),
  ));
  const f = ch.figure;
  if (f.type === 'sphere') plate.append(sphereFigure(f));
  else if (f.type === 'compare') plate.append(compareFigure(f));
  else if (f.type === 'entangle') plate.append(entangleFigure());
  else plate.append($('<p class="font-label-md text-label-md text-on-surface-variant text-center py-6">').text(t('sp.noFigure')));
  plate.append($('<footer class="pt-3 font-body-md text-[16px] leading-[1.5] text-on-surface-variant italic border-t border-dashed border-outline-variant">').text(ch.caption));
  return plate;
}

// ---------- chapter ----------

function currentId(chapters: Chapter[]) {
  const id = location.hash.replace(/^#/, '');
  return chapters.some((c) => c.id === id) ? id : chapters[0].id;
}

function render() {
  disposers.forEach((d) => d());
  disposers = [];
  const chapters = STORY[lang];
  const id = currentId(chapters);
  const i = chapters.findIndex((c) => c.id === id);
  const ch = chapters[i];
  const words = [ch.lead, ...ch.body, ch.caption, ch.mixup?.text ?? ''].join(' ').split(/\s+/).length;

  document.title = `${ch.kicker} ${ch.title} — ${lang === 'tr' ? 'Bloch Küresi Simülatörü' : 'Bloch Sphere Simulator'}`;
  $('#reading-chapter').text(t('sp.chapterOf', { n: i + 1, total: chapters.length }));
  $('#reading-time').text(t('sp.minRead', { m: Math.max(1, Math.round(words / 200)) }));

  const toc = $('#toc').empty();
  chapters.forEach((c) => {
    if (c.id === id) {
      toc.append($('<a class="bg-primary-fixed border-l-4 border-primary px-2.5 py-2 font-body-md text-[16px] text-on-primary-fixed font-semibold flex items-center justify-between" aria-current="page">').attr('href', `#${c.id}`)
        .append($('<span class="flex items-center gap-1.5">').append($('<span class="text-primary font-bold">').text('→'), $('<span>').text(`${c.kicker} ${c.title}`)),
          $('<span class="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true">')));
    } else {
      toc.append($('<a class="block px-2.5 py-1.5 font-body-md text-[16px] text-on-surface-variant hover:text-on-surface hover:bg-surface transition-colors">').attr('href', `#${c.id}`).text(`${c.kicker} ${c.title}`));
    }
  });

  const main = $('#chapter').empty();
  main.append($('<header class="space-y-3 pb-6 border-b border-outline-variant">').append(
    $('<div class="flex flex-wrap items-center gap-3">').append(
      $('<span class="font-headline-md text-headline-md text-primary font-bold">').text(ch.kicker),
      $('<span class="px-2 py-0.5 bg-surface-container-high border border-outline font-label-sm text-label-sm uppercase tracking-[0.04em] text-on-surface">').text(t(`tag.${ch.id}` as Key)),
      $('<span class="text-on-surface-variant font-label-sm text-label-sm">').text(`• FOLIO ${String(40 + i).padStart(2, '0')}`),
    ),
    $('<h1 class="font-display-lg-mobile text-display-lg-mobile sm:font-display-lg sm:text-display-lg text-on-surface leading-none tracking-tight">').text(ch.title),
    $('<p class="font-body-md text-[20px] font-semibold text-on-surface leading-[1.45] pt-2 reading-measure">').text(ch.lead),
  ));
  main.append($('<article class="space-y-5 font-body-md text-[18px] text-on-surface leading-[1.55] reading-measure hyphens-auto">').attr('lang', lang).append(ch.body.map((p) => $('<p>').text(p))));
  main.append(figurePlate(ch, i + 1));

  if (ch.mixup) {
    const n = srcNo(ch.mixup.source);
    main.append($('<div class="bg-[#fef3c7] border border-on-surface p-5 shadow-hard-card space-y-2.5">').append(
      $('<div class="flex items-center justify-between gap-2 border-b border-[#eab308] pb-2">').append(
        $('<span class="font-headline-sm text-label-lg font-bold text-on-tertiary-fixed flex items-center gap-1.5">').append($('<i class="icon size-[18px]" data-icon="warning">'), $('<span>').text(t('sp.mixup'))),
        $('<a class="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface border border-on-surface font-bold hover:bg-primary-fixed">').attr('href', srcLink(ch.mixup.source)).text(`[${n}]`),
      ),
      $('<p class="font-body-md text-[18px] text-on-tertiary-fixed leading-[1.45] font-bold reading-measure">').text(ch.mixup.title),
      $('<p class="font-body-md text-[17px] text-on-tertiary-fixed leading-[1.55] reading-measure">').text(ch.mixup.text),
    ));
  }

  if (ch.math) {
    main.append($('<details class="border border-on-surface clean-paper-low shadow-hard-card group">').append(
      $('<summary class="w-full px-4 py-3 flex items-center justify-between gap-2 text-left font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer list-none">').append(
        $('<span class="flex items-center gap-2">').append($('<i class="icon size-[18px] group-open:rotate-180 transition-transform" data-icon="keyboard_arrow_down">'), $('<span>').text(t('sp.math'))),
        $('<span class="font-label-sm text-label-sm text-on-surface-variant uppercase hidden sm:inline">').text(t('sp.expand')),
      ),
      $('<div class="px-4 sm:px-5 pb-5 pt-2 border-t border-outline-variant">').append(
        $('<div class="p-4 clean-paper border border-outline-variant font-label-md text-[15px] leading-[1.6] whitespace-pre-line overflow-x-auto">').text(ch.math),
      ),
    ));
  }

  const srcLine = $('<div class="py-2.5 px-3.5 clean-paper-low border-l-4 border-on-surface border-y border-r border-y-outline-variant border-r-outline-variant font-body-md text-[15px] leading-snug text-on-surface-variant">');
  srcLine.append($('<span>').text(`${t('sp.sources')}: `));
  ch.sources.forEach((sid, k) => {
    const s = SOURCES.find((x) => x.id === sid);
    if (!s) return;
    if (k) srcLine.append(' • ');
    srcLine.append($('<a class="underline hover:text-primary">').attr('href', srcLink(sid)).text(`[${srcNo(sid)}] ${s.authors.split(',')[0]}, ${s.title.split(/[:—]/)[0].trim()}`));
  });
  main.append(srcLine);

  const nav = $('<nav class="grid grid-cols-1 sm:grid-cols-2 gap-4">').attr('aria-label', t('sp.chapterOf', { n: i + 1, total: chapters.length }));
  const prev = chapters[i - 1], next = chapters[i + 1];
  nav.append(prev
    ? $('<a class="block bg-surface border border-on-surface p-4 shadow-hard-card hover:bg-surface-container">').attr('href', `#${prev.id}`).append(
      $('<span class="font-label-sm text-label-sm text-on-surface-variant block">').text(t('sp.prev')),
      $('<span class="font-headline-sm text-headline-sm text-on-surface">').text(`← ${prev.kicker} ${prev.title}`))
    : $('<span class="hidden sm:block">'));
  if (next) nav.append($('<a class="block bg-primary-fixed border border-primary p-4 shadow-hard-press hover:bg-surface-container text-right sm:text-left">').attr('href', `#${next.id}`).append(
    $('<span class="font-label-sm text-label-sm text-primary block">').text(t('sp.next')),
    $('<span class="font-headline-sm text-headline-sm text-primary">').text(`${next.kicker} ${next.title} →`)));
  main.append(nav);
  fillIcons(main[0]);
}

addEventListener('hashchange', () => {
  render();
  document.getElementById('chapter')?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
});
onLang(render);
render();
