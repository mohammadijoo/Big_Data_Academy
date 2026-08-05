#!/usr/bin/env python3
"""Validate local references, JSON, catalogue counts, and reserved lesson paths."""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


class ReferenceParser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.path = path

    def check_reference(self, value: str | None) -> None:
        if not value:
            return
        parsed = urlsplit(value)
        if parsed.scheme or value.startswith(("//", "#", "mailto:", "tel:", "data:", "javascript:")):
            return
        local_path = unquote(parsed.path)
        if not local_path:
            return
        target = (self.path.parent / local_path).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            ERRORS.append(f"{self.path.relative_to(ROOT)}: reference escapes project root: {value}")
            return
        if not target.exists():
            ERRORS.append(f"{self.path.relative_to(ROOT)}: missing local reference: {value}")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        for key in ("href", "src"):
            self.check_reference(attributes.get(key))


html_files = list(ROOT.rglob("*.html"))
for path in html_files:
    if path.stat().st_size == 0:  # Deliberate stable URL placeholder.
        continue
    parser = ReferenceParser(path)
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:  # pragma: no cover - validation utility
        ERRORS.append(f"{path.relative_to(ROOT)}: HTML parser error: {exc}")

json_files = list(ROOT.rglob("*.json"))
json_data: dict[Path, object] = {}
for path in json_files:
    try:
        json_data[path] = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        ERRORS.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")

catalogue_path = ROOT / "assets/data/courses.json"
curriculum_path = ROOT / "courses/sql-database-fundamentals/curriculum.json"

catalogue = json_data.get(catalogue_path)
if isinstance(catalogue, dict):
    courses = catalogue.get("courses", [])
    stages = catalogue.get("stages", [])
    if len(courses) != 44:
        ERRORS.append(f"courses.json: expected 44 courses, found {len(courses)}")
    if len(stages) != 12:
        ERRORS.append(f"courses.json: expected 12 stages, found {len(stages)}")
    available = [course for course in courses if course.get("status") == "available"]
    if len(available) != 1 or available[0].get("slug") != "sql-database-fundamentals":
        ERRORS.append("courses.json: SQL and Database Fundamentals must be the only available course")

curriculum = json_data.get(curriculum_path)
if isinstance(curriculum, dict):
    chapters = curriculum.get("chapters", [])
    lessons = [lesson for chapter in chapters for lesson in chapter.get("lessons", [])]
    if len(chapters) != 18:
        ERRORS.append(f"curriculum.json: expected 18 chapters, found {len(chapters)}")
    if len(lessons) != 90:
        ERRORS.append(f"curriculum.json: expected 90 lessons, found {len(lessons)}")
    published = [lesson for lesson in lessons if lesson.get("status") == "published"]
    expected_published = (
        {f"Chapter01/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter02/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter03/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter04/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter05/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter06/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter07/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter08/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter09/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter10/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter11/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter12/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter13/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter14/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter15/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter16/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter17/Lesson{i}.html" for i in range(1, 6)}
        | {f"Chapter18/Lesson{i}.html" for i in range(1, 6)}
    )
    published_paths = {lesson.get("path") for lesson in published}
    if published_paths != expected_published:
        ERRORS.append("curriculum.json: all ninety Chapter 1–18 lessons must be published")
    for lesson in lessons:
        lesson_path = curriculum_path.parent / lesson["path"]
        if not lesson_path.exists():
            ERRORS.append(f"curriculum.json: missing reserved lesson path {lesson['path']}")

if ERRORS:
    print("\n".join(ERRORS))
    sys.exit(1)

placeholder_count = sum(1 for path in html_files if path.stat().st_size == 0)
print(
    "Validation passed: "
    f"{len(html_files)} HTML files ({placeholder_count} reserved placeholders), "
    f"{len(json_files)} JSON files, 44 courses, 12 stages, and 90 SQL lesson paths."
)
