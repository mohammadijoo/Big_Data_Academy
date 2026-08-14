#!/usr/bin/env python3
"""Validate local references, JSON, catalogue counts, course landing pages, and curricula."""
from __future__ import annotations
import json, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]
class ReferenceParser(HTMLParser):
    def __init__(self,path): super().__init__(convert_charrefs=True); self.path=path
    def check_reference(self,value):
        if not value:return
        p=urlsplit(value)
        if p.scheme or value.startswith(("//","#","mailto:","tel:","data:","javascript:")):return
        local=unquote(p.path)
        if not local:return
        target=(self.path.parent/local).resolve()
        try: target.relative_to(ROOT)
        except ValueError: ERRORS.append(f"{self.path.relative_to(ROOT)}: reference escapes project root: {value}"); return
        if not target.exists(): ERRORS.append(f"{self.path.relative_to(ROOT)}: missing local reference: {value}")
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for k in ('href','src'): self.check_reference(a.get(k))
for path in ROOT.rglob('*.html'):
    if path.stat().st_size==0: continue
    try:
        p=ReferenceParser(path); p.feed(path.read_text(encoding='utf-8')); p.close()
    except Exception as exc: ERRORS.append(f"{path.relative_to(ROOT)}: HTML parser error: {exc}")
json_data={}
for path in ROOT.rglob('*.json'):
    try: json_data[path]=json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc: ERRORS.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")
cat_path=ROOT/'assets/data/courses.json'; cat=json_data.get(cat_path)
expected_available={'sql-database-fundamentals','data-modeling-design','sqlite'}
if isinstance(cat,dict):
    courses=cat.get('courses',[]); stages=cat.get('stages',[])
    if len(courses)!=44: ERRORS.append(f"courses.json: expected 44 courses, found {len(courses)}")
    if len(stages)!=12: ERRORS.append(f"courses.json: expected 12 stages, found {len(stages)}")
    available={c.get('slug') for c in courses if c.get('status')=='available'}
    if available!=expected_available: ERRORS.append(f"courses.json: expected available courses {sorted(expected_available)}, found {sorted(available)}")
    for c in courses:
        url=c.get('url')
        if not url: ERRORS.append(f"courses.json: {c.get('slug')} has no landing-page URL"); continue
        if not (ROOT/url).exists(): ERRORS.append(f"courses.json: missing landing page {url}")
        cur=ROOT/'courses'/c['slug']/'curriculum.json'
        if not cur.exists(): ERRORS.append(f"courses.json: missing curriculum {cur.relative_to(ROOT)}")
for path,data in json_data.items():
    if path.name!='curriculum.json' or not isinstance(data,dict): continue
    chapters=data.get('chapters',[])
    seen_ch=[]
    for ch in chapters:
        seen_ch.append(ch.get('number'))
        lessons=ch.get('lessons',[])
        seen_l=[]
        for lesson in lessons:
            seen_l.append(lesson.get('number'))
            status=lesson.get('status'); rel=lesson.get('path')
            if status not in {'planned','published'}: ERRORS.append(f"{path.relative_to(ROOT)}: invalid lesson status {status!r}")
            if status=='published' and rel and not (path.parent/rel).exists(): ERRORS.append(f"{path.relative_to(ROOT)}: published lesson missing {rel}")
        if seen_l!=list(range(1,len(lessons)+1)): ERRORS.append(f"{path.relative_to(ROOT)}: non-sequential lessons in chapter {ch.get('number')}")
    if seen_ch!=list(range(1,len(chapters)+1)): ERRORS.append(f"{path.relative_to(ROOT)}: non-sequential chapters")
if ERRORS:
    print('\n'.join(ERRORS)); sys.exit(1)
print('Validation passed: 44 course landing pages declared, 12 stages, 3 available courses, and curricula JSON validated.')
