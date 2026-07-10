from __future__ import annotations

import argparse
import csv
import json
import logging
import re
import sys
import unicodedata
from difflib import get_close_matches
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


CSV_PATH = Path("data/BronzemanItems.csv")
OSRS_DUMP_PATH = Path("data/OSRSItems.json")
JSON_PATH = Path("data/BronzemanItems.json")
LOG_PATH = Path("logs/BronzemanItemBuilder.log")

WIKI_API_URL = "https://oldschool.runescape.wiki/api.php"
WIKI_USER_AGENT = "BronzemanItemBuilder/1.0"

TAG_DEFINITIONS = [
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


def make_logger(path: Path) -> logging.Logger:
    path.parent.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("BronzemanItemBuilder")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    logger.handlers.clear()

    handler = logging.FileHandler(path, mode="a", encoding="utf-8")
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s")
    )
    logger.addHandler(handler)

    return logger


def normalize(name: str) -> str:
    """
    Normalize harmless formatting differences while preserving the
    meaningful contents of the item name.
    """
    if not name:
        return ""

    value = unicodedata.normalize("NFKC", str(name))
    value = value.replace("_", " ")
    value = value.replace("’", "'").replace("‘", "'")
    value = value.replace("“", '"').replace("”", '"')
    value = re.sub(r"\s+", " ", value.strip().lower())

    return value


def normalize_loose(name: str) -> str:
    """
    More forgiving fallback matching.

    This ignores punctuation and spacing differences.
    """
    return re.sub(r"[^a-z0-9]+", "", normalize(name))


def slugify(name: str) -> str:
    value = normalize(name).replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "item"


def unique_uid(name: str, used_uids: set[str]) -> str:
    base = slugify(name)
    uid = base
    number = 2

    while uid in used_uids:
        uid = f"{base}-{number}"
        number += 1

    used_uids.add(uid)
    return uid


def wiki_link(name: str) -> str:
    page = name.replace(" ", "_")

    return (
        "https://oldschool.runescape.wiki/w/"
        f"{quote(page, safe='_/()')}"
    )


def new_item(
    name: str,
    item_id: int | None,
    used_uids: set[str],
) -> dict:
    """
    Create a brand-new item using the current JSON format.

    Existing items are never rebuilt with this function.
    """
    return {
        "name": name,
        "alias": name,
        "uid": unique_uid(name, used_uids),
        "itemId": item_id,
        "tags": [],
        "tier": None,
        "cost": None,
        "alwaysAvailable": False,
        "unlocked": False,
        "wikiLink": wiki_link(name),
        "imageName": f"{name}.png",
    }


def load_csv(
    path: Path,
    logger: logging.Logger,
    stats: dict,
) -> list[dict]:
    """
    Read tools/BronzemanItems.csv.

    Required headers:

        name,itemId

    itemId rules:

        0 or blank:
            Resolve the item ID from the OSRS dump.

        Positive integer:
            Use the CSV value as an explicit manual override.
    """
    if not path.exists():
        raise FileNotFoundError(f"Could not find CSV file: {path}")

    rows = []
    seen_names = {}

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError(
                "CSV is empty or has no header row."
            )

        headers = {
            normalize(header): header
            for header in reader.fieldnames
            if header is not None
        }

        name_header = headers.get("name")
        id_header = headers.get("itemid")

        if name_header is None or id_header is None:
            raise ValueError(
                'CSV must contain the headers "name" and "itemId".'
            )

        for row_number, row in enumerate(reader, start=2):
            name = str(
                row.get(name_header, "") or ""
            ).strip()

            raw_id = str(
                row.get(id_header, "") or ""
            ).strip()

            if not name and not raw_id:
                continue

            stats["csv_rows"] += 1

            if not name:
                stats["skipped"] += 1
                stats["errors"] += 1

                logger.error(
                    "CSV row %d skipped: name is empty.",
                    row_number,
                )
                continue

            try:
                parsed_id = int(raw_id or "0")
            except ValueError:
                stats["skipped"] += 1
                stats["errors"] += 1

                logger.error(
                    "CSV row %d skipped: itemId %r is not "
                    "an integer for %r.",
                    row_number,
                    raw_id,
                    name,
                )
                continue

            if parsed_id < 0:
                stats["skipped"] += 1
                stats["errors"] += 1

                logger.error(
                    "CSV row %d skipped: itemId must be "
                    "0 or positive for %r.",
                    row_number,
                    name,
                )
                continue

            normalized_name = normalize(name)

            if normalized_name in seen_names:
                stats["skipped"] += 1
                stats["warnings"] += 1

                logger.warning(
                    "CSV row %d skipped: duplicate name %r; "
                    "first seen on row %d.",
                    row_number,
                    name,
                    seen_names[normalized_name],
                )
                continue

            seen_names[normalized_name] = row_number

            rows.append(
                {
                    "name": name,
                    "manual_id": (
                        parsed_id
                        if parsed_id > 0
                        else None
                    ),
                    "row": row_number,
                }
            )

    return rows


def load_dump(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find OSRS dump: {path}"
        )

    raw = json.loads(
        path.read_text(encoding="utf-8")
    )

    if isinstance(raw, dict):
        source = raw.values()
    elif isinstance(raw, list):
        source = raw
    else:
        raise ValueError(
            "OSRS dump must be a JSON object or array."
        )

    items = []

    for entry in source:
        if not isinstance(entry, dict):
            continue

        if "id" not in entry or "name" not in entry:
            continue

        try:
            item_id = int(entry["id"])
        except (TypeError, ValueError):
            continue

        name = str(entry["name"]).strip()

        if not name:
            continue

        items.append(
            {
                "id": item_id,
                "name": name,
            }
        )

    return items


def load_json(path: Path) -> dict:
    if not path.exists():
        return {
            "schemaVersion": 2,
            "items": [],
            "otherImages": [],
            "tagDefinitions": TAG_DEFINITIONS,
        }

    data = json.loads(
        path.read_text(encoding="utf-8")
    )

    if not isinstance(data, dict):
        raise ValueError(
            "Bronzeman JSON must contain a top-level object."
        )

    data.setdefault("schemaVersion", 2)
    data.setdefault("items", [])
    data.setdefault("otherImages", [])
    data.setdefault(
        "tagDefinitions",
        TAG_DEFINITIONS,
    )

    if not isinstance(data["items"], list):
        raise ValueError(
            'Top-level "items" must be a JSON array.'
        )

    return data


def build_dump_indexes(
    items: list[dict],
) -> tuple[dict, dict]:
    by_name = {}
    by_loose_name = {}

    for item in items:
        by_name.setdefault(
            normalize(item["name"]),
            [],
        ).append(item)

        by_loose_name.setdefault(
            normalize_loose(item["name"]),
            [],
        ).append(item)

    return by_name, by_loose_name


def find_dump_item(
    csv_row: dict,
    by_name: dict,
    by_loose_name: dict,
    logger: logging.Logger,
    stats: dict,
) -> tuple[dict | None, str | None]:
    matches = by_name.get(
        normalize(csv_row["name"])
    )

    match_type = "normalized name"

    if not matches:
        matches = by_loose_name.get(
            normalize_loose(csv_row["name"])
        )

        match_type = "loose name"

    if not matches:
        return None, None

    matches = sorted(
        matches,
        key=lambda item: item["id"],
    )

    selected = matches[0]
    manual_id = csv_row["manual_id"]

    # When duplicate names exist in the dump, a manual ID can
    # select the correct duplicate.
    if manual_id is not None:
        for candidate in matches:
            if candidate["id"] == manual_id:
                selected = candidate
                break

    if len(matches) > 1:
        stats["warnings"] += 1

        choices = ", ".join(
            f'{item["name"]} ({item["id"]})'
            for item in matches[:10]
        )

        logger.warning(
            "CSV row %d: multiple dump entries matched %r. "
            "Selected %s (%s). Choices: %s",
            csv_row["row"],
            csv_row["name"],
            selected["name"],
            selected["id"],
            choices,
        )

    return selected, match_type


def suggestions(
    name: str,
    dump_items: list[dict],
) -> list[str]:
    lookup = {
        normalize(item["name"]): item["name"]
        for item in dump_items
    }

    matches = get_close_matches(
        normalize(name),
        list(lookup),
        n=5,
        cutoff=0.72,
    )

    return [
        lookup[key]
        for key in matches
    ]


def check_wiki_page(
    name: str,
) -> tuple[bool, str]:
    """
    Check whether a page exists on the OSRS Wiki.

    This is only called when the item name was not found
    in the OSRS dump.
    """
    query = urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "redirects": "1",
            "titles": name,
        }
    )

    request = Request(
        f"{WIKI_API_URL}?{query}",
        headers={
            "User-Agent": WIKI_USER_AGENT,
        },
    )

    try:
        with urlopen(
            request,
            timeout=15,
        ) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

    except HTTPError as error:
        return False, f"HTTP error {error.code}"

    except URLError as error:
        return False, (
            f"network error: {error.reason}"
        )

    except TimeoutError:
        return False, "request timed out"

    except json.JSONDecodeError as error:
        return False, (
            f"invalid JSON response: {error}"
        )

    pages = (
        result
        .get("query", {})
        .get("pages", [])
    )

    if not pages:
        return False, (
            "Wiki API returned no page record"
        )

    if not isinstance(pages[0], dict):
        return False, (
            "Wiki API returned an invalid page record"
        )

    page = pages[0]

    if page.get("missing") is True:
        return False, "page does not exist"

    resolved_title = str(
        page.get("title") or name
    )

    return True, resolved_title


def build_existing_indexes(
    data: dict,
) -> tuple[set[str], dict, dict, dict]:
    used_uids = set()
    by_name = {}
    by_loose_name = {}
    by_id = {}

    for item in data["items"]:
        if not isinstance(item, dict):
            continue

        uid = (
            item.get("uid")
            or item.get("id")
        )

        if uid:
            used_uids.add(str(uid))

        name = str(
            item.get("name") or ""
        ).strip()

        if name:
            by_name.setdefault(
                normalize(name),
                item,
            )

            by_loose_name.setdefault(
                normalize_loose(name),
                item,
            )

        try:
            item_id = int(
                item.get("itemId")
            )
        except (TypeError, ValueError):
            continue

        by_id.setdefault(
            item_id,
            item,
        )

    return (
        used_uids,
        by_name,
        by_loose_name,
        by_id,
    )


def item_name(item: dict) -> str:
    return str(
        item.get("name")
        or item.get("alias")
        or "<unnamed item>"
    )


def add_or_update(
    data: dict,
    csv_row: dict,
    official_name: str,
    resolved_id: int | None,
    source: str,
    indexes: tuple,
    logger: logging.Logger,
    stats: dict,
) -> None:
    """
    Match an existing item by name.

    Existing items keep all of their manually edited values.
    The only existing value this function is allowed to change
    is itemId.
    """
    (
        used_uids,
        by_name,
        by_loose_name,
        by_id,
    ) = indexes

    existing = by_name.get(
        normalize(official_name)
    )

    if existing is None:
        existing = by_name.get(
            normalize(csv_row["name"])
        )

    if existing is None:
        existing = by_loose_name.get(
            normalize_loose(official_name)
        )

    if existing is None:
        existing = by_loose_name.get(
            normalize_loose(csv_row["name"])
        )

    if resolved_id is not None:
        owner = by_id.get(resolved_id)

        if owner is not None and owner is not existing:
            stats["skipped"] += 1
            stats["errors"] += 1

            logger.error(
                "CSV row %d skipped: itemId %d for %r "
                "is already assigned to %r.",
                csv_row["row"],
                resolved_id,
                csv_row["name"],
                item_name(owner),
            )
            return

    if existing is not None:
        if resolved_id is None:
            stats["unchanged"] += 1

            logger.info(
                "UNCHANGED | %s | no numeric itemId "
                "resolved | source=%s",
                item_name(existing),
                source,
            )
            return

        try:
            old_id = int(
                existing.get("itemId")
            )
        except (TypeError, ValueError):
            old_id = None

        if old_id == resolved_id:
            stats["unchanged"] += 1

            logger.info(
                "UNCHANGED | %s | itemId=%d | source=%s",
                item_name(existing),
                resolved_id,
                source,
            )
            return

        if (
            old_id is not None
            and by_id.get(old_id) is existing
        ):
            del by_id[old_id]

        # Do not rebuild or replace the existing object.
        # Only correct its itemId.
        existing["itemId"] = resolved_id
        by_id[resolved_id] = existing

        stats["updated"] += 1

        logger.info(
            "UPDATED   | %s | itemId %s -> %d | source=%s",
            item_name(existing),
            (
                "null"
                if old_id is None
                else old_id
            ),
            resolved_id,
            source,
        )
        return

    item = new_item(
        official_name,
        resolved_id,
        used_uids,
    )

    data["items"].append(item)

    by_name[
        normalize(official_name)
    ] = item

    by_loose_name[
        normalize_loose(official_name)
    ] = item

    if resolved_id is not None:
        by_id[resolved_id] = item

    stats["added"] += 1

    logger.info(
        "ADDED     | %s | itemId=%s | "
        "source=%s | CSV name=%r",
        official_name,
        (
            "null"
            if resolved_id is None
            else resolved_id
        ),
        source,
        csv_row["name"],
    )


def tier_to_cost(tier):
    """
    Convert numeric tier strings to integer costs.

    Non-numeric tier values are preserved, although normal item tiers
    are expected to be integers, numeric strings, or null.
    """
    if tier is None:
        return None

    if isinstance(tier, bool):
        return int(tier)

    if isinstance(tier, int):
        return tier

    if isinstance(tier, float) and tier.is_integer():
        return int(tier)

    if isinstance(tier, str):
        value = tier.strip()

        if value.lstrip("-").isdigit():
            return int(value)

    return tier


def update_item_costs(data: dict) -> None:
    """
    Ensure every item has a cost field.

    Talent-tagged items use their tier as the cost.
    Every other item receives a null cost.
    """
    for item in data["items"]:
        if not isinstance(item, dict):
            continue

        tags = item.get("tags") or []

        item["cost"] = (
            tier_to_cost(item.get("tier"))
            if "talent" in tags
            else None
        )


def sort_items(data: dict) -> None:
    """
    Sort numeric item IDs in ascending order.

    Null or invalid IDs remain at the bottom while keeping
    their previous relative order.
    """
    indexed_items = list(
        enumerate(data["items"])
    )

    def sort_key(pair):
        original_index, item = pair

        if not isinstance(item, dict):
            return 1, 0, original_index

        try:
            item_id = int(
                item.get("itemId")
            )
        except (TypeError, ValueError):
            return 1, 0, original_index

        return 0, item_id, original_index

    indexed_items.sort(
        key=sort_key
    )

    data["items"] = [
        item
        for _, item in indexed_items
    ]


def write_json(
    path: Path,
    data: dict,
) -> None:
    """
    Write through a temporary file so a failed write does not
    leave the main JSON partially written.
    """
    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_path = path.with_suffix(
        path.suffix + ".tmp"
    )

    temp_path.write_text(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
        ) + "\n",
        encoding="utf-8",
    )

    temp_path.replace(path)


def run(
    csv_path: Path,
    dump_path: Path,
    json_path: Path,
    output_path: Path,
    logger: logging.Logger,
) -> None:
    stats = {
        "csv_rows": 0,
        "added": 0,
        "updated": 0,
        "unchanged": 0,
        "skipped": 0,
        "missing_dump": 0,
        "wiki_found": 0,
        "warnings": 0,
        "errors": 0,
    }

    logger.info("=" * 90)
    logger.info("RUN START")
    logger.info("CSV: %s", csv_path)
    logger.info("OSRS dump: %s", dump_path)
    logger.info("Input JSON: %s", json_path)
    logger.info("Output JSON: %s", output_path)

    csv_rows = load_csv(
        csv_path,
        logger,
        stats,
    )

    dump_items = load_dump(
        dump_path
    )

    data = load_json(
        json_path
    )

    (
        dump_by_name,
        dump_by_loose_name,
    ) = build_dump_indexes(
        dump_items
    )

    existing_indexes = (
        build_existing_indexes(data)
    )

    for csv_row in csv_rows:
        (
            dump_item,
            match_type,
        ) = find_dump_item(
            csv_row,
            dump_by_name,
            dump_by_loose_name,
            logger,
            stats,
        )

        if dump_item is not None:
            dump_id = dump_item["id"]
            manual_id = csv_row["manual_id"]

            resolved_id = (
                manual_id
                if manual_id is not None
                else dump_id
            )

            source = (
                "manual CSV itemId"
                if manual_id is not None
                else f"OSRS dump via {match_type}"
            )

            if (
                manual_id is not None
                and manual_id != dump_id
            ):
                stats["warnings"] += 1

                logger.warning(
                    "CSV row %d: manual itemId %d "
                    "overrides dump itemId %d for %r.",
                    csv_row["row"],
                    manual_id,
                    dump_id,
                    csv_row["name"],
                )

            add_or_update(
                data=data,
                csv_row=csv_row,
                official_name=dump_item["name"],
                resolved_id=resolved_id,
                source=source,
                indexes=existing_indexes,
                logger=logger,
                stats=stats,
            )
            continue

        stats["missing_dump"] += 1

        close_names = suggestions(
            csv_row["name"],
            dump_items,
        )

        logger.warning(
            "CSV row %d: %r was not found in the "
            "OSRS dump. Suggestions: %s",
            csv_row["row"],
            csv_row["name"],
            (
                ", ".join(close_names)
                if close_names
                else "none"
            ),
        )

        (
            page_exists,
            wiki_result,
        ) = check_wiki_page(
            csv_row["name"]
        )

        if not page_exists:
            stats["skipped"] += 1
            stats["warnings"] += 1

            logger.warning(
                "SKIPPED   | %s | absent from dump "
                "and Wiki check failed: %s",
                csv_row["name"],
                wiki_result,
            )
            continue

        stats["wiki_found"] += 1

        resolved_id = csv_row["manual_id"]

        source = (
            "manual CSV itemId; Wiki page verified"
            if resolved_id is not None
            else "Wiki page verified; no itemId available"
        )

        logger.info(
            "WIKI FOUND | CSV name=%r | "
            "resolved page=%r | itemId=%s",
            csv_row["name"],
            wiki_result,
            (
                "null"
                if resolved_id is None
                else resolved_id
            ),
        )

        add_or_update(
            data=data,
            csv_row=csv_row,
            official_name=wiki_result,
            resolved_id=resolved_id,
            source=source,
            indexes=existing_indexes,
            logger=logger,
            stats=stats,
        )

    update_item_costs(data)
    sort_items(data)

    write_json(
        output_path,
        data,
    )

    logger.info(
        "Saved JSON: %s",
        output_path,
    )

    logger.info(
        "SUMMARY | CSV rows=%d | added=%d | "
        "updated IDs=%d | unchanged=%d | "
        "skipped=%d | missing from dump=%d | "
        "Wiki pages found=%d | warnings=%d | errors=%d",
        stats["csv_rows"],
        stats["added"],
        stats["updated"],
        stats["unchanged"],
        stats["skipped"],
        stats["missing_dump"],
        stats["wiki_found"],
        stats["warnings"],
        stats["errors"],
    )

    logger.info("RUN END")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Build Bronzeman item definitions from a "
            "name,itemId CSV while preserving existing "
            "item fields."
        )
    )

    parser.add_argument(
        "--csv",
        type=Path,
        default=CSV_PATH,
        help=(
            "Input CSV containing name,itemId columns. "
            f"Default: {CSV_PATH}"
        ),
    )

    parser.add_argument(
        "--osrs-dump",
        type=Path,
        default=OSRS_DUMP_PATH,
        help=(
            "Full OSRS item dump JSON. "
            f"Default: {OSRS_DUMP_PATH}"
        ),
    )

    parser.add_argument(
        "--json",
        type=Path,
        default=JSON_PATH,
        help=(
            "Existing Bronzeman item definitions JSON. "
            f"Default: {JSON_PATH}"
        ),
    )

    parser.add_argument(
        "--out",
        type=Path,
        help=(
            "Optional output path. When omitted, "
            "--json is updated in place."
        ),
    )

    parser.add_argument(
        "--log",
        type=Path,
        default=LOG_PATH,
        help=(
            "Append-only run log. "
            f"Default: {LOG_PATH}"
        ),
    )

    args = parser.parse_args()

    logger = make_logger(
        args.log
    )

    try:
        run(
            csv_path=args.csv,
            dump_path=args.osrs_dump,
            json_path=args.json,
            output_path=(
                args.out
                or args.json
            ),
            logger=logger,
        )

    except Exception:
        logger.exception(
            "RUN FAILED"
        )
        sys.exit(1)


if __name__ == "__main__":
    main()