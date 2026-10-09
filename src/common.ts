// Shared by every page: fonts, styles, icons and the language switch.
import '@fontsource-variable/eb-garamond';
import '@fontsource-variable/eb-garamond/wght-italic.css';
import '@fontsource-variable/space-grotesk';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/400-italic.css';
import '@fontsource/space-mono/700.css';
import './style.css';
import { initI18n } from './i18n';

// Material Symbols used by the design, inlined so nothing loads from another site
const ICONS = import.meta.glob('/node_modules/@material-symbols/svg-400/outlined/{menu_book,restart_alt,psychology,lightbulb,keyboard_arrow_down,query_stats,flash_on,bar_chart,undo,rotate_right,share,warning,arrow_forward,arrow_back}.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function fillIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    if (el.firstChild) return;
    const name = el.dataset.icon;
    el.innerHTML = Object.entries(ICONS).find(([path]) => path.endsWith(`/${name}.svg`))?.[1] ?? '';
    el.setAttribute('aria-hidden', 'true');
  });
}

fillIcons();
initI18n();
