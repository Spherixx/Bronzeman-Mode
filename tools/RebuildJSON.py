import json
from pathlib import Path
from typing import Any


# =============================================================================
# CONFIGURATION
# =============================================================================

INPUT_FILE = Path("data/BronzemanPvP.json")
OUTPUT_FILE = Path("data/BronzemanPvP.json")

# Set to None when the entire JSON file is a top-level array.
ARRAY_KEY = "pvpTasks"

NEW_FIELD = "cost"
NEW_FIELD_VALUE = "1"

FIELD_ORDER = [
    "uid",
    "alias",
    "difficulty",
    "points",
    "repeatable",
    "cost",
    "completed",
]

# True:
#   Delete fields that are not listed in FIELD_ORDER.
#
# False:
#   Keep unlisted fields after the ordered fields.
REMOVE_UNLISTED_FIELDS = False

JSON_INDENT = 2


# =============================================================================
# SCRIPT
# =============================================================================

def reorder_entry(entry: dict[str, Any]) -> dict[str, Any]:
    """
    Return a newly constructed dictionary whose fields follow FIELD_ORDER.
    """

    # Only add the new field when it is included in FIELD_ORDER.
    if NEW_FIELD in FIELD_ORDER and NEW_FIELD not in entry:
        entry[NEW_FIELD] = NEW_FIELD_VALUE

    reordered_entry: dict[str, Any] = {}

    # Add listed fields in the exact requested order.
    for field_name in FIELD_ORDER:
        if field_name in entry:
            reordered_entry[field_name] = entry[field_name]

    # Keep unlisted fields afterward when removal is disabled.
    if not REMOVE_UNLISTED_FIELDS:
        for field_name, value in entry.items():
            if field_name not in reordered_entry:
                reordered_entry[field_name] = value

    return reordered_entry


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if ARRAY_KEY is None:
        if not isinstance(data, list):
            raise TypeError("Expected the JSON file to contain a top-level array.")

        original_entries = data

    else:
        if not isinstance(data, dict):
            raise TypeError("Expected the JSON file to contain a top-level object.")

        if ARRAY_KEY not in data:
            raise KeyError(f'Array key "{ARRAY_KEY}" was not found.')

        original_entries = data[ARRAY_KEY]

    if not isinstance(original_entries, list):
        raise TypeError("The selected JSON value must be an array.")

    reordered_entries: list[Any] = []
    updated_count = 0
    skipped_count = 0

    for index, entry in enumerate(original_entries):
        if not isinstance(entry, dict):
            print(f"Skipping entry {index}: expected an object.")
            reordered_entries.append(entry)
            skipped_count += 1
            continue

        reordered_entries.append(reorder_entry(entry))
        updated_count += 1

    # Explicitly replace the old array with the newly ordered array.
    if ARRAY_KEY is None:
        data = reordered_entries
    else:
        data[ARRAY_KEY] = reordered_entries

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            indent=JSON_INDENT,
            ensure_ascii=False,
            sort_keys=False,
        )
        file.write("\n")

    print(f"Updated {updated_count} entries.")
    print(f"Skipped {skipped_count} non-object entries.")
    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()