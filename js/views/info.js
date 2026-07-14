const CHANGELOG_DIRECTORY_URL = "changelogs/";
const CHANGELOG_REPOSITORY_API = "https://api.github.com/repos/Spherixx/Bronzeman-Mode/contents/changelogs";

export function parseChangelogFilename(fileName) {
  const name = String(fileName ?? "").replace(/\.(txt|md)$/i, "");
  const match = name.match(/^(\d{2})(\d{2})(\d{4})\s+(.+)$/);
  if (!match) return null;

  const [, dayText, monthText, yearText, version] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    !version.trim()
  ) return null;

  return {
    fileName,
    version: version.trim(),
    date,
    timestamp: date.getTime(),
    isoDate: `${yearText}-${monthText}-${dayText}`
  };
}

export function createInfoView(ctx) {
  let changelogEntries = null;
  let changelogLoadPromise = null;

  function localChangelogFiles(directoryHtml, baseUrl) {
    const documentRoot = new DOMParser().parseFromString(directoryHtml, "text/html");
    return [...documentRoot.querySelectorAll("a[href]")].map((anchor) => {
      try {
        const url = new URL(anchor.getAttribute("href"), baseUrl);
        const fileName = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
        return parseChangelogFilename(fileName) ? { fileName, url: url.href } : null;
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  async function discoverLocalChangelogs() {
    const response = await fetch(CHANGELOG_DIRECTORY_URL);
    if (!response.ok) return [];
    const directoryHtml = await response.text();
    return localChangelogFiles(directoryHtml, response.url || new URL(CHANGELOG_DIRECTORY_URL, window.location.href).href);
  }

  async function discoverHostedChangelogs() {
    const response = await fetch(CHANGELOG_REPOSITORY_API, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) return [];

    const files = await response.json();
    if (!Array.isArray(files)) return [];
    return files
      .filter((file) => file?.type === "file" && file.download_url && parseChangelogFilename(file.name))
      .map((file) => ({ fileName: file.name, url: file.download_url }));
  }

  async function discoverChangelogs() {
    let files = [];
    try {
      files = await discoverLocalChangelogs();
    } catch {
      files = [];
    }

    if (!files.length) {
      try {
        files = await discoverHostedChangelogs();
      } catch {
        files = [];
      }
    }

    const seen = new Set();
    return files.filter((file) => {
      if (seen.has(file.fileName)) return false;
      seen.add(file.fileName);
      return true;
    });
  }

  function formatChangeHeading(value) {
    return String(value ?? "Changes")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderChangeBody(text) {
    const groups = [];
    let currentGroup = null;

    String(text ?? "").split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      const heading = line.match(/^\/{3,}\s*(.*?)\s*\/{3,}$/);
      if (heading) {
        currentGroup = { title: formatChangeHeading(heading[1]), items: [] };
        groups.push(currentGroup);
        return;
      }

      if (!currentGroup) {
        currentGroup = { title: "Changes", items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(line);
    });

    if (!groups.length) return '<p class="changelog-status">No changes listed.</p>';
    return groups.map((group) => `
      <section class="change-group">
        <h4>${ctx.actions.escapeHtml(group.title)}</h4>
        <ul>
          ${group.items.map((item) => `<li>${ctx.actions.escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `).join("");
  }

  async function loadChangelogs() {
    const files = await discoverChangelogs();
    const results = await Promise.all(files.map(async (file) => {
      const metadata = parseChangelogFilename(file.fileName);
      const response = await fetch(file.url);
      if (!metadata || !response.ok) return null;
      return { ...metadata, text: await response.text() };
    }));

    return results.filter(Boolean).sort((first, second) => {
      return second.timestamp - first.timestamp ||
        second.version.localeCompare(first.version, undefined, { numeric: true });
    });
  }

  function renderLoadedChangelogs(target) {
    if (!changelogEntries.length) {
      target.innerHTML = '<p class="changelog-status">No changelog files found. Add files named DDMMYYYY vX.Y.Z to the changelogs folder.</p>';
      return;
    }

    const dateFormatter = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });

    target.innerHTML = changelogEntries.map((entry) => `
      <article class="changelog-card">
        <header class="changelog-card-header">
          <div>
            <span class="changelog-label">Released</span>
            <time datetime="${entry.isoDate}">${dateFormatter.format(entry.date)}</time>
          </div>
          <span class="changelog-version">${ctx.actions.escapeHtml(entry.version)}</span>
        </header>
        <div class="changelog-body">${renderChangeBody(entry.text)}</div>
      </article>
    `).join("");
  }

  async function renderChangelogs() {
    const target = document.getElementById("changelogList");
    if (!target) return;

    if (changelogEntries) {
      renderLoadedChangelogs(target);
      return;
    }

    if (!changelogLoadPromise) changelogLoadPromise = loadChangelogs();

    try {
      changelogEntries = await changelogLoadPromise;
      renderLoadedChangelogs(target);
    } catch (error) {
      console.warn("Could not load changelogs", error);
      target.innerHTML = '<p class="changelog-status">Changes could not be loaded.</p>';
    }
  }

  return { renderChangelogs };
}
