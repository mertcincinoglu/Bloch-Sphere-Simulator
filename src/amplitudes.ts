// Amplitudes typed by people ("1/√2", "0.6+0.8i", "-i/2") and the Bloch vector they describe.
import { Vector3 } from 'three';

export type Complex = { re: number; im: number };

/** A real expression: numbers, + − × /, parentheses and √ (or sqrt). null if unreadable. */
function real(src: string): number | null {
  let i = 0;
  const peek = () => src[i];
  const expr = (): number | null => {
    let v = term();
    while (v !== null && (peek() === '+' || peek() === '-')) {
      const op = src[i++], r = term();
      if (r === null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };
  const term = (): number | null => {
    let v = unary();
    while (v !== null && (peek() === '*' || peek() === '/')) {
      const op = src[i++], r = unary();
      if (r === null) return null;
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const unary = (): number | null => {
    if (peek() === '-') { i++; const v = unary(); return v === null ? null : -v; }
    if (peek() === '+') { i++; return unary(); }
    if (peek() === '√') { i++; const v = unary(); return v === null || v < 0 ? null : Math.sqrt(v); }
    if (peek() === '(') {
      i++;
      const v = expr();
      if (peek() !== ')') return null;
      i++;
      return v;
    }
    const m = src.slice(i).match(/^\d*\.?\d+/);
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const v = expr();
  return v !== null && i === src.length && isFinite(v) ? v : null;
}

/** "0.6+0.8i", "1/√2", "-i/2", "(1+i)/2" → complex; null if unreadable. */
export function parseComplex(text: string): Complex | null {
  const s = text.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.').replace(/sqrt/gi, '√').replace(/[×·]/g, '*');
  if (!s || /[^0-9.+\-*/()√i]/.test(s)) return null;
  // (a+bi)/c: split the part in brackets, then divide
  const frac = s.match(/^\((.*)\)\/(.+)$/);
  if (frac && frac[1].includes('i')) {
    const top = parseComplex(frac[1]), d = real(frac[2]);
    return top && d ? { re: top.re / d, im: top.im / d } : null;
  }
  // split into top-level terms at + and − (not inside brackets, not a leading sign)
  const terms: string[] = [];
  let depth = 0, start = 0;
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if ((c === '+' || c === '-') && depth === 0 && k > start && !'*/'.includes(s[k - 1])) {
      terms.push(s.slice(start, k));
      start = k;
    }
  }
  terms.push(s.slice(start));
  const out = { re: 0, im: 0 };
  for (const t of terms) {
    const n = (t.match(/i/g) ?? []).length;
    if (n > 1) return null;
    if (n === 0) {
      const v = real(t);
      if (v === null) return null;
      out.re += v;
    } else {
      // i may stand anywhere in the term: "0.8i", "i/2", "-i", "i*√2"
      // after a number or a bracket, i multiplies ("0.8i" = 0.8·1); elsewhere it stands for 1 ("i/2", "-i")
      const coef = t.replace(/(?<=[0-9.)])i/, '*1').replace('i', '1');
      const v = real(coef);
      if (v === null) return null;
      out.im += v;
    }
  }
  return out;
}

/** α|0⟩ + β|1⟩, normalised, as a Bloch vector; the global phase drops out. null if both are 0. */
export function blochFromAmplitudes(a: Complex, b: Complex): { v: Vector3; norm: number } | null {
  const norm = a.re ** 2 + a.im ** 2 + b.re ** 2 + b.im ** 2;
  if (norm < 1e-12) return null;
  // α*β
  const re = (a.re * b.re + a.im * b.im) / norm, im = (a.re * b.im - a.im * b.re) / norm;
  const z = (a.re ** 2 + a.im ** 2 - b.re ** 2 - b.im ** 2) / norm;
  return { v: new Vector3(2 * re, 2 * im, z), norm };
}
