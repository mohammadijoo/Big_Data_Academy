
(() => {
  const search = document.querySelector('[data-course-search]');
  const stage = document.querySelector('[data-stage-filter]');
  const status = document.querySelector('[data-status-filter]');
  const cards = [...document.querySelectorAll('[data-course-card]')];
  const groups = [...document.querySelectorAll('[data-course-stage]')];
  const empty = document.querySelector('[data-empty-state]');
  const count = document.querySelector('[data-result-count]');
  if (!cards.length) return;
  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const stageValue = stage?.value || 'all';
    const statusValue = status?.value || 'all';
    let visible = 0;
    cards.forEach(card => {
      const match = (!q || card.dataset.search.includes(q)) && (stageValue === 'all' || card.dataset.stage === stageValue) && (statusValue === 'all' || card.dataset.status === statusValue);
      card.hidden = !match; if (match) visible++;
    });
    groups.forEach(group => group.hidden = !group.querySelector('[data-course-card]:not([hidden])'));
    empty?.classList.toggle('is-visible', visible === 0);
    if (count) count.textContent = `${visible} course${visible === 1 ? '' : 's'}`;
  };
  [search, stage, status].forEach(el => el?.addEventListener(el === search ? 'input' : 'change', apply));
  apply();
})();
