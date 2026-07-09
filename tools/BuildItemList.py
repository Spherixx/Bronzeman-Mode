import json
from pathlib import Path
from urllib.parse import quote


ITEM_LIST_PATH = Path("BronzemanItems.txt")
OSRS_ITEMS_PATH = Path("OSRSItems.json")
OUTPUT_PATH = Path("BronzemanItems.json")


# Manual image overrides for cases where the wiki icon filename is not just "{name}.png"
# or where you specifically want the image from your original wikiImage list.
IMAGE_OVERRIDES = {
    "Ancient Magicks": "Ancient Magicks icon.png",
    "Lunar spellbook": "Lunar spellbook icon.png",
    "Dragonstone dragon bolts (e)": "Dragonstone dragon bolts (e) 5.png",
    "Coins": "Coins 10000.png",
}


# Optional manual ID overrides for things that may not exist as normal items
# in OSRSItems.json, like spellbook icons.
#
# Leave as None if there is no real item ID.
ID_OVERRIDES = {
    "Ancient Magicks": None,
    "Lunar spellbook": None,
}


def make_wiki_link(name: str) -> str:
    """
    Converts an OSRS item/page name into an Old School RuneScape Wiki URL.
    Example:
    "Dragon dagger(p++)" ->
    "https://oldschool.runescape.wiki/w/Dragon_dagger(p%2B%2B)"
    """
    page = name.replace(" ", "_")
    return f"https://oldschool.runescape.wiki/w/{quote(page)}"


def normalize_name(name: str) -> str:
    """
    Normalized lookup key for forgiving matching.
    """
    return name.strip().casefold()


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


def main():
    wanted_names = load_wanted_names(ITEM_LIST_PATH)
    osrs_data = load_json(OSRS_ITEMS_PATH)

    # Supports either:
    # 1. A normal list of item objects
    # 2. A dict/object containing item objects
    if isinstance(osrs_data, dict):
        if all(isinstance(v, dict) for v in osrs_data.values()):
            osrs_items = list(osrs_data.values())
        else:
            osrs_items = [osrs_data]
    elif isinstance(osrs_data, list):
        osrs_items = osrs_data
    else:
        raise TypeError("OSRSItems.json must be a JSON list or object.")

    items_by_name = {}

    for item in osrs_items:
        name = item.get("name")
        if not name:
            continue

        key = normalize_name(name)

        # Keep first match if duplicate names exist.
        # You can change this if your source has noted/unnoted variants.
        if key not in items_by_name:
            items_by_name[key] = item

    output = []
    missing = []

    for wanted_name in wanted_names:
        key = normalize_name(wanted_name)
        matched_item = items_by_name.get(key)

        manual_id_exists = wanted_name in ID_OVERRIDES

        if not matched_item and not manual_id_exists:
            missing.append(wanted_name)
            continue

        item_id = ID_OVERRIDES.get(wanted_name)

        if matched_item and item_id is None and wanted_name not in ID_OVERRIDES:
            item_id = matched_item.get("id")

        image_name = IMAGE_OVERRIDES.get(wanted_name)

        if not image_name and matched_item:
            image_name = matched_item.get("icon")

        if not image_name:
            image_name = f"{wanted_name}.png"

        output.append({
            "name": wanted_name,
            "wikiLink": make_wiki_link(wanted_name),
            "itemId": item_id,
            "imageName": image_name,
        })

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(output)} items to {OUTPUT_PATH}")

    if missing:
        print("\nMissing from OSRSItems.json:")
        for name in missing:
            print(f"- {name}")


if __name__ == "__main__":
    main()