import argparse
import json
import shutil
from pathlib import Path
from typing import Any


DEFAULT_JSON_PATH = Path("data/BronzemanItems.json")

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

# The order fields will appear in each normalized item.
ITEM_FIELD_ORDER = [
    "name",
    "alias",
    "uid",
    "itemId",
    "tags",
    "behaviors",
    "tier",
    "cost",
    "alwaysAvailable",
    "unlocked",
    "wikiLink",
    "imageName",
]


def unique_strings(values: Any) -> list[str]:
    """
    Return a list of unique, non-empty strings while preserving order.
    """
    if not isinstance(values, list):
        return []

    result: list[str] = []
    seen: set[str] = set()

    for value in values:
        if not isinstance(value, str):
            continue

        cleaned = value.strip()

        if not cleaned or cleaned in seen:
            continue

        seen.add(cleaned)
        result.append(cleaned)

    return result


def normalize_item(item: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """
    Move functional tags into behaviors and normalize the item's field order.

    Returns:
        A tuple containing:
        - The normalized item
        - A list of behavior names moved out of tags
    """
    tags = unique_strings(item.get("tags", []))
    behaviors = unique_strings(item.get("behaviors", []))

    moved_behaviors: list[str] = []

    normalized_tags: list[str] = []

    for tag in tags:
        if tag in BEHAVIOR_DEFINITIONS:
            if tag not in behaviors:
                behaviors.append(tag)

            moved_behaviors.append(tag)
        else:
            normalized_tags.append(tag)

    normalized_item: dict[str, Any] = {}

    # Add known fields in the desired order.
    for field in ITEM_FIELD_ORDER:
        if field == "tags":
            normalized_item[field] = normalized_tags
        elif field == "behaviors":
            normalized_item[field] = behaviors
        elif field in item:
            normalized_item[field] = item[field]
        else:
            normalized_item[field] = default_value_for_field(field)

    # Preserve any unrecognized fields instead of deleting them.
    # These are placed after the normalized standard fields.
    for field, value in item.items():
        if field not in normalized_item:
            normalized_item[field] = value

    return normalized_item, moved_behaviors


def default_value_for_field(field: str) -> Any:
    defaults = {
        "name": "",
        "alias": "",
        "uid": "",
        "itemId": None,
        "tags": [],
        "behaviors": [],
        "tier": None,
        "alwaysAvailable": False,
        "unlocked": False,
        "wikiLink": None,
        "imageName": None,
        "cost": None,
    }

    return defaults.get(field)


def normalize_json(data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, int]]:
    items = data.get("items")

    if not isinstance(items, list):
        raise ValueError('The JSON file must contain an "items" array.')

    normalized_items: list[Any] = []

    stats = {
        "items_processed": 0,
        "items_changed": 0,
        "behaviors_moved": 0,
        "invalid_items_skipped": 0,
    }

    for entry in items:
        if not isinstance(entry, dict):
            normalized_items.append(entry)
            stats["invalid_items_skipped"] += 1
            continue

        normalized_item, moved_behaviors = normalize_item(entry)

        normalized_items.append(normalized_item)

        stats["items_processed"] += 1
        stats["behaviors_moved"] += len(moved_behaviors)

        if normalized_item != entry:
            stats["items_changed"] += 1

    normalized_data: dict[str, Any] = {}

    # Normalize the top-level ordering.
    if "schemaVersion" in data:
        normalized_data["schemaVersion"] = data["schemaVersion"]

    normalized_data["items"] = normalized_items
    normalized_data["tagDefinitions"] = TAG_DEFINITIONS
    normalized_data["behaviorDefinitions"] = BEHAVIOR_DEFINITIONS

    # Preserve any other top-level fields.
    for field, value in data.items():
        if field not in normalized_data:
            normalized_data[field] = value

    return normalized_data, stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Move functional tags into behaviors and normalize the field "
            "ordering in a Bronzeman items JSON file."
        )
    )

    parser.add_argument(
        "json_path",
        nargs="?",
        type=Path,
        default=DEFAULT_JSON_PATH,
        help=f"Path to the JSON file. Default: {DEFAULT_JSON_PATH}",
    )

    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create a .bak backup before rewriting the file.",
    )

    args = parser.parse_args()
    json_path: Path = args.json_path

    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {json_path}")

    try:
        with json_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Invalid JSON in {json_path} "
            f"at line {error.lineno}, column {error.colno}: {error.msg}"
        ) from error

    if not isinstance(data, dict):
        raise ValueError("The top level of the JSON file must be an object.")

    normalized_data, stats = normalize_json(data)

    if not args.no_backup:
        backup_path = json_path.with_suffix(json_path.suffix + ".bak")
        shutil.copy2(json_path, backup_path)
        print(f"Backup created: {backup_path}")

    with json_path.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(
            normalized_data,
            file,
            indent=4,
            ensure_ascii=False,
        )
        file.write("\n")

    print(f"Rewritten: {json_path}")
    print(f"Items processed: {stats['items_processed']}")
    print(f"Items normalized: {stats['items_changed']}")
    print(f"Behavior tags moved: {stats['behaviors_moved']}")

    if stats["invalid_items_skipped"]:
        print(
            "Non-object item entries preserved unchanged: "
            f"{stats['invalid_items_skipped']}"
        )


if __name__ == "__main__":
    main()