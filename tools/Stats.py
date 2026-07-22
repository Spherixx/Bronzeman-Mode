from __future__ import annotations

import argparse
import hashlib
import os
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


# Directories that normally should not count toward project statistics.
DEFAULT_IGNORED_DIRECTORIES = {
    ".git",
    ".idea",
    ".vscode",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".gradle",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "dist",
    "build",
    "target",
    "coverage",
}


# Generated or dependency files that can heavily distort line counts.
DEFAULT_IGNORED_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
}


LANGUAGES = {
    ".py": ("Python", ("#",)),
    ".js": ("JavaScript", ("//",)),
    ".mjs": ("JavaScript", ("//",)),
    ".cjs": ("JavaScript", ("//",)),
    ".jsx": ("JavaScript JSX", ("//",)),
    ".ts": ("TypeScript", ("//",)),
    ".tsx": ("TypeScript TSX", ("//",)),
    ".java": ("Java", ("//",)),
    ".kt": ("Kotlin", ("//",)),
    ".kts": ("Kotlin Script", ("//",)),
    ".c": ("C", ("//",)),
    ".h": ("C/C++ Header", ("//",)),
    ".cpp": ("C++", ("//",)),
    ".cc": ("C++", ("//",)),
    ".hpp": ("C++ Header", ("//",)),
    ".cs": ("C#", ("//",)),
    ".go": ("Go", ("//",)),
    ".rs": ("Rust", ("//",)),
    ".php": ("PHP", ("//", "#")),
    ".rb": ("Ruby", ("#",)),
    ".sh": ("Shell", ("#",)),
    ".ps1": ("PowerShell", ("#",)),
    ".html": ("HTML", ("<!--",)),
    ".htm": ("HTML", ("<!--",)),
    ".css": ("CSS", ("/*",)),
    ".scss": ("SCSS", ("//", "/*")),
    ".sass": ("Sass", ("//",)),
    ".sql": ("SQL", ("--",)),
    ".lua": ("Lua", ("--",)),
    ".r": ("R", ("#",)),
    ".dart": ("Dart", ("//",)),
    ".vue": ("Vue", ("//", "<!--")),
    ".svelte": ("Svelte", ("//", "<!--")),
    ".xml": ("XML", ("<!--",)),
    ".gradle": ("Gradle", ("//",)),
}


TEXT_DATA_EXTENSIONS = {
    ".json",
    ".csv",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".properties",
    ".md",
    ".txt",
}


@dataclass
class LineStats:
    total: int = 0
    code: int = 0
    blank: int = 0
    comments: int = 0

    def add(self, other: "LineStats") -> None:
        self.total += other.total
        self.code += other.code
        self.blank += other.blank
        self.comments += other.comments


@dataclass
class FileRecord:
    path: Path
    relative_path: Path
    size: int
    modified: float
    extension: str
    language: str | None
    lines: LineStats | None
    markers: Counter[str]


def format_size(size: int) -> str:
    units = ("B", "KB", "MB", "GB", "TB")
    value = float(size)

    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.2f} {unit}"

        value /= 1024

    return f"{size} B"


def percentage(part: int, whole: int) -> float:
    if whole == 0:
        return 0.0

    return (part / whole) * 100


def is_ignored(
    path: Path,
    root: Path,
    ignored_directories: set[str],
    ignored_files: set[str],
) -> bool:
    try:
        relative = path.relative_to(root)
    except ValueError:
        return True

    if path.name in ignored_files:
        return True

    return any(part in ignored_directories for part in relative.parts)


def looks_binary(path: Path, sample_size: int = 8192) -> bool:
    try:
        with path.open("rb") as file:
            sample = file.read(sample_size)
    except OSError:
        return True

    if not sample:
        return False

    if b"\x00" in sample:
        return True

    # Treat files with a large amount of non-text data as binary.
    suspicious_bytes = sum(
        byte < 9 or (13 < byte < 32)
        for byte in sample
    )

    return suspicious_bytes / len(sample) > 0.10


def analyze_text_file(
    path: Path,
    comment_prefixes: tuple[str, ...],
) -> tuple[LineStats, Counter[str]]:
    stats = LineStats()
    markers: Counter[str] = Counter()

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return stats, markers

    in_block_comment = False

    for line in text.splitlines():
        stats.total += 1
        stripped = line.strip()
        upper_line = stripped.upper()

        for marker in ("TODO", "FIXME", "HACK", "BUG", "XXX"):
            if marker in upper_line:
                markers[marker] += upper_line.count(marker)

        if not stripped:
            stats.blank += 1
            continue

        # Basic handling for C-style block comments.
        if in_block_comment:
            stats.comments += 1

            if "*/" in stripped:
                in_block_comment = False

            continue

        if stripped.startswith("/*"):
            stats.comments += 1

            if "*/" not in stripped:
                in_block_comment = True

            continue

        if any(stripped.startswith(prefix) for prefix in comment_prefixes):
            stats.comments += 1
            continue

        stats.code += 1

    return stats, markers


def calculate_hash(path: Path, chunk_size: int = 1024 * 1024) -> str | None:
    digest = hashlib.sha256()

    try:
        with path.open("rb") as file:
            while chunk := file.read(chunk_size):
                digest.update(chunk)
    except OSError:
        return None

    return digest.hexdigest()


def iter_project_files(
    root: Path,
    ignored_directories: set[str],
    ignored_files: set[str],
) -> Iterable[Path]:
    for current_directory, directory_names, file_names in os.walk(root):
        current_path = Path(current_directory)

        directory_names[:] = sorted(
            directory_name
            for directory_name in directory_names
            if directory_name not in ignored_directories
        )

        for file_name in sorted(file_names):
            path = current_path / file_name

            if not is_ignored(
                path,
                root,
                ignored_directories,
                ignored_files,
            ):
                yield path


def print_heading(title: str) -> None:
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def print_table(
    headers: list[str],
    rows: list[list[str]],
    right_aligned_columns: set[int] | None = None,
) -> None:
    if not rows:
        print("No data.")
        return

    right_aligned_columns = right_aligned_columns or set()

    widths = [
        max(
            len(headers[column]),
            max(len(row[column]) for row in rows),
        )
        for column in range(len(headers))
    ]

    def render_row(row: list[str]) -> str:
        cells = []

        for index, cell in enumerate(row):
            if index in right_aligned_columns:
                cells.append(cell.rjust(widths[index]))
            else:
                cells.append(cell.ljust(widths[index]))

        return "  ".join(cells)

    print(render_row(headers))
    print(
        render_row(
            ["-" * width for width in widths]
        )
    )

    for row in rows:
        print(render_row(row))


def analyze_project(
    root: Path,
    ignored_directories: set[str],
    ignored_files: set[str],
    top_count: int,
    check_duplicates: bool,
) -> None:
    started_at = datetime.now()

    files: list[FileRecord] = []
    extension_counts: Counter[str] = Counter()
    extension_sizes: Counter[str] = Counter()
    language_files: Counter[str] = Counter()
    language_lines: defaultdict[str, LineStats] = defaultdict(LineStats)
    total_line_stats = LineStats()
    total_markers: Counter[str] = Counter()

    folder_count = 0
    deepest_directory = root
    deepest_depth = 0

    for current_directory, directory_names, _ in os.walk(root):
        current_path = Path(current_directory)

        directory_names[:] = [
            name
            for name in directory_names
            if name not in ignored_directories
        ]

        if current_path != root:
            folder_count += 1

        relative_directory = current_path.relative_to(root)
        depth = len(relative_directory.parts)

        if depth > deepest_depth:
            deepest_depth = depth
            deepest_directory = relative_directory

    for path in iter_project_files(
        root,
        ignored_directories,
        ignored_files,
    ):
        try:
            stat = path.stat()
        except OSError:
            continue

        extension = path.suffix.lower() or "[no extension]"
        language_info = LANGUAGES.get(path.suffix.lower())
        language = language_info[0] if language_info else None
        line_stats = None
        markers: Counter[str] = Counter()

        extension_counts[extension] += 1
        extension_sizes[extension] += stat.st_size

        should_analyze_as_text = (
            language_info is not None
            or path.suffix.lower() in TEXT_DATA_EXTENSIONS
        )

        if should_analyze_as_text and not looks_binary(path):
            comment_prefixes = (
                language_info[1]
                if language_info
                else tuple()
            )

            line_stats, markers = analyze_text_file(
                path,
                comment_prefixes,
            )

            total_line_stats.add(line_stats)
            total_markers.update(markers)

            if language:
                language_files[language] += 1
                language_lines[language].add(line_stats)

        files.append(
            FileRecord(
                path=path,
                relative_path=path.relative_to(root),
                size=stat.st_size,
                modified=stat.st_mtime,
                extension=extension,
                language=language,
                lines=line_stats,
                markers=markers,
            )
        )

    total_size = sum(record.size for record in files)
    source_files = [
        record
        for record in files
        if record.language is not None
    ]

    print_heading("PROJECT OVERVIEW")

    overview_rows = [
        ["Project directory", str(root)],
        ["Files", f"{len(files):,}"],
        ["Directories", f"{folder_count:,}"],
        ["Total size", format_size(total_size)],
        ["Source files", f"{len(source_files):,}"],
        ["Detected languages", f"{len(language_files):,}"],
        ["Text lines analyzed", f"{total_line_stats.total:,}"],
        ["Lines of code", f"{total_line_stats.code:,}"],
        ["Blank lines", f"{total_line_stats.blank:,}"],
        ["Comment lines", f"{total_line_stats.comments:,}"],
        ["Deepest directory", str(deepest_directory)],
        ["Maximum directory depth", str(deepest_depth)],
    ]

    print_table(["Statistic", "Value"], overview_rows)

    print_heading("CODE COMPOSITION")

    composition_rows = [
        [
            "Code",
            f"{total_line_stats.code:,}",
            f"{percentage(total_line_stats.code, total_line_stats.total):.1f}%",
        ],
        [
            "Comments",
            f"{total_line_stats.comments:,}",
            f"{percentage(total_line_stats.comments, total_line_stats.total):.1f}%",
        ],
        [
            "Blank",
            f"{total_line_stats.blank:,}",
            f"{percentage(total_line_stats.blank, total_line_stats.total):.1f}%",
        ],
    ]

    print_table(
        ["Type", "Lines", "Percent"],
        composition_rows,
        {1, 2},
    )

    print_heading("LANGUAGES")

    language_rows = []

    sorted_languages = sorted(
        language_files,
        key=lambda name: language_lines[name].code,
        reverse=True,
    )

    for language in sorted_languages:
        stats = language_lines[language]

        language_rows.append(
            [
                language,
                f"{language_files[language]:,}",
                f"{stats.total:,}",
                f"{stats.code:,}",
                f"{stats.comments:,}",
                f"{stats.blank:,}",
                f"{percentage(stats.code, total_line_stats.code):.1f}%",
            ]
        )

    print_table(
        [
            "Language",
            "Files",
            "Total",
            "Code",
            "Comments",
            "Blank",
            "Code Share",
        ],
        language_rows,
        {1, 2, 3, 4, 5, 6},
    )

    print_heading("FILE EXTENSIONS")

    extension_rows = []

    for extension, count in extension_counts.most_common():
        extension_rows.append(
            [
                extension,
                f"{count:,}",
                format_size(extension_sizes[extension]),
                f"{percentage(count, len(files)):.1f}%",
            ]
        )

    print_table(
        ["Extension", "Files", "Total Size", "File Share"],
        extension_rows,
        {1, 2, 3},
    )

    print_heading(f"LARGEST {min(top_count, len(files))} FILES")

    largest_rows = [
        [
            str(record.relative_path),
            format_size(record.size),
        ]
        for record in sorted(
            files,
            key=lambda record: record.size,
            reverse=True,
        )[:top_count]
    ]

    print_table(
        ["File", "Size"],
        largest_rows,
        {1},
    )

    source_files_with_lines = [
        record
        for record in source_files
        if record.lines is not None
    ]

    print_heading(
        f"LONGEST {min(top_count, len(source_files_with_lines))} SOURCE FILES"
    )

    longest_rows = [
        [
            str(record.relative_path),
            record.language or "Unknown",
            f"{record.lines.total:,}",
            f"{record.lines.code:,}",
        ]
        for record in sorted(
            source_files_with_lines,
            key=lambda record: record.lines.total,
            reverse=True,
        )[:top_count]
    ]

    print_table(
        ["File", "Language", "Total Lines", "Code Lines"],
        longest_rows,
        {2, 3},
    )

    print_heading("CODE MARKERS")

    marker_rows = [
        [marker, f"{count:,}"]
        for marker, count in total_markers.most_common()
    ]

    print_table(
        ["Marker", "Occurrences"],
        marker_rows,
        {1},
    )

    print_heading(f"MOST RECENTLY MODIFIED {min(top_count, len(files))} FILES")

    recent_rows = [
        [
            str(record.relative_path),
            datetime.fromtimestamp(record.modified).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        ]
        for record in sorted(
            files,
            key=lambda record: record.modified,
            reverse=True,
        )[:top_count]
    ]

    print_table(["File", "Modified"], recent_rows)

    if check_duplicates:
        print_heading("DUPLICATE FILES")

        files_by_size: defaultdict[int, list[FileRecord]] = defaultdict(list)

        for record in files:
            if record.size > 0:
                files_by_size[record.size].append(record)

        hashes: defaultdict[str, list[FileRecord]] = defaultdict(list)

        for same_size_files in files_by_size.values():
            if len(same_size_files) < 2:
                continue

            for record in same_size_files:
                file_hash = calculate_hash(record.path)

                if file_hash:
                    hashes[file_hash].append(record)

        duplicate_groups = [
            group
            for group in hashes.values()
            if len(group) > 1
        ]

        duplicate_groups.sort(
            key=lambda group: group[0].size * (len(group) - 1),
            reverse=True,
        )

        if not duplicate_groups:
            print("No duplicate files found.")
        else:
            duplicate_waste = 0

            for group_number, group in enumerate(duplicate_groups, start=1):
                duplicate_waste += group[0].size * (len(group) - 1)

                print()
                print(
                    f"Group {group_number}: "
                    f"{len(group)} copies, "
                    f"{format_size(group[0].size)} each"
                )

                for record in group:
                    print(f"  {record.relative_path}")

            print()
            print(
                f"Potential duplicate storage: "
                f"{format_size(duplicate_waste)}"
            )

    elapsed = datetime.now() - started_at

    print_heading("SCAN COMPLETE")
    print(f"Finished in {elapsed.total_seconds():.2f} seconds.")


def parse_arguments() -> argparse.Namespace:
    script_directory = Path(__file__).resolve().parent
    default_project_directory = script_directory.parent

    parser = argparse.ArgumentParser(
        description="Analyze a software project and print detailed statistics."
    )

    parser.add_argument(
        "directory",
        nargs="?",
        type=Path,
        default=default_project_directory,
        help=(
            "Project directory to scan. Defaults to the parent directory "
            "of this script."
        ),
    )

    parser.add_argument(
        "--top",
        type=int,
        default=10,
        help="Number of largest, longest, and newest files to show.",
    )

    parser.add_argument(
        "--duplicates",
        action="store_true",
        help="Hash files and search for exact duplicates.",
    )

    parser.add_argument(
        "--include-dependencies",
        action="store_true",
        help="Include node_modules, build, dist, virtual environments, etc.",
    )

    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    root = arguments.directory.resolve()

    if not root.exists():
        raise SystemExit(f"Directory does not exist: {root}")

    if not root.is_dir():
        raise SystemExit(f"Path is not a directory: {root}")

    ignored_directories = set()

    if not arguments.include_dependencies:
        ignored_directories.update(DEFAULT_IGNORED_DIRECTORIES)

    analyze_project(
        root=root,
        ignored_directories=ignored_directories,
        ignored_files=DEFAULT_IGNORED_FILES,
        top_count=max(1, arguments.top),
        check_duplicates=arguments.duplicates,
    )


if __name__ == "__main__":
    main()