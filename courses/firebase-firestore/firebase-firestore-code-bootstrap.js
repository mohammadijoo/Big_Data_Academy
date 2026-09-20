(() => {
  /* The Academy lesson highlighter intentionally supports a compact language
     set. Normalize Firestore course aliases before lesson.js runs so JSON,
     HTML/XML and rules/config snippets receive the generic token highlighter
     instead of falling back to plain text. Visible code and code titles remain
     unchanged. */
  const genericAliases = new Set([
    'json', 'jsonc', 'html', 'xml', 'css', 'typescript', 'ts',
    'firestore-rules', 'rules', 'firebase-rules'
  ]);

  const languageFromClass = code => {
    for (const cls of code?.classList || []) {
      if (cls.startsWith('language-')) return cls.slice('language-'.length).toLowerCase();
    }
    return '';
  };

  document.querySelectorAll('.code-window').forEach(block => {
    const code = block.querySelector('code');
    const button = block.querySelector('.copy-code');
    if (!code) return;

    block.setAttribute('data-code-block', '');
    if (button) button.setAttribute('data-copy-code', '');

    const declared = String(
      code.dataset.language || block.dataset.language || languageFromClass(code) || 'text'
    ).toLowerCase().trim();

    if (!block.dataset.language) block.dataset.language = declared;

    if (genericAliases.has(declared)) {
      block.dataset.sourceLanguage = declared;
      block.dataset.language = 'generic';
      code.dataset.language = 'generic';
    }
  });
})();
