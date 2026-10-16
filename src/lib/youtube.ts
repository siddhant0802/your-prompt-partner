/** Strict YouTube link → privacy-enhanced embed URL. Returns null for anything else. */
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"]);
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  let id: string | null | undefined = null;
  if (host.endsWith("youtu.be")) id = parts[0];
  else if (parts[0] === "watch") id = u.searchParams.get("v");
  else if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") id = parts[1];
  return id && ID.test(id) ? id : null;
}

export function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
