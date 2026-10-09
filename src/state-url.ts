// Angles typed by people ("0.5π", "π/4", "1/4", "0.25") and states carried in a link (#t=…&p=…&r=…).
import { Vector3 } from 'three';
import { fromAngles } from './bloch';

/** A number in units of π: "0.5π", "0.5pi", "π/4", "1/4", "-0.25" → radians; null if unreadable. */
export function parsePi(text: string): number | null {
  const s = text.replace(/\s+/g, '').replace(/pi/gi, 'π').replace(/[−–]/g, '-').replace(',', '.'); // Turkish keyboards write 0,5
  const deg = s.match(/^(-?\d*\.?\d+)(°|deg)$/i); // "60°" is degrees
  if (deg) return (parseFloat(deg[1]) * Math.PI) / 180;
  const m =s.match(/^(-?)(\d*\.?\d+)?(π)?(?:\/(\d*\.?\d+))?(π)?$/);
  if (!m || (!m[2] && !m[3] && !m[5])) return null;
  const num = m[2] ? parseFloat(m[2]) : 1;
  const den = m[4] ? parseFloat(m[4]) : 1;
  if (!isFinite(num) || !den) return null;
  return (m[1] ? -1 : 1) * (num / den) * Math.PI;
}

/** Radians as "0.25π", "π", "0" */
export function piText(rad: number): string {
  const k = rad / Math.PI;
  if (Math.abs(k) < 5e-4) return '0';
  if (Math.abs(k - 1) < 5e-4) return 'π';
  return `${k.toFixed(2).replace(/\.?0+$/, '').replace('-', '−')}π`;
}

export function shareUrl(v: Vector3): string {
  const r = v.length();
  const d = r > 1e-6 ? v.clone().normalize() : new Vector3(0, 0, 1);
  const t = Math.acos(Math.max(-1, Math.min(1, d.z)));
  let p = Math.atan2(d.y, d.x);
  if (p < 0) p += 2 * Math.PI;
  const url = new URL(location.href);
  url.hash = `t=${t.toFixed(4)}&p=${p.toFixed(4)}&r=${r.toFixed(3)}`;
  return url.toString();
}

export function readShared(hash = location.hash): Vector3 | null {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const t = Number(q.get('t')), p = Number(q.get('p')), r = q.has('r') ? Number(q.get('r')) : 1;
  if (!q.has('t') || !q.has('p') || [t, p, r].some((x) => !isFinite(x))) return null;
  return fromAngles(Math.min(Math.PI, Math.max(0, t)), p).multiplyScalar(Math.min(1, Math.max(0, r)));
}
