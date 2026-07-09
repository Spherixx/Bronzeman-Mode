import json
import time
import argparse
from pathlib import Path
from urllib.parse import quote, urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

INPUT_JSON = Path("tools/BronzemanItems.json")
OTHER_IMAGES_PATH = Path("tools/OtherImages.txt")
OUTPUT_JSON = Path("tools/BronzemanItems.cached.json")

ICON_DIR = Path("images/items")
OTHER_IMAGE_DIR = Path("images")

REQUEST_DELAY_SECONDS = 0.15

USER_AGENT = (
    "BronzemanTracker/1.0 "
    "(personal OSRS tracker)"
)


def wiki_image_url(file_name: str) -> str:
    """
    Python equivalent of:

    function wikiImage(fileName) {
      return `https://oldschool.runescape.wiki/w/Special:FilePath/${encodeURIComponent(fileName)}`;
    }
    """
    encoded_file_name = quote(file_name, safe="")
    return f"https://oldschool.runescape.wiki/w/Special:FilePath/{encoded_file_name}"


def safe_local_filename(file_name: str) -> str:
    """
    Keeps the filename mostly intact, but removes characters that can be bad
    on Windows or awkward in static file paths.
    """
    replacements = {
        "<": "",
        ">": "",
        ":": "",
        '"': "",
        "/": "-",
        "\\": "-",
        "|": "",
        "?": "",
        "*": "",
    }

    cleaned = file_name.strip()

    for bad, replacement in replacements.items():
        cleaned = cleaned.replace(bad, replacement)

    return cleaned


def filename_from_url(url: str) -> str:
    """
    Extracts a usable filename from URLs like:

    https://oldschool.runescape.wiki/w/Special:Redirect/file/Coins_10000.png

    Result:
    Coins_10000.png
    """
    parsed = urlparse(url.strip())
    path = parsed.path.rstrip("/")
    filename = path.split("/")[-1]

    filename = unquote(filename)

    if not filename:
        raise ValueError(f"Could not determine filename from URL: {url}")

    return safe_local_filename(filename)


def download_file(url: str, destination: Path) -> bool:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            content_type = response.headers.get("Content-Type", "")

            if "image" not in content_type.lower():
                print(f"Warning: URL did not return an image: {url}")
                print(f"Content-Type: {content_type}")

            data = response.read()

        destination.parent.mkdir(parents=True, exist_ok=True)

        with destination.open("wb") as f:
            f.write(data)

        return True

    except HTTPError as e:
        print(f"HTTP error {e.code} while downloading: {url}")
        return False

    except URLError as e:
        print(f"URL error while downloading {url}: {e}")
        return False

    except TimeoutError:
        print(f"Timed out while downloading: {url}")
        return False


def load_other_image_urls(path: Path) -> list[str]:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as f:
        return [
            line.strip()
            for line in f
            if line.strip() and not line.strip().startswith("#")
        ]


def cache_item_icons(items: list[dict], icon_dir: Path, force: bool) -> tuple[int, int, int]:
    downloaded = 0
    skipped = 0
    failed = 0

    for item in items:
        image_name = item.get("imageName")

        if not image_name:
            print(f"Missing imageName for item: {item.get('name', 'Unknown')}")
            failed += 1
            continue

        local_filename = safe_local_filename(image_name)
        local_path = icon_dir / local_filename
        local_path_for_json = local_path.as_posix()

        item["imageUrl"] = wiki_image_url(image_name)
        item["localImagePath"] = local_path_for_json

        if local_path.exists() and not force:
            print(f"Skipping existing item icon: {image_name}")
            skipped += 1
            continue

        print(f"Downloading item icon: {image_name}")

        success = download_file(item["imageUrl"], local_path)

        if success:
            downloaded += 1
            time.sleep(REQUEST_DELAY_SECONDS)
        else:
            failed += 1

    return downloaded, skipped, failed


def cache_other_images(urls: list[str], other_image_dir: Path, force: bool) -> tuple[list[dict], int, int, int]:
    other_images = []

    downloaded = 0
    skipped = 0
    failed = 0

    for url in urls:
        try:
            local_filename = filename_from_url(url)
        except ValueError as e:
            print(e)
            failed += 1
            continue

        local_path = other_image_dir / local_filename

        entry = {
            "sourceUrl": url,
            "imageName": local_filename,
            "localImagePath": local_path.as_posix(),
        }

        other_images.append(entry)

        if local_path.exists() and not force:
            print(f"Skipping existing other image: {local_filename}")
            skipped += 1
            continue

        print(f"Downloading other image: {local_filename}")

        success = download_file(url, local_path)

        if success:
            downloaded += 1
            time.sleep(REQUEST_DELAY_SECONDS)
        else:
            failed += 1

    return other_images, downloaded, skipped, failed


def main():
    parser = argparse.ArgumentParser(
        description="Cache OSRS wiki inventory icons and extra wiki images locally."
    )

    parser.add_argument(
        "--input",
        default=str(INPUT_JSON),
        help="Input JSON file. Default: bronzeman_items.json",
    )

    parser.add_argument(
        "--other-images",
        default=str(OTHER_IMAGES_PATH),
        help="Plain text file of extra image URLs. Default: OtherImages.txt",
    )

    parser.add_argument(
        "--output",
        default=str(OUTPUT_JSON),
        help="Output JSON file. Default: bronzeman_items.cached.json",
    )

    parser.add_argument(
        "--icon-dir",
        default=str(ICON_DIR),
        help="Directory to cache item icons in. Default: cache/icons",
    )

    parser.add_argument(
        "--other-image-dir",
        default=str(OTHER_IMAGE_DIR),
        help="Directory to cache extra images in. Default: cache/other",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download images even if they already exist.",
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    other_images_path = Path(args.other_images)
    output_path = Path(args.output)

    icon_dir = Path(args.icon_dir)
    other_image_dir = Path(args.other_image_dir)

    with input_path.open("r", encoding="utf-8") as f:
        items = json.load(f)

    if not isinstance(items, list):
        raise TypeError("Input JSON should be a list of item objects.")

    other_image_urls = load_other_image_urls(other_images_path)

    print("Caching item icons...")
    item_downloaded, item_skipped, item_failed = cache_item_icons(
        items=items,
        icon_dir=icon_dir,
        force=args.force,
    )

    print()
    print("Caching other images...")
    other_images, other_downloaded, other_skipped, other_failed = cache_other_images(
        urls=other_image_urls,
        other_image_dir=other_image_dir,
        force=args.force,
    )

    output_data = {
        "items": items,
        "otherImages": other_images,
    }

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print()
    print("Done.")
    print()
    print("Item icons:")
    print(f"  Downloaded: {item_downloaded}")
    print(f"  Skipped:    {item_skipped}")
    print(f"  Failed:     {item_failed}")
    print()
    print("Other images:")
    print(f"  Downloaded: {other_downloaded}")
    print(f"  Skipped:    {other_skipped}")
    print(f"  Failed:     {other_failed}")
    print()
    print(f"Wrote: {output_path}")


if __name__ == "__main__":
    main()