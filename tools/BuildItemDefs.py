import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote


DEFAULT_NAMES_PATH = Path("tools/BronzemanItems.txt")
DEFAULT_WIKI_ONLY_PATH = Path("tools/WikiOnlyItems.txt")
DEFAULT_OSRS_DUMP_PATH = Path("tools/OSRSItems.json")
DEFAULT_BRONZEMAN_JSON_PATH = Path("BronzemanItemDefs.json")

DEFAULT_TAG_DEFINITIONS = [
    "spec wep",
    "range wep",
    "range arm",
    "melee wep",
    "melee arm",
    "mage wep",
    "mage arm",
    "generic gear",
    "talent",
    "shop",
    "consumables",
    "potions",
    "runes",
    "other",
]


def normalize_basic(name: str) -> str:
    """
    Conservative normalization.
    Good for whitespace/case/underscore/quote differences.
    """
    if not name:
        return ""

    name = unicodedata.normalize("NFKC", str(name))
    name = name.replace("_", " ")
    name = name.replace("’", "'").replace("‘", "'")
    name = name.replace("“", '"').replace("”", '"')
    name = name.strip().lower()
    name = re.sub(r"\s+", " ", name)

    return name


def normalize_aggressive(name: str) -> str:
    """
    More forgiving fallback normalization.
    This ignores most punctuation and spacing differences.

    Example:
      Dragon dagger (p++) -> dragondaggerp
      Dragon-dagger p++   -> dragondaggerp
    """
    name = normalize_basic(name)
    name = re.sub(r"[^a-z0-9]+", "", name)
    return name


def slugify_id(name: str) -> str:
    """
    Stable app-facing ID. This is separate from official OSRS itemId.

    Example:
      Sunlight hunter's crossbow -> sunlight-hunters-crossbow
      Dragon dagger(p++)         -> dragon-dagger-p
    """
    name = normalize_basic(name)
    name = name.replace("'", "")
    slug = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return slug or "item"


def make_unique_slug(base_slug: str, used_ids: set[str]) -> str:
    slug = base_slug
    counter = 2

    while slug in used_ids:
        slug = f"{base_slug}-{counter}"
        counter += 1

    used_ids.add(slug)
    return slug


def wiki_page_url(item_name: str) -> str:
    page_name = item_name.replace(" ", "_")
    return f"https://oldschool.runescape.wiki/w/{quote(page_name, safe='_/()')}"


def icon_url(image_name: str) -> str:
    return f"https://oldschool.runescape.wiki/w/Special:FilePath/{quote(image_name)}"


def make_item_entry(
    item_name: str,
    item_id: int | None,
    used_ids: set[str],
    source: str,
    status: str,
) -> dict:
    image_name = f"{item_name}.png"

    return {
        "id": make_unique_slug(slugify_id(item_name), used_ids),
        "name": item_name,
        "itemId": item_id,
        "alias": item_name,
        "wikiLink": wiki_page_url(item_name),
        "iconLink": icon_url(image_name),
        "imageName": image_name,
        "imagePath": f"images/items/{image_name}",
        "tags": [],
        "alwaysAvailable": False,
        "unlocked": False,
        "source": source,
        "status": status,
    }


def load_names(path: Path, *, required: bool = True) -> list[str]:
    path = Path(path)

    if not path.exists():
        if required:
            raise FileNotFoundError(f"Could not find names file: {path}")
        return []

    names = []

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line:
            continue

        if line.startswith("#"):
            continue

        # Allows accidental list formatting like:
        # - Rune crossbow
        # "Rune crossbow",
        line = re.sub(r"^[-*]\s+", "", line)
        line = line.strip().strip(",").strip()
        line = line.strip('"').strip("'").strip()

        if line:
            names.append(line)

    return names


def load_or_create_bronzeman_json(path: Path) -> dict:
    path = Path(path)

    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    return {
        "schemaVersion": 2,
        "items": [],
        "otherImages": [],
        "tagDefinitions": DEFAULT_TAG_DEFINITIONS,
    }


def load_osrs_dump(path: Path) -> list[dict]:
    path = Path(path)
    raw = json.loads(path.read_text(encoding="utf-8"))

    if isinstance(raw, dict):
        items = list(raw.values())
    elif isinstance(raw, list):
        items = raw
    else:
        raise ValueError("OSRS dump must be either a JSON object or array.")

    cleaned = []

    for item in items:
        if not isinstance(item, dict):
            continue

        if "id" not in item or "name" not in item:
            continue

        try:
            item_id = int(item["id"])
        except (TypeError, ValueError):
            continue

        item_name = str(item["name"]).strip()

        if not item_name:
            continue

        cleaned.append({
            "id": item_id,
            "name": item_name,
        })

    return cleaned


def build_lookup(osrs_items: list[dict]) -> tuple[dict, dict]:
    """
    Returns:
      basic_lookup: normalized name -> list[item]
      aggressive_lookup: aggressively normalized name -> list[item]
    """
    basic_lookup = {}
    aggressive_lookup = {}

    for item in osrs_items:
        basic_key = normalize_basic(item["name"])
        aggressive_key = normalize_aggressive(item["name"])

        basic_lookup.setdefault(basic_key, []).append(item)
        aggressive_lookup.setdefault(aggressive_key, []).append(item)

    return basic_lookup, aggressive_lookup


def build_wiki_only_lookup(wiki_only_names: list[str]) -> tuple[dict, dict]:
    basic_lookup = {}
    aggressive_lookup = {}

    for name in wiki_only_names:
        basic_lookup[normalize_basic(name)] = name
        aggressive_lookup[normalize_aggressive(name)] = name

    return basic_lookup, aggressive_lookup


def pick_best_match(matches: list[dict]) -> tuple[dict | None, str | None]:
    """
    With only id/name available, duplicate names cannot be perfectly resolved.
    This chooses the lowest item ID and warns when there were multiple.
    """
    if not matches:
        return None, None

    matches = sorted(matches, key=lambda x: x["id"])
    chosen = matches[0]

    warning = None
    if len(matches) > 1:
        duplicate_list = ", ".join(f'{m["name"]} ({m["id"]})' for m in matches[:10])
        warning = f"Multiple OSRS items had this same normalized name. Chose lowest ID: {duplicate_list}"

    return chosen, warning


def find_suggestions(name: str, osrs_items: list[dict], limit: int = 5) -> list[str]:
    """
    Uses difflib only for reporting suggestions.
    It does not auto-add fuzzy matches.
    """
    from difflib import get_close_matches

    wanted = normalize_basic(name)
    normalized_to_original = {}

    for item in osrs_items:
        normalized_to_original[normalize_basic(item["name"])] = item["name"]

    close_keys = get_close_matches(
        wanted,
        list(normalized_to_original.keys()),
        n=limit,
        cutoff=0.72,
    )

    return [normalized_to_original[key] for key in close_keys]


def find_dump_match(
    wanted_name: str,
    basic_lookup: dict,
    aggressive_lookup: dict,
) -> tuple[dict | None, str | None, str | None]:
    basic_key = normalize_basic(wanted_name)
    aggressive_key = normalize_aggressive(wanted_name)

    matches = basic_lookup.get(basic_key)
    match_type = "basic"

    if not matches:
        matches = aggressive_lookup.get(aggressive_key)
        match_type = "aggressive"

    if not matches:
        return None, None, None

    chosen, warning = pick_best_match(matches)
    return chosen, match_type, warning


def find_wiki_only_name(
    wanted_name: str,
    wiki_basic_lookup: dict,
    wiki_aggressive_lookup: dict,
) -> str | None:
    basic_key = normalize_basic(wanted_name)
    aggressive_key = normalize_aggressive(wanted_name)

    return wiki_basic_lookup.get(basic_key) or wiki_aggressive_lookup.get(aggressive_key)


def ensure_existing_item_shape(data: dict) -> set[str]:
    """
    Migrates existing items to the newer shape:
      id     = required app slug
      itemId = official OSRS item id, nullable

    Existing itemId values are preserved, including older fake IDs if you already had them.
    """
    used_ids: set[str] = set()

    for item in data.get("items", []):
        if not isinstance(item, dict):
            continue

        if "itemId" not in item:
            item["itemId"] = None

        current_id = item.get("id")

        if current_id:
            candidate = str(current_id)
            if candidate in used_ids:
                candidate = make_unique_slug(candidate, used_ids)
            else:
                used_ids.add(candidate)
            item["id"] = candidate
        else:
            item["id"] = make_unique_slug(slugify_id(item.get("name", "item")), used_ids)

        item.setdefault("alias", item.get("name", ""))
        item.setdefault("tags", [])
        item.setdefault("alwaysAvailable", False)
        item.setdefault("unlocked", False)

    return used_ids


def get_existing_keys(data: dict) -> tuple[set[str], set[int], set[str]]:
    existing_app_ids = set()
    existing_item_ids = set()
    existing_names = set()

    for item in data.get("items", []):
        if not isinstance(item, dict):
            continue

        app_id = item.get("id")
        if app_id:
            existing_app_ids.add(str(app_id))

        item_id = item.get("itemId")
        if item_id is not None:
            try:
                existing_item_ids.add(int(item_id))
            except (TypeError, ValueError):
                pass

        existing_names.add(normalize_basic(item.get("name", "")))

    return existing_app_ids, existing_item_ids, existing_names


def add_or_skip_item(
    *,
    data: dict,
    used_ids: set[str],
    existing_item_ids: set[int],
    existing_names: set[str],
    input_name: str,
    official_name: str,
    item_id: int | None,
    source: str,
    status: str,
    match_type: str,
    added: list[dict],
    skipped_existing: list[dict],
) -> None:
    official_name_key = normalize_basic(official_name)

    if item_id is not None and item_id in existing_item_ids:
        skipped_existing.append({
            "input": input_name,
            "matched": official_name,
            "itemId": item_id,
            "reason": "same itemId already exists",
        })
        return

    if official_name_key in existing_names:
        skipped_existing.append({
            "input": input_name,
            "matched": official_name,
            "itemId": item_id,
            "reason": "same normalized name already exists",
        })
        return

    data["items"].append(
        make_item_entry(
            item_name=official_name,
            item_id=item_id,
            used_ids=used_ids,
            source=source,
            status=status,
        )
    )

    if item_id is not None:
        existing_item_ids.add(item_id)

    existing_names.add(official_name_key)

    added.append({
        "input": input_name,
        "matched": official_name,
        "itemId": item_id,
        "matchType": match_type,
        "source": source,
        "status": status,
    })


def add_items(
    names_path: Path,
    wiki_only_path: Path,
    osrs_dump_path: Path,
    bronzeman_json_path: Path,
    output_path: Path,
) -> None:
    names_path = Path(names_path)
    wiki_only_path = Path(wiki_only_path)
    osrs_dump_path = Path(osrs_dump_path)
    bronzeman_json_path = Path(bronzeman_json_path)
    output_path = Path(output_path)

    wanted_names = load_names(names_path, required=True)
    wiki_only_names = load_names(wiki_only_path, required=False)
    osrs_items = load_osrs_dump(osrs_dump_path)
    data = load_or_create_bronzeman_json(bronzeman_json_path)

    data["schemaVersion"] = max(int(data.get("schemaVersion", 1)), 2)
    data.setdefault("items", [])
    data.setdefault("otherImages", [])
    data.setdefault("tagDefinitions", DEFAULT_TAG_DEFINITIONS)

    used_ids = ensure_existing_item_shape(data)
    _, existing_item_ids, existing_names = get_existing_keys(data)

    basic_lookup, aggressive_lookup = build_lookup(osrs_items)
    wiki_basic_lookup, wiki_aggressive_lookup = build_wiki_only_lookup(wiki_only_names)

    added = []
    skipped_existing = []
    dump_missing = []
    not_added = []
    warnings = []
    processed_wiki_only_keys = set()

    # First: process the main list.
    for wanted_name in wanted_names:
        chosen, match_type, warning = find_dump_match(
            wanted_name,
            basic_lookup,
            aggressive_lookup,
        )

        if warning:
            warnings.append({
                "input": wanted_name,
                "warning": warning,
            })

        if chosen:
            add_or_skip_item(
                data=data,
                used_ids=used_ids,
                existing_item_ids=existing_item_ids,
                existing_names=existing_names,
                input_name=wanted_name,
                official_name=chosen["name"],
                item_id=int(chosen["id"]),
                source="osrs-dump",
                status="matched",
                match_type=match_type or "dump",
                added=added,
                skipped_existing=skipped_existing,
            )
            continue

        # Not in the dump. If it is listed in WikiOnlyItems.txt, add it with itemId: null.
        wiki_name = find_wiki_only_name(
            wanted_name,
            wiki_basic_lookup,
            wiki_aggressive_lookup,
        )

        dump_missing.append({
            "input": wanted_name,
            "addedFromWikiOnly": bool(wiki_name),
        })

        if wiki_name:
            processed_wiki_only_keys.add(normalize_basic(wiki_name))
            processed_wiki_only_keys.add(normalize_aggressive(wiki_name))

            add_or_skip_item(
                data=data,
                used_ids=used_ids,
                existing_item_ids=existing_item_ids,
                existing_names=existing_names,
                input_name=wanted_name,
                official_name=wiki_name,
                item_id=None,
                source="manual-wiki",
                status="missing-item-id",
                match_type="wiki-only",
                added=added,
                skipped_existing=skipped_existing,
            )
        else:
            not_added.append({
                "input": wanted_name,
                "suggestions": find_suggestions(wanted_name, osrs_items),
            })

    # Second: process WikiOnlyItems.txt entries that were not already in the main list.
    for wiki_name in wiki_only_names:
        if (
            normalize_basic(wiki_name) in processed_wiki_only_keys
            or normalize_aggressive(wiki_name) in processed_wiki_only_keys
        ):
            continue

        chosen, match_type, warning = find_dump_match(
            wiki_name,
            basic_lookup,
            aggressive_lookup,
        )

        if warning:
            warnings.append({
                "input": wiki_name,
                "warning": warning,
            })

        if chosen:
            # If a WikiOnlyItems.txt item exists in the dump, use the real itemId instead.
            add_or_skip_item(
                data=data,
                used_ids=used_ids,
                existing_item_ids=existing_item_ids,
                existing_names=existing_names,
                input_name=wiki_name,
                official_name=chosen["name"],
                item_id=int(chosen["id"]),
                source="osrs-dump",
                status="matched",
                match_type=match_type or "dump",
                added=added,
                skipped_existing=skipped_existing,
            )
        else:
            dump_missing.append({
                "input": wiki_name,
                "addedFromWikiOnly": True,
            })

            add_or_skip_item(
                data=data,
                used_ids=used_ids,
                existing_item_ids=existing_item_ids,
                existing_names=existing_names,
                input_name=wiki_name,
                official_name=wiki_name,
                item_id=None,
                source="manual-wiki",
                status="missing-item-id",
                match_type="wiki-only",
                added=added,
                skipped_existing=skipped_existing,
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Saved: {output_path}")
    print(f"Added: {len(added)}")
    print(f"Skipped existing: {len(skipped_existing)}")
    print(f"Missing from OSRS dump: {len(dump_missing)}")
    print(f"Not added: {len(not_added)}")
    print(f"Warnings: {len(warnings)}")

    if added:
        print("\nAdded items:")
        for item in added:
            shown_id = item["itemId"] if item["itemId"] is not None else "null"
            print(
                f'  + {item["matched"]} ({shown_id}) '
                f'from "{item["input"]}" '
                f'[{item["matchType"]}, {item["source"]}]'
            )

    if skipped_existing:
        print("\nSkipped existing:")
        for item in skipped_existing:
            shown_id = item["itemId"] if item["itemId"] is not None else "null"
            print(
                f'  - {item["matched"]} ({shown_id}) '
                f'from "{item["input"]}" - {item["reason"]}'
            )

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f'  ! {warning["input"]}: {warning["warning"]}')

    # This is intentionally at the end, per your workflow.
    if dump_missing:
        print("\nItems missing from OSRS dump:")
        for item in dump_missing:
            suffix = " - added from WikiOnlyItems.txt" if item["addedFromWikiOnly"] else " - NOT ADDED"
            print(f'  ? {item["input"]}{suffix}')

    if not_added:
        print("\nNot added because they were missing from both the dump and WikiOnlyItems.txt:")
        for item in not_added:
            print(f'  ? {item["input"]}')
            if item["suggestions"]:
                print(f'    Suggestions: {", ".join(item["suggestions"])}')


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Add OSRS items from text lists into the Bronzeman JSON file."
    )

    parser.add_argument(
        "--names",
        type=Path,
        default=DEFAULT_NAMES_PATH,
        help=f"Text file containing one item name per line. Default: {DEFAULT_NAMES_PATH}",
    )

    parser.add_argument(
        "--wiki-only",
        type=Path,
        default=DEFAULT_WIKI_ONLY_PATH,
        help=f"Optional text file for wiki-only items missing from the OSRS dump. Default: {DEFAULT_WIKI_ONLY_PATH}",
    )

    parser.add_argument(
        "--osrs-dump",
        type=Path,
        default=DEFAULT_OSRS_DUMP_PATH,
        help=f"Full OSRS item dump JSON. Default: {DEFAULT_OSRS_DUMP_PATH}",
    )

    parser.add_argument(
        "--json",
        type=Path,
        default=DEFAULT_BRONZEMAN_JSON_PATH,
        help=f"Existing Bronzeman JSON file. If missing, a new one is created. Default: {DEFAULT_BRONZEMAN_JSON_PATH}",
    )

    parser.add_argument(
        "--out",
        type=Path,
        help="Output JSON path. If omitted, writes back to --json.",
    )

    args = parser.parse_args()
    output_path = args.out or args.json

    try:
        add_items(
            names_path=args.names,
            wiki_only_path=args.wiki_only,
            osrs_dump_path=args.osrs_dump,
            bronzeman_json_path=args.json,
            output_path=output_path,
        )
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
