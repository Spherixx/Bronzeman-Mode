export function localImage(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

export function itemImage(fileName) {
  return localImage("images/items", fileName);
}

export function otherImage(fileName) {
  return localImage("images/other", fileName);
}

export function imageFallbacks(source) {
  const value = String(source ?? "");
  if (!value) return [];

  const alternateFolder = value.includes("images/items/")
    ? value.replace("images/items/", "images/other/")
    : value.includes("images/other/")
      ? value.replace("images/other/", "images/items/")
      : "";
  const fileVariant = value.includes("_") ? value.replaceAll("_", "%20") : value.replaceAll("%20", "_");
  const alternateVariant = alternateFolder
    ? (alternateFolder.includes("_") ? alternateFolder.replaceAll("_", "%20") : alternateFolder.replaceAll("%20", "_"))
    : "";

  return [...new Set([alternateFolder, fileVariant, alternateVariant])].filter((candidate) => candidate && candidate !== value);
}
