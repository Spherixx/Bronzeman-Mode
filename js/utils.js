export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function slugifyItemId(value) {
  return String(value ?? "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

export function normalizeCollectionText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeAssetPath(value) {
  try {
    return decodeURIComponent(String(value ?? "")).replace(/\\/g, "/").toLowerCase();
  } catch {
    return String(value ?? "").replace(/\\/g, "/").toLowerCase();
  }
}

export function titleCase(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function uniqueTags(tags) {
  return [...new Set((tags ?? []).map((tag) => String(tag).trim()).filter(Boolean))];
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function withoutTrailingPeriod(value) {
  return String(value ?? "").replace(/\.+$/g, "");
}
