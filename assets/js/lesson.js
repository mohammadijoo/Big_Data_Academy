(() => {
  const escapeSyntaxText = value => String(value).replace(/[&<>\"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char]);

  const wrapSyntaxToken = (className, value) =>
    `<span class="${className}">${escapeSyntaxText(value)}</span>`;

  const SQL_KEYWORDS = new Set(`
    ABORT ACTION ADD AFTER ALL ALTER ANALYZE AND AS ASC ATTACH AUTOINCREMENT BEFORE BEGIN BETWEEN BY
    CASCADE CASE CAST CHECK COLLATE COLUMN COMMIT CONFLICT CONSTRAINT CREATE CROSS CURRENT_DATE
    CURRENT_TIME CURRENT_TIMESTAMP DATABASE DEFAULT DEFERRABLE DEFERRED DELETE DESC DETACH DISTINCT DO
    DROP EACH ELSE END ESCAPE EXCEPT EXCLUDE EXCLUSIVE EXISTS EXPLAIN FAIL FILTER FIRST FOLLOWING FOR
    FOREIGN FROM FULL GENERATED GLOB GROUP GROUPS HAVING IF IGNORE IMMEDIATE IN INDEX INDEXED INITIALLY
    INNER INSERT INSTEAD INTERSECT INTO IS ISNULL JOIN KEY LAST LEFT LIKE LIMIT MATCH MATERIALIZED NATURAL
    NO NOT NOTHING NOTNULL NULL NULLS OF OFFSET ON OR ORDER OTHERS OUTER OVER PARTITION PLAN PRAGMA PRECEDING
    PRIMARY QUERY RAISE RANGE RECURSIVE REFERENCES REGEXP REINDEX RELEASE RENAME REPLACE RESTRICT RETURNING
    RIGHT ROLLBACK ROW ROWS SAVEPOINT SELECT SET TABLE TEMP TEMPORARY THEN TIES TO TRANSACTION TRIGGER
    UNBOUNDED UNION UNIQUE UPDATE USING VACUUM VALUES VIEW VIRTUAL WHEN WHERE WINDOW WITH WITHOUT TRUE FALSE
    GRANT REVOKE SCHEMA SEQUENCE MERGE FETCH NEXT ONLY TOP IDENTITY READ WRITE WORK ISOLATION LEVEL SERIALIZABLE COMMITTED UNCOMMITTED REPEATABLE SNAPSHOT LOCK SHARE MODE NOWAIT SKIP LOCKED INCLUDE CONCURRENTLY COSTS VERBOSE BUFFERS WAL FORMAT BITMAP HEAP SEQ SCAN SEARCH COVERING BTREE HASH GIST SPGIST GIN BRIN FUNCTION PROCEDURE RETURNS RETURN LANGUAGE PLPGSQL IMMUTABLE STABLE VOLATILE DEFINER INVOKER CALL REFRESH DATA OLD NEW EACH STATEMENT ACTOR OUTBOX ROLE LOGIN NOLOGIN PASSWORD CONNECT USAGE POLICY ENABLE FORCE ROW LEVEL SECURITY BYPASSRLS PUBLIC HOSTSSL SCRAM BACKUP RESTORE ARCHIVE MASK CLASSIFICATION RETENTION PURGE DIALECT DRIVER POOL PREPARE DEALLOCATE CONNECTOR MIGRATION REVISION SEED CHECKSUM BASELINE UPSERT AUTOCOMMIT
  `.trim().split(/\s+/));

  const SQL_TYPES = new Set(`
    BIGINT BIGSERIAL BINARY BIT BLOB BOOLEAN BOOL BYTEA CHAR CHARACTER CLOB DATE DATETIME DEC DECIMAL DOUBLE
    ENUM FLOAT4 FLOAT8 FLOAT INT INT2 INT4 INT8 INTEGER INTERVAL JSON JSONB LONG MEDIUMINT MONEY NCHAR NCLOB
    NUMERIC NVARCHAR REAL SERIAL SMALLINT SMALLSERIAL TEXT TIME TIMESTAMP TIMESTAMPTZ TINYINT UUID VARBINARY
    VARCHAR VARCHAR2 XML YEAR
  `.trim().split(/\s+/));

  const SQL_FUNCTIONS = new Set(`
    ABS AVG CAST COALESCE CONCAT COUNT CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP DATE DATETIME HEX IFNULL
    JSON_ARRAY JSON_EXTRACT JSON_OBJECT LENGTH LOWER LTRIM MAX MIN NULLIF OCTET_LENGTH PRINTF RANDOM REPLACE
    ROUND RTRIM STRFTIME SUBSTR SUBSTRING SUM TIME TOTAL TRIM TYPEOF UPPER TABLE_INFO FOREIGN_KEY_LIST
    DATABASE_LIST
  `.trim().split(/\s+/));

  const SQL_OPERATORS = new Set(['=', '==', '!=', '<>', '<', '<=', '>', '>=', '+', '-', '*', '/', '%', '||', '->', '->>']);

  const readQuoted = (source, start, opener, closer = opener) => {
    let index = start + 1;
    while (index < source.length) {
      if (source[index] === closer) {
        if (closer === "'" && source[index + 1] === "'") {
          index += 2;
          continue;
        }
        index += 1;
        break;
      }
      if (source[index] === '\\' && index + 1 < source.length && closer !== ']') index += 2;
      else index += 1;
    }
    return index;
  };

  const highlightSqlLine = source => {
    let html = '';
    let index = 0;

    while (index < source.length) {
      if (source.startsWith('--', index)) {
        html += wrapSyntaxToken('token-comment', source.slice(index));
        break;
      }

      const char = source[index];

      if (/\s/.test(char)) {
        let end = index + 1;
        while (end < source.length && /\s/.test(source[end])) end += 1;
        html += escapeSyntaxText(source.slice(index, end));
        index = end;
        continue;
      }

      if (char === "'") {
        const end = readQuoted(source, index, "'");
        html += wrapSyntaxToken('token-string', source.slice(index, end));
        index = end;
        continue;
      }

      if (char === '"' || char === '`') {
        const end = readQuoted(source, index, char);
        html += wrapSyntaxToken('token-name', source.slice(index, end));
        index = end;
        continue;
      }

      if (char === '[') {
        const end = readQuoted(source, index, '[', ']');
        html += wrapSyntaxToken('token-name', source.slice(index, end));
        index = end;
        continue;
      }

      if (char === '.' && /[A-Za-z_]/.test(source[index + 1] || '') && /^\s*$/.test(source.slice(0, index))) {
        let end = index + 2;
        while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) end += 1;
        html += wrapSyntaxToken('token-function', source.slice(index, end));
        index = end;
        continue;
      }

      if (/\d/.test(char) || (char === '.' && /\d/.test(source[index + 1] || ''))) {
        const match = source.slice(index).match(/^(?:0x[0-9a-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)/i);
        if (match) {
          html += wrapSyntaxToken('token-number', match[0]);
          index += match[0].length;
          continue;
        }
      }

      if (/[A-Za-z_]/.test(char)) {
        let end = index + 1;
        while (end < source.length && /[A-Za-z0-9_$]/.test(source[end])) end += 1;
        const word = source.slice(index, end);
        const upper = word.toUpperCase();
        let className = 'token-name';
        if (SQL_KEYWORDS.has(upper) || SQL_TYPES.has(upper)) className = 'token-keyword';
        else if (SQL_FUNCTIONS.has(upper)) className = 'token-function';
        html += wrapSyntaxToken(className, word);
        index = end;
        continue;
      }

      const twoCharacterOperator = source.slice(index, index + 2);
      if (SQL_OPERATORS.has(twoCharacterOperator)) {
        html += wrapSyntaxToken('token-operator', twoCharacterOperator);
        index += 2;
        continue;
      }
      if (SQL_OPERATORS.has(char)) {
        html += wrapSyntaxToken('token-operator', char);
        index += 1;
        continue;
      }

      html += escapeSyntaxText(char);
      index += 1;
    }

    return html;
  };

  const highlightTextLine = source => {
    if (/^\s*(?:#|--)/.test(source)) return wrapSyntaxToken('token-comment', source);
    const separator = source.indexOf(':');
    if (separator > -1) {
      const key = source.slice(0, separator);
      const value = source.slice(separator + 1);
      return `${wrapSyntaxToken('token-name', key)}${wrapSyntaxToken('token-operator', ':')}${wrapSyntaxToken('token-string', value)}`;
    }
    return escapeSyntaxText(source)
      .replace(/\b(?:required|optional|unique|nullable|integer|decimal|text|date|timestamp|boolean)\b/gi,
        match => wrapSyntaxToken('token-keyword', match));
  };

  const GENERIC_KEYWORDS = new Set(`
    def class return import from as try except finally raise with yield async await if else elif for while in is not and or True False None
    public private protected static final void int long boolean new throws throw try catch finally package import extends implements interface record
    const let var function async await return if else for while switch case break continue true false null undefined
    set export source echo exit fi then do done local readonly
  `.trim().split(/\s+/));

  const highlightGenericLine = source => {
    let html = '';
    let index = 0;
    while (index < source.length) {
      if (source.startsWith('//', index) || source[index] === '#') {
        html += wrapSyntaxToken('token-comment', source.slice(index));
        break;
      }
      const char = source[index];
      if (/\s/.test(char)) {
        let end=index+1; while(end<source.length && /\s/.test(source[end])) end+=1;
        html += escapeSyntaxText(source.slice(index,end)); index=end; continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        const end=readQuoted(source,index,char); html += wrapSyntaxToken('token-string',source.slice(index,end)); index=end; continue;
      }
      if (/\d/.test(char)) {
        const match=source.slice(index).match(/^\d+(?:\.\d+)?/); html += wrapSyntaxToken('token-number',match[0]); index+=match[0].length; continue;
      }
      if (/[A-Za-z_]/.test(char)) {
        let end=index+1; while(end<source.length && /[A-Za-z0-9_]/.test(source[end])) end+=1;
        const word=source.slice(index,end); const cls=GENERIC_KEYWORDS.has(word)?'token-keyword':(source[end]==='('?'token-function':'token-name');
        html += wrapSyntaxToken(cls,word); index=end; continue;
      }
      if ('=+-*/<>!&|:'.includes(char)) html += wrapSyntaxToken('token-operator',char); else html += escapeSyntaxText(char);
      index += 1;
    }
    return html;
  };

  const normalizeCodeLanguage = value => {
    const language = String(value || '').toLowerCase().trim();
    if (['sql', 'sqlite', 'postgresql', 'postgres', 'mysql', 'sql server', 'mssql', 'oracle'].includes(language)) return 'sql';
    if (['text', 'plaintext', 'contract', 'yaml', 'yml'].includes(language)) return language === 'yaml' || language === 'yml' ? 'generic' : 'text';
    if (['python', 'py', 'java', 'javascript', 'js', 'bash', 'shell', 'sh'].includes(language)) return 'generic';
    return language || 'text';
  };

  const highlightCodeBlocks = () => {
    document.querySelectorAll('[data-code-block]').forEach(block => {
      const code = block.querySelector('code');
      if (!code || code.dataset.syntaxHighlighted === 'true' || code.querySelector('[class*="token-"]')) return;

      const title = block.querySelector('.code-title')?.textContent || '';
      const titleLanguage = title.split('·')[0].trim();
      const language = normalizeCodeLanguage(code.dataset.language || block.dataset.language || titleLanguage);
      const highlighter = language === 'sql' ? highlightSqlLine : language === 'generic' ? highlightGenericLine : highlightTextLine;
      const lines = [...code.querySelectorAll('.code-line')];

      if (lines.length) {
        lines.forEach(line => { line.innerHTML = highlighter(line.textContent || ''); });
      } else {
        code.innerHTML = (code.textContent || '').split('\n').map(highlighter).join('\n');
      }

      code.dataset.syntaxHighlighted = 'true';
      block.dataset.language = language;
    });
  };

  highlightCodeBlocks();
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
  const activeLesson = document.querySelector('.sidebar-lesson.is-current');
  const activeChapter = activeLesson?.closest('.sidebar-chapter');
  const originalOpenState = new Map(chapters.map(chapter => [chapter, chapter.open]));
  let emptyMessage = null;

  const positionActiveChapter = () => {
    if (!curriculum || !activeChapter || activeChapter.hidden) return;
    activeChapter.open = true;

    requestAnimationFrame(() => {
      const curriculumTop = curriculum.getBoundingClientRect().top;
      const chapterTop = activeChapter.getBoundingClientRect().top;
      const target = curriculum.scrollTop + chapterTop - curriculumTop;
      curriculum.scrollTop = Math.max(0, target);
    });
  };

  positionActiveChapter();
  window.addEventListener('load', positionActiveChapter, { once: true });
  openButton?.addEventListener('click', positionActiveChapter);

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
    if (!query) positionActiveChapter();
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


  const typesetLessonMath = () => {
    const lessonContent = document.querySelector('.lesson-content');
    if (!lessonContent || !window.MathJax?.typesetPromise) return;
    window.MathJax.typesetPromise([lessonContent]).catch(error => {
      console.error('MathJax typesetting failed:', error);
    });
  };

  if (document.readyState === 'complete') typesetLessonMath();
  else window.addEventListener('load', typesetLessonMath, { once: true });
})();
