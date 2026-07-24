from pathlib import Path

DATA_DIR = Path("data")
IMAGES_DIR = Path("images")

CSV_ITEMS = DATA_DIR / "FlatItemsList.csv"
JSON_ITEMS = DATA_DIR / "BronzemanItems.json"
JSON_SETS = DATA_DIR / "BronzemanSets.json"
JSON_UNLOCKS = DATA_DIR / "BronzemanUnlocks.json"
JSON_SHOP = DATA_DIR / "BronzemanShop.json"
JSON_CHALLENGES = DATA_DIR / "BronzemanChallenges.json"
JSON_PVM = DATA_DIR / "BronzemanPvM.json"
JSON_PVP = DATA_DIR / "BronzemanPvP.json"
JSON_INFO = DATA_DIR / "BronzemanInfo.json"

IMAGES_ITEMS = IMAGES_DIR / "items"
IMAGES_OTHER = IMAGES_DIR / "other"

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
    "spellbook",
    "prayer",
    "consumable",
    "cosmetic",
    "other",
]

BEHAVIOR_DEFINITIONS = [
    "hidden",
    "talent",
]

ITEMS_FIELD_ORDER = [
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

SETS_FIELD_ORDER = [
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

SHOP_FIELD_ORDER = [
    "uid",
    "alias",
    "category",
    "amount",
    "cost",
    "images",
]

UNLOCKS_FIELD_ORDER = [
    "uid",
    "alias",
    "set",
    "tags",
    "behaviors",
    "tier",
    "cost",
    "alwaysAvailable",
    "unlocked",
    "imageUsed",
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