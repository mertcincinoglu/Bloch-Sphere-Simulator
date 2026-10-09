// Notation & Sources: the conventions table is static; the reference list comes from content/sources.ts.
import './common';
import $ from 'jquery';
import { lang, onLang, t } from './i18n';
import type { Key } from './strings';
import { SOURCES } from './content/sources';

const GROUPS: Array<{ id: 'theory' | 'teaching' | 'research' | 'tools'; key: Key; mark: string }> = [
  { id: 'theory', key: 'ref.theory', mark: 'bg-primary' },
  { id: 'teaching', key: 'ref.teaching', mark: 'bg-secondary' },
  { id: 'research', key: 'ref.research', mark: 'bg-tertiary' },
  { id: 'tools', key: 'ref.tools', mark: 'bg-on-surface' },
];

function render() {
  const refs = $('#refs').empty();
  $('#ref-count').text(t('ref.count', { n: SOURCES.length }));
  GROUPS.forEach((g, gi) => {
    const list = $('<div class="divide-y divide-outline-variant">');
    SOURCES.forEach((s, i) => {
      if (s.group !== g.id) return;
      const year = s.year === 'n.d.' ? t('ref.nd') : s.year;
      list.append($(`<div class="py-3 flex gap-4 items-start scroll-mt-28 target:bg-primary-fixed/60" id="src-${s.id}">`).append(
        $('<span class="font-label-md text-label-md text-primary font-bold shrink-0 w-8">').text(`[${i + 1}]`),
        $('<div class="space-y-1 min-w-0">').append(
          $('<p class="font-body-md text-[18px] leading-[1.5] text-on-surface break-words">').append(
            $('<strong>').text(s.authors), ` (${year}). `,
            $('<a class="italic underline hover:text-primary transition-colors" target="_blank" rel="noopener">').attr('href', s.url).text(s.title),
            ` (${s.venue}).`,
          ),
          $('<p class="font-body-md text-[16px] leading-[1.5] text-on-surface-variant">').text(s.note[lang]),
        ),
      ));
    });
    refs.append($('<div class="clean-paper border border-on-surface shadow-hard-card p-4 sm:p-6 space-y-2">').append(
      $('<div class="flex items-center gap-2 border-b border-outline-variant pb-2">').append(
        $(`<span class="w-2 h-2 ${g.mark}" aria-hidden="true">`),
        $('<h3 class="font-headline-sm text-label-lg text-on-surface">').text(`§ B.${gi + 1} ${t(g.key)}`),
      ),
      list,
    ));
  });
  // a link like …/sources#src-hu-2024 lands on its entry once the list exists
  if (location.hash.startsWith('#src-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

onLang(render);
render();
