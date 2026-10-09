// Two languages. English is written in the HTML and in strings.ts; Turkish comes from tr.ts.
// Static text: elements marked data-i18n (text), data-i18n-html (markup), data-i18n-title, data-i18n-aria.
import { EN, type Key } from './strings';
import { TR_STATIC, TR_STRINGS } from './tr';

export type Lang = 'en' | 'tr';
const STORE = 'bloch-lang';
const listeners: Array<(lang: Lang) => void> = [];

function initial(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'tr') return q;
  try {
    const saved = localStorage.getItem(STORE);
    if (saved === 'en' || saved === 'tr') return saved;
  } catch { /* storage blocked: fall through */ }
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export let lang: Lang = initial();

export function t(key: Key, params: Record<string, string | number> = {}): string {
  const text: string = (lang === 'tr' && TR_STRINGS[key]) || EN[key];
  return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

const ATTRS: Array<[string, (el: HTMLElement) => string, (el: HTMLElement, v: string) => void]> = [
  ['i18n', (el) => el.textContent ?? '', (el, v) => { el.textContent = v; }],
  ['i18nHtml', (el) => el.innerHTML, (el, v) => { el.innerHTML = v; }],
  ['i18nTitle', (el) => el.title, (el, v) => { el.title = v; }],
  ['i18nAria', (el) => el.getAttribute('aria-label') ?? '', (el, v) => el.setAttribute('aria-label', v)],
];

function applyStatic() {
  for (const [attr, read, write] of ATTRS) {
    const sel = `[data-${attr.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`;
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const key = el.dataset[attr]!;
      const cacheKey = `en${attr}`;
      if (el.dataset[cacheKey] === undefined) el.dataset[cacheKey] = read(el); // remember the English
      write(el, lang === 'tr' && TR_STATIC[key] ? TR_STATIC[key] : el.dataset[cacheKey]!);
    });
  }
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.setAttribute('aria-pressed', String(on));
    // 24 px tall touch target; the negative margin keeps the drawn line where it was
    b.className = `min-h-6 -my-[5px] ${on ? 'font-bold text-primary' : 'text-on-surface-variant hover:text-on-surface'}`;
  });
}

export function setLang(next: Lang) {
  lang = next;
  try { localStorage.setItem(STORE, next); } catch { /* ignore */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  history.replaceState(null, '', url);
  applyStatic();
  listeners.forEach((fn) => fn(next));
}

export function onLang(fn: (lang: Lang) => void) {
  listeners.push(fn);
}

export function initI18n() {
  applyStatic();
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => setLang(b.dataset.lang as Lang)));
}
