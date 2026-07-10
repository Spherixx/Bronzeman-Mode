import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote


DEFAULT_JSON_PATH = Path("BronzemanItemDefs.json")

USER_AGENT = (
    "BronzemanTrackerImageCache/1.0 "
    "(personal OSRS tracker; contact: none)"
)


def wiki_file_path_url(image_name: str) -> str:
    return f"https://oldschool.runescape.wiki/w/Special:FilePath/{quote(image_name)}"


def get_image_name(entry: dict) -> str | None:
    image_name = entry.get("imageName")

    if image_name:
        return str(image_name).strip()

    name = entry.get("name")
    if name:
        return f"{str(name).strip()}.png"

    return None


def get_download_url(entry: dict, image_name: str) -> str:
    """
    Prefer explicit URLs from the JSON.
    Fall back to OSRS Wiki Special:FilePath using imageName.
    """
    return (
        entry.get("iconLink")
        or entry.get("imageUrl")
        or entry.get("sourceUrl")
        or wiki_file_path_url(image_name)
    )


def item_output_path(entry: dict) -> Path:
    """
    Items go in images/items.
    This intentionally ignores weird old paths and standardizes the cache location.
    """
    image_name = get_image_name(entry)
    if not image_name:
        raise ValueError(f"Item is missing imageName/name: {entry}")

    return Path("images") / "items" / image_name


def other_image_output_path(entry: dict) -> Path:
    """
    Other images go in images.
    """
    image_name = get_image_name(entry)
    if not image_name:
        raise ValueError(f"Other image is missing imageName/name: {entry}")

    return Path("images") / image_name


def download_file(url: str, output_path: Path, retries: int = 3, delay: float = 0.5) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    tmp_path = output_path.with_suffix(output_path.suffix + ".part")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )

    last_error = None

    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                content = response.read()

            if not content:
                raise RuntimeError("Downloaded file was empty.")

            tmp_path.write_bytes(content)
            tmp_path.replace(output_path)
            return

        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError) as error:
            last_error = error

            if tmp_path.exists():
                tmp_path.unlink()

            if attempt < retries:
                time.sleep(delay * attempt)

    raise RuntimeError(f"Failed after {retries} attempts: {last_error}")


def collect_download_jobs(data: dict) -> list[dict]:
    jobs = []

    for entry in data.get("items", []):
        image_name = get_image_name(entry)
        if not image_name:
            continue

        jobs.append({
            "kind": "item",
            "name": entry.get("name", image_name),
            "url": get_download_url(entry, image_name),
            "path": item_output_path(entry),
        })

    for entry in data.get("otherImages", []):
        image_name = get_image_name(entry)
        if not image_name:
            continue

        jobs.append({
            "kind": "other",
            "name": entry.get("name", image_name),
            "url": get_download_url(entry, image_name),
            "path": other_image_output_path(entry),
        })

    return jobs


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download missing Bronzeman item and UI images from BronzemanItemDefs.json."
    )

    parser.add_argument(
        "--json",
        type=Path,
        default=DEFAULT_JSON_PATH,
        help="Path to BronzemanItemDefs.json. Defaults to ./BronzemanItemDefs.json",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Redownload images even if they already exist.",
    )

    parser.add_argument(
        "--delay",
        type=float,
        default=0.15,
        help="Delay in seconds between downloads. Defaults to 0.15.",
    )

    args = parser.parse_args()

    if not args.json.exists():
        raise FileNotFoundError(f"Could not find JSON file: {args.json}")

    data = json.loads(args.json.read_text(encoding="utf-8"))
    jobs = collect_download_jobs(data)

    downloaded = 0
    skipped = 0
    failed = []

    print(f"Found {len(jobs)} image entries.")
    print(f"Using JSON: {args.json}")
    print()

    for job in jobs:
        output_path: Path = job["path"]

        if output_path.exists() and not args.force:
            skipped += 1
            continue

        try:
            print(f'Downloading {job["kind"]}: {job["name"]}')
            print(f"  -> {output_path}")
            download_file(job["url"], output_path)
            downloaded += 1
            time.sleep(args.delay)

        except Exception as error:
            failed.append({
                "name": job["name"],
                "url": job["url"],
                "path": str(output_path),
                "error": str(error),
            })

    print()
    print("Done.")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped existing: {skipped}")
    print(f"Failed: {len(failed)}")

    if failed:
        print()
        print("Failed downloads:")
        for item in failed:
            print(f'  - {item["name"]}')
            print(f'    URL: {item["url"]}')
            print(f'    Path: {item["path"]}')
            print(f'    Error: {item["error"]}')


if __name__ == "__main__":
    main()