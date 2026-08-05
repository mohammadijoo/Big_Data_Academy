
(() => {
  const search = document.querySelector('[data-curriculum-search]');
  const expand = document.querySelector('[data-expand-chapters]');
  const chapters = [...document.querySelectorAll('.chapter-card')];
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    chapters.forEach(ch => {
      const rows = [...ch.querySelectorAll('.lesson-row')];
      const chapterMatch = ch.querySelector('summary').textContent.toLowerCase().includes(q);
      let visible = chapterMatch;
      rows.forEach(row => { const match = !q || chapterMatch || row.textContent.toLowerCase().includes(q); row.hidden = !match; if (match) visible = true; });
      ch.hidden = !visible; if (q && visible) ch.open = true;
    });
  });
  expand?.addEventListener('click', () => {
    const shouldOpen = chapters.some(ch => !ch.open && !ch.hidden);
    chapters.forEach(ch => { if (!ch.hidden) ch.open = shouldOpen; });
    expand.textContent = shouldOpen ? 'Collapse all' : 'Expand all';
  });
})();
