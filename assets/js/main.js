(() => {
  const root = document.documentElement;
  const storageKey = 'big-data-academy-theme';

  const icons = {
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z"/></svg>'
  };

  const currentTheme = () => root.dataset.theme === 'light' ? 'light' : 'dark';

  const syncThemeControls = theme => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      button.innerHTML = theme === 'dark' ? icons.sun : icons.moon;
      button.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      button.setAttribute('title', `Switch to ${nextTheme} theme`);
    });

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#05070b' : '#f4f7fb';
  };

  const setTheme = theme => {
    root.dataset.theme = theme;
    try { localStorage.setItem(storageKey, theme); } catch (_) {}
    syncThemeControls(theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };

  syncThemeControls(currentTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => setTheme(currentTheme() === 'light' ? 'dark' : 'light'));
  });

  const header = document.querySelector('[data-header]');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 10);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const menuButton = document.querySelector('[data-mobile-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  menuButton?.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px' }) : null;

  document.querySelectorAll('.reveal').forEach(element => {
    if (observer) observer.observe(element);
    else element.classList.add('is-visible');
  });

  const copyText = async (text, button, success = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }

    if (button) {
      const old = button.innerHTML;
      button.textContent = success;
      setTimeout(() => { button.innerHTML = old; }, 1500);
    }
  };

  document.querySelector('[data-copy-donation]')?.addEventListener('click', event => {
    const address = document.querySelector('[data-donation-address]')?.textContent.trim() || '';
    copyText(address, event.currentTarget, 'Address copied');
  });

  window.BDA = { copyText, setTheme };
})();
