import json
import re
import shutil
from pathlib import Path
from typing import Any


ITEMS_FILE = Path("data/BronzemanItems.json")
SETS_FILE = Path("data/BronzemanSets.json")

# Tags listed here will not be copied from individual items into set entries.
# They will still remain available inside tagDefinitions.
EXCLUDED_TAGS = [
    # "weapon",
    # "armor",
]

# Behaviors listed here will not be copied from individual items into set entries.
# They will still remain available inside behaviorDefinitions.
EXCLUDED_BEHAVIORS = [
    # "hidden",
    # "shop",
]

SET_FIELD_ORDER = [
    "uid",
    "alias",
    "tags",
    "behaviors",
    "tier",
    "cost",
    "alwaysAvailable",
    "unlocked",
    "imageUsed",
]


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Could not find: {path.resolve()}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def find_object_list(
    data: Any,
    preferred_keys: list[str],
    description: str,
) -> tuple[list[dict[str, Any]], str | None]:
    """
    Find a list of JSON objects.

    Supports either:

    {
        "items": [...]
    }

    or a root-level array:

    [...]
    """
    if isinstance(data, list):
        return data, None

    if not isinstance(data, dict):
        raise ValueError(
            f"The {description} JSON root must be an object or array."
        )

    for key in preferred_keys:
        value = data.get(key)

        if isinstance(value, list):
            return value, key

    for key, value in data.items():
        if (
            isinstance(value, list)
            and all(isinstance(entry, dict) for entry in value)
        ):
            return value, key

    raise ValueError(f"Could not find the {description} array.")


def humanize_uid(uid: str) -> str:
    """
    Convert:

        eclipse-moon-equipment

    into:

        Eclipse moon equipment
    """
    text = re.sub(r"[-_]+", " ", uid)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return uid

    return text[0].upper() + text[1:]


def append_unique(
    destination: list[str],
    values: Any,
    excluded: set[str],
) -> None:
    """
    Append unique strings while preserving their original order.
    """
    if not isinstance(values, list):
        return

    for value in values:
        if not isinstance(value, str):
            continue

        value = value.strip()

        if not value:
            continue

        if value in excluded:
            continue

        if value not in destination:
            destination.append(value)


def build_generated_sets(
    items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    excluded_tags = set(EXCLUDED_TAGS)
    excluded_behaviors = set(EXCLUDED_BEHAVIORS)

    generated_by_uid: dict[str, dict[str, Any]] = {}

    for item in items:
        set_uid = item.get("set")

        if not isinstance(set_uid, str):
            continue

        set_uid = set_uid.strip()

        if not set_uid:
            continue

        if set_uid not in generated_by_uid:
            image_name = item.get("imageName")

            generated_by_uid[set_uid] = {
                "uid": set_uid,
                "alias": humanize_uid(set_uid),
                "tags": [],
                "behaviors": [],
                "tier": None,
                "cost": None,
                "alwaysAvailable": False,
                "unlocked": False,
                "imageUsed": (
                    image_name
                    if isinstance(image_name, str) and image_name.strip()
                    else None
                ),
            }

        generated_set = generated_by_uid[set_uid]

        append_unique(
            generated_set["tags"],
            item.get("tags"),
            excluded_tags,
        )

        append_unique(
            generated_set["behaviors"],
            item.get("behaviors"),
            excluded_behaviors,
        )

        # If the first item had no image, use the first later item that does.
        if generated_set["imageUsed"] is None:
            image_name = item.get("imageName")

            if isinstance(image_name, str) and image_name.strip():
                generated_set["imageUsed"] = image_name

    return list(generated_by_uid.values())


def reorder_set_fields(set_entry: dict[str, Any]) -> dict[str, Any]:
    """
    Put standard fields first while preserving any additional fields.
    """
    reordered: dict[str, Any] = {}

    for field in SET_FIELD_ORDER:
        if field in set_entry:
            reordered[field] = set_entry[field]

    for field, value in set_entry.items():
        if field not in reordered:
            reordered[field] = value

    return reordered


def get_string_definition_list(
    data: Any,
    key: str,
) -> list[str]:
    """
    Read a definition list such as tagDefinitions from the items JSON.

    Invalid or duplicate values are discarded.
    """
    if not isinstance(data, dict):
        return []

    values = data.get(key)

    if not isinstance(values, list):
        return []

    result: list[str] = []

    for value in values:
        if not isinstance(value, str):
            continue

        value = value.strip()

        if value and value not in result:
            result.append(value)

    return result


def main() -> None:
    items_data = load_json(ITEMS_FILE)

    items, _ = find_object_list(
        items_data,
        preferred_keys=["items"],
        description="items",
    )

    tag_definitions = get_string_definition_list(
        items_data,
        "tagDefinitions",
    )

    behavior_definitions = get_string_definition_list(
        items_data,
        "behaviorDefinitions",
    )

    generated_sets = build_generated_sets(items)

    if SETS_FILE.exists():
        sets_data = load_json(SETS_FILE)

        existing_sets, sets_key = find_object_list(
            sets_data,
            preferred_keys=["sets", "itemSets"],
            description="sets",
        )
    else:
        sets_data = {
            "sets": [],
        }
        existing_sets = sets_data["sets"]
        sets_key = "sets"

    existing_uids = {
        entry.get("uid")
        for entry in existing_sets
        if isinstance(entry, dict)
        and isinstance(entry.get("uid"), str)
    }

    added_sets: list[dict[str, Any]] = []

    for generated_set in generated_sets:
        if generated_set["uid"] in existing_uids:
            continue

        added_sets.append(reorder_set_fields(generated_set))
        existing_uids.add(generated_set["uid"])

    existing_sets.extend(added_sets)

    # Sort all set entries alphabetically by UID.
    existing_sets.sort(
        key=lambda entry: str(entry.get("uid", "")).lower()
    )

    reordered_sets = [
        reorder_set_fields(entry)
        for entry in existing_sets
    ]

    if sets_key is None:
        # A root-level array cannot contain tagDefinitions or
        # behaviorDefinitions, so convert it into an object.
        output_data = {
            "sets": reordered_sets,
            "tagDefinitions": tag_definitions,
            "behaviorDefinitions": behavior_definitions,
        }
    else:
        # Rebuild the root object so the definition arrays are guaranteed
        # to appear after the sets array.
        output_data: dict[str, Any] = {}

        for key, value in sets_data.items():
            if key in {
                sets_key,
                "tagDefinitions",
                "behaviorDefinitions",
            }:
                continue

            output_data[key] = value

        output_data[sets_key] = reordered_sets
        output_data["tagDefinitions"] = tag_definitions
        output_data["behaviorDefinitions"] = behavior_definitions

    if SETS_FILE.exists():
        backup_file = SETS_FILE.with_suffix(
            SETS_FILE.suffix + ".bak"
        )
        shutil.copy2(SETS_FILE, backup_file)
        print(f"Backup created: {backup_file.resolve()}")

    with SETS_FILE.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(
            output_data,
            file,
            indent=2,
            ensure_ascii=False,
        )
        file.write("\n")

    print(f"Items scanned: {len(items)}")
    print(f"Unique sets found in items: {len(generated_sets)}")
    print(f"New sets added: {len(added_sets)}")
    print(
        "Existing sets skipped: "
        f"{len(generated_sets) - len(added_sets)}"
    )
    print(f"Total sets in output: {len(reordered_sets)}")
    print(f"Tag definitions copied: {len(tag_definitions)}")
    print(
        "Behavior definitions copied: "
        f"{len(behavior_definitions)}"
    )
    print(f"Updated: {SETS_FILE.resolve()}")

    if added_sets:
        print("\nAdded set UIDs:")

        for set_entry in added_sets:
            print(f"  - {set_entry['uid']}")


if __name__ == "__main__":
    try:
        main()
    except (
        OSError,
        json.JSONDecodeError,
        ValueError,
    ) as error:
        print(f"Error: {error}")
        raise SystemExit(1)