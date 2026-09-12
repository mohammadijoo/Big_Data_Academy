(() => {
  const esc = value => String(value).replace(/[&<>\"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  })[ch]);
  const tok = (cls, value) => `<span class="${cls}">${esc(value)}</span>`;

  const quoteAware = (line, wordHandler, commentMarkers = []) => {
    let out = '', i = 0;
    while (i < line.length) {
      const marker = commentMarkers.find(m => line.startsWith(m, i));
      if (marker) { out += tok('token-comment', line.slice(i)); break; }
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === '\\') { j += 2; continue; }
          if (line[j] === ch) { j++; break; }
          j++;
        }
        out += tok('token-string', line.slice(i, j)); i = j; continue;
      }
      const n = line.slice(i).match(/^-?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
      if (n) { out += tok('token-number', n[0]); i += n[0].length; continue; }
      const w = line.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_.$-]*/);
      if (w) { out += wordHandler(w[0], i, line); i += w[0].length; continue; }
      if ('{}[]():,=+*/<>!|&'.includes(ch)) out += tok('token-punctuation', ch);
      else out += esc(ch);
      i++;
    }
    return out;
  };

  const jsonLine = line => quoteAware(line, word => {
    if (/^(true|false|null)$/i.test(word)) return tok('token-keyword', word);
    return tok('token-name', word);
  }, ['//']);

  const yamlLine = line => {
    if (/^\s*#/.test(line)) return tok('token-comment', line);
    const m = line.match(/^(\s*)([-?]\s+)?([^:#][^:]*?)(:\s*)(.*)$/);
    if (m) {
      const tail = quoteAware(m[5], word => /^(true|false|null|yes|no|on|off)$/i.test(word)
        ? tok('token-keyword', word) : tok('token-string', word), [' #']);
      return esc(m[1]) + esc(m[2] || '') + tok('token-name', m[3]) + tok('token-operator', m[4]) + tail;
    }
    return quoteAware(line, word => /^(true|false|null|yes|no|on|off)$/i.test(word)
      ? tok('token-keyword', word) : tok('token-name', word), ['#']);
  };

  const httpLine = line => {
    const req = line.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)(?:\s+(HTTP\/\d(?:\.\d)?))?$/i);
    if (req) return tok('token-keyword', req[1]) + ' ' + tok('token-string', req[2]) + (req[3] ? ' ' + tok('token-name', req[3]) : '');
    const status = line.match(/^(HTTP\/\d(?:\.\d)?)\s+(\d{3})(.*)$/i);
    if (status) return tok('token-name', status[1]) + ' ' + tok('token-number', status[2]) + tok('token-string', status[3]);
    const header = line.match(/^([A-Za-z0-9-]+)(:\s*)(.*)$/);
    if (header) return tok('token-name', header[1]) + tok('token-operator', header[2]) + tok('token-string', header[3]);
    if (/^\s*[\[{]/.test(line) || /^\s*[}\]]/.test(line) || /^\s*"/.test(line)) return jsonLine(line);
    return esc(line);
  };

  const shellKeywords = new Set('if then else elif fi for while do done case esac in function select until time coproc export readonly local declare typeset set unset source alias unalias return exit break continue true false'.split(' '));
  const bashLine = line => quoteAware(line, word => {
    if (shellKeywords.has(word)) return tok('token-keyword', word);
    if (/^(curl|jq|docker|python|python3|pip|java|keytool|openssl|grep|awk|sed|cat|printf|echo|export|sleep|time)$/i.test(word)) return tok('token-function', word);
    if (/^--?[A-Za-z]/.test(word)) return tok('token-operator', word);
    if (/^\$/.test(word)) return tok('token-name', word);
    return tok('token-name', word);
  }, ['#']);

  const pyKeywords = new Set('and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield match case'.split(' '));
  const pythonLine = line => quoteAware(line, word => {
    if (pyKeywords.has(word)) return tok('token-keyword', word);
    if (/^[A-Za-z_]\w*$/.test(word) && line.slice(line.indexOf(word) + word.length).trimStart().startsWith('(')) return tok('token-function', word);
    return tok('token-name', word);
  }, ['#']);

  const markdownLine = line => {
    if (/^\s*#{1,6}\s/.test(line)) return tok('token-keyword', line);
    if (/^\s*>/.test(line)) return tok('token-comment', line);
    return esc(line)
      .replace(/(`[^`]+`)/g, m => tok('token-string', m))
      .replace(/(\*\*[^*]+\*\*)/g, m => tok('token-keyword', m));
  };

  const csvLine = line => line.split(',').map((cell, i) => tok(i === 0 ? 'token-name' : 'token-string', cell)).join(tok('token-punctuation', ','));

  const languageOf = block => {
    const code = block.querySelector('code');
    const explicit = (code?.dataset.language || block.dataset.language || '').trim().toLowerCase();
    if (explicit) return explicit;
    const title = (block.querySelector('.code-title')?.textContent || '').split('·')[0].trim().toLowerCase();
    return title;
  };

  const pick = lang => {
    if (['json', 'ndjson'].includes(lang)) return jsonLine;
    if (['yaml', 'yml'].includes(lang)) return yamlLine;
    if (['http', 'rest'].includes(lang)) return httpLine;
    if (['bash', 'shell', 'sh', 'curl'].includes(lang)) return bashLine;
    if (['python', 'py'].includes(lang)) return pythonLine;
    if (lang === 'csv') return csvLine;
    if (['markdown', 'md'].includes(lang)) return markdownLine;
    return null;
  };

  document.querySelectorAll('[data-code-block]').forEach(block => {
    const code = block.querySelector('code');
    if (!code) return;
    const lang = languageOf(block);
    const highlighter = pick(lang);
    if (!highlighter) return; // shared lesson.js remains the fallback for text/other languages.

    const lines = [...code.querySelectorAll('.code-line')];
    if (lines.length) {
      lines.forEach(line => { line.innerHTML = highlighter(line.textContent || ''); });
    } else {
      code.innerHTML = (code.textContent || '').split('\n').map(highlighter).join('\n');
    }
    code.dataset.syntaxHighlighted = 'true';
    block.dataset.courseSyntax = lang;
  });
})();
