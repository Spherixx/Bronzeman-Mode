import argparse
import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import quote


DEFAULT_JSON_PATH = Path("data/BronzemanItems.json")
DEFAULT_IMAGE_DIR = Path("images/items")
DEFAULT_LOG_DIR = Path("logs")

USER_AGENT = (
    "BronzemanTrackerImageCache/1.0 "
    "(personal OSRS tracker; contact: none)"
)


def configure_logging(log_dir: Path) -> tuple[logging.Logger, Path]:
    """
    Configure logging to both the console and a timestamped file in /logs.
    """
    log_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_path = log_dir / f"image_cache_{timestamp}.log"

    logger = logging.getLogger("bronzeman_image_cache")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    file_handler = logging.FileHandler(
        log_path,
        mode="w",
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter("%(message)s")
    )

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger, log_path


def wiki_file_path_url(image_name: str) -> str:
    """
    Build an OSRS Wiki Special:FilePath URL from an image filename.
    """
    return (
        "https://oldschool.runescape.wiki/w/Special:FilePath/"
        f"{quote(image_name)}"
    )


def get_image_name(entry: dict) -> str | None:
    """
    Read imageName from the new item format.

    If imageName is missing, fall back to '<name>.png'.
    """
    image_name = entry.get("imageName")

    if image_name:
        return str(image_name).strip()

    name = entry.get("name")

    if name:
        return f"{str(name).strip()}.png"

    return None


def get_download_url(entry: dict, image_name: str) -> str:
    """
    Get the download URL for an item's inventory icon.

    The new JSON format contains wikiLink rather than iconLink, but wikiLink
    points to the item's article rather than directly to the image. Therefore,
    imageName is used to create a Special:FilePath URL.

    Legacy direct-image fields are still accepted when present.
    """
    explicit_url = (
        entry.get("iconLink")
        or entry.get("imageUrl")
        or entry.get("sourceUrl")
    )

    if explicit_url:
        return str(explicit_url).strip()

    return wiki_file_path_url(image_name)


def item_output_path(entry: dict, image_dir: Path) -> Path:
    """
    Return the standardized local cache path for an item image.
    """
    image_name = get_image_name(entry)

    if not image_name:
        raise ValueError(
            f"Item is missing both imageName and name: {entry}"
        )

    return image_dir / image_name


def download_file(
    url: str,
    output_path: Path,
    retries: int = 3,
    retry_delay: float = 0.5,
) -> None:
    """
    Download one image safely using a temporary .part file.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    temporary_path = output_path.with_suffix(
        output_path.suffix + ".part"
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": (
                "image/avif,image/webp,image/apng,"
                "image/svg+xml,image/*,*/*;q=0.8"
            ),
        },
    )

    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(
                request,
                timeout=30,
            ) as response:
                content = response.read()

            if not content:
                raise RuntimeError("Downloaded file was empty.")

            temporary_path.write_bytes(content)
            temporary_path.replace(output_path)
            return

        except (
            urllib.error.URLError,
            urllib.error.HTTPError,
            TimeoutError,
            RuntimeError,
        ) as error:
            last_error = error

            if temporary_path.exists():
                temporary_path.unlink()

            if attempt < retries:
                time.sleep(retry_delay * attempt)

    raise RuntimeError(
        f"Failed after {retries} attempts: {last_error}"
    )


def load_item_data(json_path: Path) -> dict:
    """
    Load and validate data/BronzemanItems.json.
    """
    try:
        data = json.loads(
            json_path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Invalid JSON in {json_path}: "
            f"line {error.lineno}, column {error.colno}: {error.msg}"
        ) from error

    if not isinstance(data, dict):
        raise ValueError(
            f"Expected the root of {json_path} to be a JSON object."
        )

    items = data.get("items")

    if items is None:
        raise ValueError(
            f'{json_path} does not contain a top-level "items" array.'
        )

    if not isinstance(items, list):
        raise ValueError(
            f'The "items" value in {json_path} must be an array.'
        )

    return data


def collect_download_jobs(
    data: dict,
    image_dir: Path,
    logger: logging.Logger,
) -> list[dict]:
    """
    Convert entries from the new BronzemanItems.json format into download jobs.
    """
    jobs: list[dict] = []

    for index, entry in enumerate(data.get("items", []), start=1):
        if not isinstance(entry, dict):
            logger.warning(
                "Skipping item entry %d because it is not an object: %r",
                index,
                entry,
            )
            continue

        image_name = get_image_name(entry)

        if not image_name:
            logger.warning(
                "Skipping item entry %d because it has no imageName or name.",
                index,
            )
            continue

        name = str(entry.get("name") or image_name).strip()
        uid = entry.get("uid")
        item_id = entry.get("itemId")

        jobs.append(
            {
                "name": name,
                "uid": uid,
                "itemId": item_id,
                "url": get_download_url(entry, image_name),
                "path": item_output_path(entry, image_dir),
            }
        )

    return jobs


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Download missing Bronzeman item images from "
            "data/BronzemanItems.json."
        )
    )

    parser.add_argument(
        "--json",
        type=Path,
        default=DEFAULT_JSON_PATH,
        help=(
            "Path to BronzemanItems.json. "
            "Defaults to data/BronzemanItems.json."
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_IMAGE_DIR,
        help=(
            "Directory where item images are stored. "
            "Defaults to images/items."
        ),
    )

    parser.add_argument(
        "--logs",
        type=Path,
        default=DEFAULT_LOG_DIR,
        help=(
            "Directory where log files are written. "
            "Defaults to logs."
        ),
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
        help=(
            "Delay in seconds between successful downloads. "
            "Defaults to 0.15."
        ),
    )

    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Number of download attempts per image. Defaults to 3.",
    )

    args = parser.parse_args()

    logger, log_path = configure_logging(args.logs)

    logger.info("Bronzeman image cache started.")
    logger.info("JSON file: %s", args.json)
    logger.info("Image directory: %s", args.output)
    logger.info("Log file: %s", log_path)
    logger.info("Force downloads: %s", args.force)
    logger.info("")

    if not args.json.exists():
        logger.error("Could not find JSON file: %s", args.json)
        raise FileNotFoundError(
            f"Could not find JSON file: {args.json}"
        )

    try:
        data = load_item_data(args.json)
        jobs = collect_download_jobs(
            data,
            args.output,
            logger,
        )
    except Exception:
        logger.exception("Could not load download jobs.")
        raise

    downloaded = 0
    skipped = 0
    failed: list[dict] = []

    logger.info("Found %d valid image entries.", len(jobs))
    logger.info("")

    for current, job in enumerate(jobs, start=1):
        output_path: Path = job["path"]

        item_details = (
            f'[{current}/{len(jobs)}] {job["name"]}'
        )

        if job["itemId"] is not None:
            item_details += f' | itemId={job["itemId"]}'

        if job["uid"]:
            item_details += f' | uid={job["uid"]}'

        if output_path.exists() and not args.force:
            skipped += 1
            logger.debug(
                "Skipped existing: %s -> %s",
                item_details,
                output_path,
            )
            continue

        logger.info("Downloading %s", item_details)
        logger.info("  URL: %s", job["url"])
        logger.info("  Path: %s", output_path)

        try:
            download_file(
                url=job["url"],
                output_path=output_path,
                retries=max(1, args.retries),
            )

            downloaded += 1
            logger.info("  Result: downloaded")
            logger.info("")

            if args.delay > 0:
                time.sleep(args.delay)

        except Exception as error:
            failed_entry = {
                "name": job["name"],
                "uid": job["uid"],
                "itemId": job["itemId"],
                "url": job["url"],
                "path": str(output_path),
                "error": str(error),
            }

            failed.append(failed_entry)

            logger.error(
                "  Result: failed — %s",
                error,
            )
            logger.info("")

    logger.info("Download process complete.")
    logger.info("Downloaded: %d", downloaded)
    logger.info("Skipped existing: %d", skipped)
    logger.info("Failed: %d", len(failed))

    if failed:
        logger.error("")
        logger.error("Failed downloads:")

        for item in failed:
            logger.error("  - %s", item["name"])

            if item["uid"]:
                logger.error("    UID: %s", item["uid"])

            if item["itemId"] is not None:
                logger.error("    Item ID: %s", item["itemId"])

            logger.error("    URL: %s", item["url"])
            logger.error("    Path: %s", item["path"])
            logger.error("    Error: %s", item["error"])

    logger.info("")
    logger.info("Full log written to: %s", log_path)


if __name__ == "__main__":
    main()