import json
import re
import unicodedata
from difflib import SequenceMatcher, get_close_matches
from pathlib import Path
from urllib.parse import quote


ITEM_LIST_PATH = Path("tools/BronzemanItems.txt")
OSRS_ITEMS_PATH = Path("tools/OSRSItems.json")
OUTPUT_PATH = Path("tools/BronzemanItems.json")


IMAGE_OVERRIDES = {
    "Ancient Magicks": "Ancient Magicks icon.png",
    "Lunar spellbook": "Lunar spellbook icon.png",
    "Dragonstone dragon bolts (e)": "Dragonstone dragon bolts (e) 5.png",
    "Coins": "Coins 10000.png",
}


ID_OVERRIDES = {
    "Ancient Magicks": None,
    "Lunar spellbook": None,
}


def make_wiki_link(name: str) -> str:
    page = name.replace(" ", "_")
    return f"https://oldschool.runescape.wiki/w/{quote(page)}"


def clean_text(value: str) -> str:
    """
    General text cleanup.
    """
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("’", "'").replace("`", "'")
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    return value


def normalize_exact(name: str) -> str:
    """
    Near-exact normalized key.
    Handles capitalization, weird unicode, and spaces before parentheses.
    """
    name = clean_text(name).casefold()
    name = re.sub(r"\s+\(", "(", name)
    return name


def normalize_loose(name: str) -> str:
    """
    Looser key for automated matching.
    Removes punctuation and spacing differences.

    Example:
    "Magic shortbow (i)" -> "magicshortbowi"
    "Magic shortbow(i)"  -> "magicshortbowi"
    """
    name = clean_text(name).casefold()
    name = re.sub(r"\.png$", "", name)
    name = re.sub(r"[^a-z0-9]+", "", name)
    return name


def normalize_words(name: str) -> str:
    """
    Word-based key.
    Keeps words separated, but drops punctuation.
    """
    name = clean_text(name).casefold()
    name = re.sub(r"\.png$", "", name)
    name = re.sub(r"[^a-z0-9]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def item_name_from_icon(icon_name: str) -> str:
    """
    Converts an icon filename into a possible item name.
    """
    icon_name = clean_text(icon_name)
    icon_name = re.sub(r"\.png$", "", icon_name, flags=re.IGNORECASE)
    return icon_name.replace("_", " ")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_wanted_names(path: Path) -> list[str]:
    with path.open("r", encoding="utf-8") as f:
        return [
            line.strip()
            for line in f
            if line.strip() and not line.strip().startswith("#")
        ]


def looks_like_item_object(value: object) -> bool:
    """
    Detects an item object without assuming the entire JSON shape.
    """
    if not isinstance(value, dict):
        return False

    name = value.get("name")
    if not isinstance(name, str) or not name.strip():
        return False

    # Most OSRS item records should have at least one of these.
    # Keep this broad because different dumps use different fields.
    likely_item_fields = {
        "id",
        "icon",
        "examine",
        "members",
        "tradeable",
        "tradeable_on_ge",
        "equipment",
        "wiki_name",
        "wiki_url",
        "value",
        "highalch",
        "lowalch",
    }

    return any(field in value for field in likely_item_fields)


def extract_items(data: object) -> list[dict]:
    """
    Recursively extracts item-looking objects from basically any JSON shape.

    Supports:
    - [{ item }, { item }]
    - { "123": { item }, "456": { item } }
    - { "items": [{ item }] }
    - nested structures
    """
    found = []

    def walk(value: object):
        if isinstance(value, dict):
            if looks_like_item_object(value):
                found.append(value)
                return

            for child in value.values():
                walk(child)

        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(data)

    # Deduplicate by id if possible, otherwise by normalized name.
    deduped = []
    seen = set()

    for item in found:
        item_id = item.get("id")
        name = item.get("name", "")

        if item_id is not None:
            key = f"id:{item_id}"
        else:
            key = f"name:{normalize_exact(name)}"

        if key in seen:
            continue

        seen.add(key)
        deduped.append(item)

    return deduped


def get_item_icon(item: dict) -> str | None:
    """
    Tries common icon/image field names.
    """
    possible_fields = [
        "icon",
        "icon_name",
        "image",
        "imageName",
        "filename",
        "fileName",
    ]

    for field in possible_fields:
        value = item.get(field)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def build_indexes(osrs_items: list[dict]):
    """
    Builds several automatic lookup maps.
    No manual aliases.
    """
    exact_index = {}
    loose_index = {}
    words_index = {}
    all_names = []

    def add_to_index(index: dict, key: str, item: dict):
        if not key:
            return

        # Store a list so we can detect ambiguous loose matches.
        index.setdefault(key, []).append(item)

    for item in osrs_items:
        name = item.get("name")

        if not isinstance(name, str) or not name.strip():
            continue

        name = clean_text(name)
        all_names.append(name)

        add_to_index(exact_index, normalize_exact(name), item)
        add_to_index(loose_index, normalize_loose(name), item)
        add_to_index(words_index, normalize_words(name), item)

        icon = get_item_icon(item)
        if icon:
            icon_as_name = item_name_from_icon(icon)

            add_to_index(exact_index, normalize_exact(icon_as_name), item)
            add_to_index(loose_index, normalize_loose(icon_as_name), item)
            add_to_index(words_index, normalize_words(icon_as_name), item)

    return exact_index, loose_index, words_index, all_names


def single_match(matches: list[dict] | None) -> dict | None:
    """
    Only accepts a match if the key resolves to exactly one item.
    """
    if not matches:
        return None

    if len(matches) == 1:
        return matches[0]

    return None


def score_match(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_words(a), normalize_words(b)).ratio()


def find_best_fuzzy_match(wanted_name: str, osrs_items: list[dict]) -> tuple[dict | None, float]:
    """
    Last-resort automated fuzzy match.

    This is intentionally strict. It only accepts a very strong, clear match.
    """
    scored = []

    for item in osrs_items:
        name = item.get("name")
        if not isinstance(name, str):
            continue

        score = score_match(wanted_name, name)
        scored.append((score, item))

    scored.sort(key=lambda pair: pair[0], reverse=True)

    if not scored:
        return None, 0.0

    best_score, best_item = scored[0]
    second_score = scored[1][0] if len(scored) > 1 else 0.0

    # High-confidence only.
    # Also require a gap from second place so we do not silently pick a wrong variant.
    if best_score >= 0.94 and best_score - second_score >= 0.03:
        return best_item, best_score

    return None, best_score


def find_item(
    wanted_name: str,
    exact_index: dict,
    loose_index: dict,
    words_index: dict,
    osrs_items: list[dict],
):
    """
    Attempts matching in safe order:
    1. exact normalized name
    2. loose punctuation-insensitive name
    3. word-normalized name
    4. strict fuzzy fallback
    """
    exact_key = normalize_exact(wanted_name)
    loose_key = normalize_loose(wanted_name)
    words_key = normalize_words(wanted_name)

    matched = single_match(exact_index.get(exact_key))
    if matched:
        return matched, "exact"

    matched = single_match(loose_index.get(loose_key))
    if matched:
        return matched, "loose"

    matched = single_match(words_index.get(words_key))
    if matched:
        return matched, "words"

    fuzzy_match, fuzzy_score = find_best_fuzzy_match(wanted_name, osrs_items)
    if fuzzy_match:
        return fuzzy_match, f"fuzzy:{fuzzy_score:.3f}"

    return None, f"missing; best fuzzy score {fuzzy_score:.3f}"


def main():
    wanted_names = load_wanted_names(ITEM_LIST_PATH)
    osrs_data = load_json(OSRS_ITEMS_PATH)
    osrs_items = extract_items(osrs_data)

    if not osrs_items:
        raise RuntimeError(
            "No item objects were found in OSRSItems.json. "
            "The JSON shape may not contain item records with name/id/icon fields."
        )

    print(f"Loaded {len(osrs_items)} item records from {OSRS_ITEMS_PATH}")

    exact_index, loose_index, words_index, all_names = build_indexes(osrs_items)

    output = []
    missing = []
    matched_logs = []

    for wanted_name in wanted_names:
        manual_id_exists = wanted_name in ID_OVERRIDES

        matched_item, match_method = find_item(
            wanted_name,
            exact_index,
            loose_index,
            words_index,
            osrs_items,
        )

        if not matched_item and not manual_id_exists:
            close = get_close_matches(wanted_name, all_names, n=10, cutoff=0.5)
            missing.append({
                "wanted": wanted_name,
                "reason": match_method,
                "close": close,
            })
            continue

        item_id = ID_OVERRIDES.get(wanted_name)

        if matched_item and wanted_name not in ID_OVERRIDES:
            item_id = matched_item.get("id")

        image_name = IMAGE_OVERRIDES.get(wanted_name)

        if not image_name and matched_item:
            image_name = get_item_icon(matched_item)

        if not image_name:
            image_name = f"{wanted_name}.png"

        output.append({
            "name": wanted_name,
            "wikiLink": make_wiki_link(wanted_name),
            "itemId": item_id,
            "imageName": image_name,
        })

        if matched_item:
            matched_logs.append({
                "wanted": wanted_name,
                "matched": matched_item.get("name"),
                "id": matched_item.get("id"),
                "method": match_method,
            })

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(output)} items to {OUTPUT_PATH}")

    print("\nMatched items:")
    for entry in matched_logs:
        wanted = entry["wanted"]
        matched = entry["matched"]
        item_id = entry["id"]
        method = entry["method"]

        if wanted == matched:
            print(f"- {wanted} -> id {item_id} [{method}]")
        else:
            print(f"- {wanted} -> {matched} -> id {item_id} [{method}]")

    if missing:
        print("\nMissing items:")
        for entry in missing:
            print(f"\n- {entry['wanted']}")
            print(f"  Reason: {entry['reason']}")

            if entry["close"]:
                print("  Close matches:")
                for match in entry["close"]:
                    print(f"    - {match}")

    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()