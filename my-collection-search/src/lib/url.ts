export function cleanSoundcloudUrl(url?: string) {
  if (!url) return url;
  try {
    const urlObj = new URL(url);
    urlObj.search = "";
    urlObj.hash = "";
    return urlObj.toString();
  } catch {
    return url;
  }
}
