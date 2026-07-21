from __future__ import annotations
import argparse
import csv
import html
import json
import re
import shutil
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


CSV_PATH = Path("data/FlatItemsList.csv")
JSON_PATH = Path("data/BronzemanItems.json")

WIKI_API_URL = "https://oldschool.runescape.wiki/api.php"
WIKI_ITEM_IDS_URL = "https://oldschool.runescape.wiki/w/Item_IDs"
WIKI_USER_AGENT = "BronzemanItemBuilder/2.0 (personal project)"

TAG_DEFINITIONS = [
    "melee",
    "range",
    "mage",
    "weapon",
    "armor",
    "spec",
    "jewellery",
    "rune",
    "food",
    "potion",
    "teleport",
    "ammo",
    "consumable",
    "other",
]

BEHAVIOR_DEFINITIONS = [
    "hidden",
    "talent",
    "shop",
    "unlock",
    "resupply",
]

ITEM_FIELD_ORDER = [
    "name",
    "alias",
    "uid",
    "itemId",
    "set",
    "tags",
    "behaviors",
    "tier",
    "cost",
    "alwaysAvailable",
    "unlocked",
    "wikiLink",
    "imageName",
]

CSV_FIELDS = [
    "name",
    "alias",
    "uid",
    "itemId",
    "set",
    "tags",
    "behaviors",
]

CLEAR_VALUES = {"[]", "none", "null"}


def normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    text = text.replace("_", " ")
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", text.strip().lower())


def slugify(value: str) -> str:
    text = normalize(value).replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "item"


def wiki_link(name: str) -> str:
    page = name.replace(" ", "_")
    return f"https://oldschool.runescape.wiki/w/{quote(page, safe='_/()')}"


def request_text(url: str, timeout: int = 30) -> str:
    request = Request(url, headers={"User-Agent": WIKI_USER_AGENT})

    try:
        with urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8")
    except HTTPError as error:
        raise RuntimeError(f"Wiki request failed with HTTP {error.code}: {url}") from error
    except URLError as error:
        raise RuntimeError(f"Wiki network request failed: {error.reason}") from error
    except TimeoutError as error:
        raise RuntimeError(f"Wiki request timed out: {url}") from error


class ItemIdTableParser(HTMLParser):
    """Extract the two visible columns from the Wiki's Item IDs table."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_row = False
        self.in_cell = False
        self.cell_depth = 0
        self.current_cell: list[str] = []
        self.current_row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self.in_row = True
            self.current_row = []
        elif self.in_row and tag in {"td", "th"}:
            self.in_cell = True
            self.cell_depth = 1
            self.current_cell = []
        elif self.in_cell:
            self.cell_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self.in_cell:
            self.cell_depth -= 1
            if self.cell_depth == 0:
                value = html.unescape("".join(self.current_cell))
                value = re.sub(r"\s+", " ", value).strip()
                self.current_row.append(value)
                self.in_cell = False
                self.current_cell = []
                return

        if tag == "tr" and self.in_row:
            if self.current_row:
                self.rows.append(self.current_row)
            self.in_row = False
            self.current_row = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.current_cell.append(data)


def parse_numeric_ids(value: str) -> list[int]:
    """
    Keep normal numeric item IDs.

    Wiki-only labels such as interface8036, hist6205, or beta30931 are not
    normal inventory item IDs and are intentionally ignored.
    """
    ids: list[int] = []

    for token in re.findall(r"(?<![A-Za-z])\b\d+\b", value):
        number = int(token)
        if number not in ids:
            ids.append(number)

    return ids


def download_item_id_index() -> dict[str, list[int]]:
    parser = ItemIdTableParser()
    parser.feed(request_text(WIKI_ITEM_IDS_URL, timeout=60))

    index: dict[str, list[int]] = {}

    for row in parser.rows:
        if len(row) < 2:
            continue

        name = row[0].strip()
        ids = parse_numeric_ids(row[1])

        if not name or normalize(name) == "item" or not ids:
            continue

        key = normalize(name)
        destination = index.setdefault(key, [])

        for item_id in ids:
            if item_id not in destination:
                destination.append(item_id)

    if not index:
        raise RuntimeError("No item IDs could be parsed from the OSRS Wiki Item IDs page.")

    return index


def resolve_wiki_title(name: str) -> str | None:
    query = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "redirects": "1",
            "titles": name,
        }
    )

    try:
        result = json.loads(request_text(f"{WIKI_API_URL}?{query}", timeout=20))
    except (RuntimeError, json.JSONDecodeError):
        return None

    pages = result.get("query", {}).get("pages", [])

    if not pages or not isinstance(pages[0], dict) or pages[0].get("missing") is True:
        return None

    title = str(pages[0].get("title") or "").strip()
    return title or None


def parse_optional_list(
    raw_value: Any,
    allowed_values: list[str],
    field_name: str,
    row_number: int,
    warnings: list[str],
) -> tuple[list[str], bool]:
    """
    Blank means preserve an existing value.
    [], none, or null explicitly clears the list.
    """
    value = str(raw_value or "").strip()

    if not value:
        return [], False

    if normalize(value) in CLEAR_VALUES:
        return [], True

    allowed = {normalize(entry): entry for entry in allowed_values}
    parsed: list[str] = []

    for part in re.split(r"[,;|]", value):
        key = normalize(part)

        if not key:
            continue

        canonical = allowed.get(key)

        if canonical is None:
            warnings.append(
                f'Row {row_number}: unknown {field_name} value "{part.strip()}" ignored.'
            )
            continue

        if canonical not in parsed:
            parsed.append(canonical)

    return parsed, True


def parse_optional_text(raw_value: Any) -> tuple[str | None, bool]:
    """
    Blank means preserve an existing value.
    none or null explicitly writes JSON null.
    """
    value = str(raw_value or "").strip()

    if not value:
        return None, False

    if normalize(value) in {"none", "null"}:
        return None, True

    return value, True


def parse_optional_item_id(
    raw_value: Any,
    row_number: int,
    warnings: list[str],
) -> tuple[int | None, bool]:
    """
    Blank or 0 means use Wiki lookup, not an explicit update.
    null or none explicitly writes JSON null.
    A positive integer is a manual override.
    """
    value = str(raw_value or "").strip()

    if not value or value == "0":
        return None, False

    if normalize(value) in {"none", "null"}:
        return None, True

    try:
        item_id = int(value)
    except ValueError:
        warnings.append(f'Row {row_number}: invalid itemId "{value}"; row skipped.')
        raise

    if item_id <= 0:
        warnings.append(f"Row {row_number}: itemId must be positive; row skipped.")
        raise ValueError("itemId must be positive")

    return item_id, True


def load_csv(path: Path, warnings: list[str]) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find CSV file: {path}")

    rows: list[dict[str, Any]] = []
    seen_uids: set[str] = set()

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV is empty or has no header row.")

        header_lookup = {
            normalize(header): header
            for header in reader.fieldnames
            if header is not None
        }

        missing = [field for field in CSV_FIELDS if normalize(field) not in header_lookup]

        if missing:
            raise ValueError("CSV is missing required headers: " + ", ".join(missing))

        for row_number, source_row in enumerate(reader, start=2):
            raw = {
                field: source_row.get(header_lookup[normalize(field)], "")
                for field in CSV_FIELDS
            }

            if not any(str(value or "").strip() for value in raw.values()):
                continue

            name = str(raw["name"] or "").strip()

            if not name:
                warnings.append(f"Row {row_number}: missing name; row skipped.")
                continue

            alias, alias_specified = parse_optional_text(raw["alias"])
            uid, uid_specified = parse_optional_text(raw["uid"])
            set_name, set_specified = parse_optional_text(raw["set"])

            try:
                manual_id, item_id_specified = parse_optional_item_id(
                    raw["itemId"], row_number, warnings
                )
            except ValueError:
                continue

            tags, tags_specified = parse_optional_list(
                raw["tags"], TAG_DEFINITIONS, "tag", row_number, warnings
            )
            behaviors, behaviors_specified = parse_optional_list(
                raw["behaviors"],
                BEHAVIOR_DEFINITIONS,
                "behavior",
                row_number,
                warnings,
            )

            match_uid = uid or slugify(name)

            if match_uid in seen_uids:
                warnings.append(
                    f'Row {row_number}: duplicate CSV uid "{match_uid}"; row skipped.'
                )
                continue

            seen_uids.add(match_uid)

            rows.append(
                {
                    "row": row_number,
                    "name": name,
                    "alias": alias,
                    "alias_specified": alias_specified,
                    "uid": uid,
                    "uid_specified": uid_specified,
                    "match_uid": match_uid,
                    "itemId": manual_id,
                    "itemId_specified": item_id_specified,
                    "set": set_name,
                    "set_specified": set_specified,
                    "tags": tags,
                    "tags_specified": tags_specified,
                    "behaviors": behaviors,
                    "behaviors_specified": behaviors_specified,
                }
            )

    return rows


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "items": [],
            "tagDefinitions": list(TAG_DEFINITIONS),
            "behaviorDefinitions": list(BEHAVIOR_DEFINITIONS),
        }

    data = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(data, dict):
        raise ValueError("BronzemanItems.json must contain a top-level object.")

    if "items" not in data:
        data["items"] = []

    if not isinstance(data["items"], list):
        raise ValueError('Top-level "items" must be an array.')

    return data


def build_existing_indexes(
    items: list[Any],
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], dict[int, dict[str, Any]]]:
    by_uid: dict[str, dict[str, Any]] = {}
    by_name: dict[str, dict[str, Any]] = {}
    by_id: dict[int, dict[str, Any]] = {}

    for item in items:
        if not isinstance(item, dict):
            continue

        uid = str(item.get("uid") or "").strip()
        name = str(item.get("name") or "").strip()

        if uid:
            by_uid.setdefault(uid, item)

        if name:
            by_name.setdefault(normalize(name), item)

        try:
            item_id = int(item.get("itemId"))
        except (TypeError, ValueError):
            continue

        by_id.setdefault(item_id, item)

    return by_uid, by_name, by_id


def resolve_item_id(
    row: dict[str, Any],
    existing: dict[str, Any] | None,
    wiki_ids: dict[str, list[int]],
    unresolved: list[str],
) -> int | None:
    if row["itemId_specified"]:
        return row["itemId"]

    existing_id = None

    if existing is not None:
        try:
            existing_id = int(existing.get("itemId"))
        except (TypeError, ValueError):
            existing_id = None

        if existing_id is not None:
            return existing_id

    matches = wiki_ids.get(normalize(row["name"]), [])

    if len(matches) == 1:
        return matches[0]

    if len(matches) > 1:
        unresolved.append(
            f'{row["name"]}: ambiguous Wiki IDs {", ".join(map(str, matches))}'
        )
    else:
        unresolved.append(f'{row["name"]}: no exact match on Wiki Item IDs page')

    return None


def create_new_item(
    row: dict[str, Any],
    official_name: str,
    item_id: int | None,
) -> dict[str, Any]:
    alias = row["alias"] if row["alias_specified"] else official_name
    uid = row["uid"] if row["uid_specified"] else slugify(official_name)

    return {
        "name": official_name,
        "alias": alias,
        "uid": uid,
        "itemId": item_id,
        "set": row["set"] if row["set_specified"] else None,
        "tags": list(row["tags"]) if row["tags_specified"] else [],
        "behaviors": (
            list(row["behaviors"])
            if row["behaviors_specified"]
            else []
        ),
        "tier": None,
        "cost": None,
        "alwaysAvailable": False,
        "unlocked": False,
        "wikiLink": wiki_link(official_name),
        "imageName": f"{official_name}.png",
    }


def apply_csv_fields(
    item: dict[str, Any],
    row: dict[str, Any],
    resolved_id: int | None,
    official_name: str,
) -> list[str]:
    changes: list[str] = []

    def update(field: str, value: Any) -> None:
        if item.get(field) != value:
            item[field] = value
            changes.append(field)

    # Name is always CSV-managed.
    update("name", official_name)

    if row["alias_specified"]:
        update("alias", row["alias"])

    if row["uid_specified"]:
        update("uid", row["uid"])

    # A resolved Wiki ID fills a missing ID, while a manual CSV ID may replace one.
    if row["itemId_specified"] or item.get("itemId") is None:
        update("itemId", resolved_id)

    if row["set_specified"]:
        update("set", row["set"])

    if row["tags_specified"]:
        update("tags", list(row["tags"]))

    if row["behaviors_specified"]:
        update("behaviors", list(row["behaviors"]))

    # Only repair generated fields when absent. Existing manual values are preserved.
    if not item.get("alias"):
        update("alias", official_name)

    if not item.get("uid"):
        update("uid", slugify(official_name))

    if not item.get("wikiLink"):
        update("wikiLink", wiki_link(official_name))

    if not item.get("imageName"):
        update("imageName", f"{official_name}.png")

    defaults = {
        "set": None,
        "tags": [],
        "behaviors": [],
        "tier": None,
        "cost": None,
        "alwaysAvailable": False,
        "unlocked": False,
    }

    for field, default in defaults.items():
        if field not in item:
            item[field] = default
            changes.append(field)

    return changes


def reorder_item_fields(item: dict[str, Any]) -> dict[str, Any]:
    reordered: dict[str, Any] = {}

    for field in ITEM_FIELD_ORDER:
        if field in item:
            reordered[field] = item[field]

    # Preserve all unrecognized/manual fields after the standard fields.
    for field, value in item.items():
        if field not in reordered:
            reordered[field] = value

    return reordered


def sort_items(items: list[Any]) -> list[Any]:
    indexed = list(enumerate(items))

    def key(pair: tuple[int, Any]) -> tuple[int, int, int]:
        original_index, item = pair

        if not isinstance(item, dict):
            return 1, 0, original_index

        value = item.get("itemId")

        if value is None or isinstance(value, bool):
            return 1, 0, original_index

        try:
            return 0, int(value), original_index
        except (TypeError, ValueError):
            return 1, 0, original_index

    indexed.sort(key=key)
    return [item for _, item in indexed]


def rebuild_root(data: dict[str, Any], items: list[Any]) -> dict[str, Any]:
    """
    Preserve unrelated top-level data while guaranteeing that the two
    definition arrays are at the end of the file.
    """
    output: dict[str, Any] = {}

    for key, value in data.items():
        if key in {"items", "tagDefinitions", "behaviorDefinitions"}:
            continue
        output[key] = value

    output["items"] = items
    output["tagDefinitions"] = list(TAG_DEFINITIONS)
    output["behaviorDefinitions"] = list(BEHAVIOR_DEFINITIONS)
    return output


def write_json(path: Path, data: dict[str, Any], make_backup: bool) -> Path | None:
    path.parent.mkdir(parents=True, exist_ok=True)
    backup_path: Path | None = None

    if make_backup and path.exists():
        backup_path = path.with_suffix(path.suffix + ".bak")
        shutil.copy2(path, backup_path)

    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    temp_path.replace(path)
    return backup_path


def run(csv_path: Path, json_path: Path, output_path: Path, make_backup: bool) -> None:
    warnings: list[str] = []
    unresolved: list[str] = []

    rows = load_csv(csv_path, warnings)
    data = load_json(json_path)
    wiki_ids = download_item_id_index()

    items = data["items"]
    by_uid, by_name, by_id = build_existing_indexes(items)

    added = 0
    updated = 0
    unchanged = 0
    skipped = 0
    fields_changed = 0

    for row in rows:
        existing = by_uid.get(row["match_uid"])

        if existing is None:
            existing = by_name.get(normalize(row["name"]))

        if existing is None and row["itemId_specified"] and row["itemId"] is not None:
            existing = by_id.get(row["itemId"])

        official_name = resolve_wiki_title(row["name"]) or row["name"]
        resolved_id = resolve_item_id(row, existing, wiki_ids, unresolved)

        if resolved_id is not None:
            owner = by_id.get(resolved_id)
            if owner is not None and owner is not existing:
                warnings.append(
                    f'Row {row["row"]}: itemId {resolved_id} already belongs to '
                    f'"{owner.get("name", "<unnamed>")}"; row skipped.'
                )
                skipped += 1
                continue

        if existing is None:
            item = create_new_item(row, official_name, resolved_id)

            uid = str(item["uid"])
            if uid in by_uid:
                warnings.append(
                    f'Row {row["row"]}: generated uid "{uid}" already exists; row skipped.'
                )
                skipped += 1
                continue

            items.append(item)
            by_uid[uid] = item
            by_name[normalize(item["name"])] = item
            if resolved_id is not None:
                by_id[resolved_id] = item
            added += 1
            continue

        old_id = existing.get("itemId")
        old_uid = str(existing.get("uid") or "")
        old_name_key = normalize(existing.get("name"))

        changes = apply_csv_fields(existing, row, resolved_id, official_name)

        new_uid = str(existing.get("uid") or "")
        new_name_key = normalize(existing.get("name"))

        if old_uid and old_uid != new_uid and by_uid.get(old_uid) is existing:
            del by_uid[old_uid]
        if new_uid:
            by_uid[new_uid] = existing

        if old_name_key and old_name_key != new_name_key and by_name.get(old_name_key) is existing:
            del by_name[old_name_key]
        if new_name_key:
            by_name[new_name_key] = existing

        try:
            old_id_int = int(old_id)
        except (TypeError, ValueError):
            old_id_int = None

        try:
            new_id_int = int(existing.get("itemId"))
        except (TypeError, ValueError):
            new_id_int = None

        if old_id_int is not None and old_id_int != new_id_int and by_id.get(old_id_int) is existing:
            del by_id[old_id_int]
        if new_id_int is not None:
            by_id[new_id_int] = existing

        if changes:
            updated += 1
            fields_changed += len(changes)
        else:
            unchanged += 1

    cleaned_items = [
        reorder_item_fields(item)
        if isinstance(item, dict)
        else item
        for item in items
    ]
    cleaned_items = sort_items(cleaned_items)

    output_data = rebuild_root(data, cleaned_items)
    backup_path = write_json(output_path, output_data, make_backup)

    print(f"CSV rows processed: {len(rows)}")
    print(f"Items added: {added}")
    print(f"Items updated: {updated}")
    print(f"Items unchanged: {unchanged}")
    print(f"Rows skipped: {skipped}")
    print(f"Fields changed on existing items: {fields_changed}")
    print(f"Total items written: {len(cleaned_items)}")
    print(f"Wiki item names indexed: {len(wiki_ids)}")
    print(f"Unresolved item IDs: {len(unresolved)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Output: {output_path.resolve()}")

    if backup_path is not None:
        print(f"Backup: {backup_path.resolve()}")

    if unresolved:
        print("\nUnresolved item IDs:")
        for message in unresolved:
            print(f"  - {message}")

    if warnings:
        print("\nWarnings:")
        for message in warnings:
            print(f"  - {message}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Add or selectively update Bronzeman items from the CSV while "
            "preserving existing JSON data and resolving item IDs from the OSRS Wiki."
        )
    )

    parser.add_argument("--csv", type=Path, default=CSV_PATH)
    parser.add_argument("--json", type=Path, default=JSON_PATH)
    parser.add_argument(
        "--out",
        type=Path,
        help="Optional output file. Defaults to updating --json in place.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create BronzemanItems.json.bak when updating an existing file.",
    )

    args = parser.parse_args()

    try:
        run(
            csv_path=args.csv,
            json_path=args.json,
            output_path=args.out or args.json,
            make_backup=not args.no_backup,
        )
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
