(() => {
  const progress = document.querySelector('[data-reading-progress]');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
  };
  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);

  document.querySelectorAll('[data-code-block]').forEach(block => {
    const button = block.querySelector('[data-copy-code]');
    const code = block.querySelector('code');
    button?.addEventListener('click', () => window.BDA?.copyText(code?.innerText || '', button, 'Copied'));
  });

  const sidebar = document.querySelector('[data-course-sidebar]');
  const overlay = document.querySelector('[data-sidebar-overlay]');
  const openButton = document.querySelector('[data-sidebar-open]');
  const closeButton = document.querySelector('[data-sidebar-close]');
  const toggleSidebar = open => {
    sidebar?.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  openButton?.addEventListener('click', () => toggleSidebar(true));
  closeButton?.addEventListener('click', () => toggleSidebar(false));
  overlay?.addEventListener('click', () => toggleSidebar(false));

  const search = document.querySelector('[data-sidebar-search]');
  const curriculum = document.querySelector('.sidebar-curriculum');
  const chapters = [...document.querySelectorAll('.sidebar-chapter')];
  const originalOpenState = new Map(chapters.map(chapter => [chapter, chapter.open]));
  let emptyMessage = null;

  const normalize = value => value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();

  const getEmptyMessage = () => {
    if (emptyMessage || !curriculum) return emptyMessage;
    emptyMessage = document.createElement('p');
    emptyMessage.className = 'sidebar-empty';
    emptyMessage.hidden = true;
    emptyMessage.textContent = 'No lessons match this search.';
    curriculum.prepend(emptyMessage);
    return emptyMessage;
  };

  const filterSidebar = () => {
    if (!search) return;
    const query = normalize(search.value);
    let visibleChapters = 0;

    chapters.forEach(chapter => {
      const summary = chapter.querySelector('summary');
      const lessons = [...chapter.querySelectorAll('.sidebar-lesson')];
      const chapterMatches = Boolean(query && normalize(summary?.textContent || '').includes(query));
      let visibleLessons = 0;

      lessons.forEach(lesson => {
        const lessonMatches = !query || chapterMatches || normalize(lesson.textContent).includes(query);
        lesson.hidden = !lessonMatches;
        if (lessonMatches) visibleLessons += 1;
      });

      const chapterVisible = !query || visibleLessons > 0;
      chapter.hidden = !chapterVisible;
      if (chapterVisible) visibleChapters += 1;

      if (query && chapterVisible) chapter.open = true;
      if (!query) chapter.open = originalOpenState.get(chapter) ?? false;
    });

    const message = getEmptyMessage();
    if (message) message.hidden = visibleChapters !== 0;
    search.setAttribute('aria-label', query ? `Search results for ${search.value.trim()}` : 'Search course lessons');
  };

  search?.addEventListener('input', filterSidebar);
  search?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      filterSidebar();
      search.focus();
    }
  });

  const toc = document.querySelector('[data-generated-toc]');
  if (toc) {
    const headings = [...document.querySelectorAll('.lesson-content h2')];
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      item.append(link);
      toc.append(item);
    });
  }
})();
