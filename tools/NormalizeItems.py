import json
import shutil
from pathlib import Path
from typing import Any


INPUT_FILE = Path("data/BronzemanItems.json")

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


def reorder_item_fields(item: dict[str, Any]) -> dict[str, Any]:
    """
    Return a new dictionary with known fields in ITEM_FIELD_ORDER.

    Any additional fields not listed in ITEM_FIELD_ORDER are preserved
    and placed after the known fields in their existing order.
    """
    reordered: dict[str, Any] = {}

    # Add recognized fields in the requested order.
    for field in ITEM_FIELD_ORDER:
        if field in item:
            reordered[field] = item[field]

    # Preserve all unknown/additional fields.
    for field, value in item.items():
        if field not in reordered:
            reordered[field] = value

    return reordered


def item_id_sort_key(item: dict[str, Any]) -> tuple[int, int]:
    """
    Sort valid item IDs numerically in ascending order.

    Missing, null, blank, boolean, or invalid item IDs are placed last.
    """
    item_id = item.get("itemId")

    if item_id is None or item_id == "" or isinstance(item_id, bool):
        return 1, 0

    try:
        return 0, int(item_id)
    except (TypeError, ValueError):
        return 1, 0


def find_items_list(data: Any) -> tuple[list[dict[str, Any]], str | None]:
    """
    Find the list containing the item objects.

    Supports either:
      {
          "items": [...]
      }

    or a JSON file whose root is directly:
      [...]
    """
    if isinstance(data, list):
        return data, None

    if not isinstance(data, dict):
        raise ValueError("The JSON root must be an object or a list.")

    # Prefer the standard "items" key.
    if isinstance(data.get("items"), list):
        return data["items"], "items"

    # Otherwise find a likely list of item dictionaries.
    for key, value in data.items():
        if not isinstance(value, list) or not value:
            continue

        if all(isinstance(entry, dict) for entry in value):
            if any(
                "name" in entry or "itemId" in entry or "uid" in entry
                for entry in value
            ):
                return value, key

    raise ValueError(
        'Could not find the item list. Expected a top-level "items" array '
        "or a root-level array of item objects."
    )


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Could not find: {INPUT_FILE.resolve()}")

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    items, items_key = find_items_list(data)

    original_item_count = len(items)

    # Reorder the fields in each item.
    reordered_items = [
        reorder_item_fields(item)
        for item in items
    ]

    # Python's sort is stable, so items with null item IDs retain
    # their existing order relative to each other.
    reordered_items.sort(key=item_id_sort_key)

    if items_key is None:
        output_data = reordered_items
    else:
        data[items_key] = reordered_items
        output_data = data

    backup_file = INPUT_FILE.with_suffix(INPUT_FILE.suffix + ".bak")
    shutil.copy2(INPUT_FILE, backup_file)

    with INPUT_FILE.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(
            output_data,
            file,
            indent=2,
            ensure_ascii=False,
        )
        file.write("\n")

    valid_item_ids = sum(
        1 for item in reordered_items
        if item_id_sort_key(item)[0] == 0
    )
    null_or_invalid_ids = original_item_count - valid_item_ids

    print(f"Updated: {INPUT_FILE.resolve()}")
    print(f"Backup:  {backup_file.resolve()}")
    print(f"Items processed: {original_item_count}")
    print(f"Items with valid itemId: {valid_item_ids}")
    print(f"Items without valid itemId: {null_or_invalid_ids}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Error: {error}")
        raise SystemExit(1)