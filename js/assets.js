export function localImage(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

export function itemImage(fileName) {
  return localImage("images/items", fileName);
}

export function otherImage(fileName) {
  return localImage("images/other", fileName);
}
