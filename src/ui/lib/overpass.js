const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URLS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

const USER_AGENT = "BirdieGolfTracker/1.0";

/**
 * Search OSM for golf courses by name.
 * Nominatim first (fast ~200–400ms), Overpass fallback when no results.
 */
export async function searchGolfCourses({ query, bbox, limit = 10, signal }) {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];

  let results = await searchNominatim(q, limit, signal).catch(() => []);
  if (results.length === 0) {
    results = await searchOverpass(q, bbox, limit, signal).catch(() => []);
  }

  const deduped = dedupeByName(results);
  const qLower = q.toLowerCase();
  return deduped
    .map((it) => ({ it, score: scoreName(it.name, qLower) }))
    .sort((a, b) => a.score - b.score || a.it.name.localeCompare(b.it.name))
    .slice(0, limit)
    .map((x) => x.it);
}

/** Nominatim: fast name search, filter to golf courses only */
async function searchNominatim(q, limit, signal) {
  const params = new URLSearchParams({
    q: `golf course ${q}`,
    format: "jsonv2",
    limit: String(limit),
    addressdetails: "1"
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items = (Array.isArray(data) ? data : [])
    .filter((r) => {
      const t = (r.type || "").toLowerCase();
      const c = (r.category || r.class || "").toLowerCase();
      return t === "golf_course" || (c === "leisure" && t.includes("golf"));
    })
    .map((r) => {
      const name =
        r.name ||
        r.address?.golf_course ||
        r.address?.leisure ||
        r.display_name?.split(",")?.[0]?.trim() ||
        "Golf Course";
      return {
        source: "nominatim",
        osmType: r.osm_type || "node",
        osmId: r.osm_id ?? r.place_id,
        name,
        address: formatNominatimAddress(r.address),
        lat: Number(r.lat),
        lng: Number(r.lon)
      };
    })
    .filter((x) => isFiniteNum(x.lat) && isFiniteNum(x.lng));
  return items;
}

function formatNominatimAddress(addr) {
  if (!addr || typeof addr !== "object") return "";
  const parts = [
    addr.road,
    addr.city || addr.town || addr.village || addr.municipality,
    addr.state || addr.county,
    addr.postcode,
    addr.country
  ].filter(Boolean);
  return parts.join(", ");
}

/** Overpass: strict golf_course tag, broader coverage */
async function searchOverpass(q, bbox, limit, signal) {
  const safe = escapeOverpassRegex(q);
  const box = bbox ?? DEFAULT_US_BBOX;

  const overpass = `[out:json][timeout:8];
(
  node["leisure"="golf_course"]["name"~"${safe}",i](${box.s},${box.w},${box.n},${box.e});
  way["leisure"="golf_course"]["name"~"${safe}",i](${box.s},${box.w},${box.n},${box.e});
  relation["leisure"="golf_course"]["name"~"${safe}",i](${box.s},${box.w},${box.n},${box.e});
);
out center tags ${Math.min(25, limit * 2)};`;

  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: overpass,
        headers: { "content-type": "text/plain;charset=UTF-8" },
        signal
      });
      if (!res.ok) continue;
      const data = await res.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      return elements.map((el) => toCourse(el)).filter(Boolean);
    } catch {
      continue;
    }
  }
  return [];
}

export function bboxFromPosition(pos, kmRadius = 80) {
  const lat = pos?.coords?.latitude;
  const lng = pos?.coords?.longitude;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) return null;
  const dLat = kmRadius / 110.574;
  const dLng = kmRadius / (111.32 * Math.cos((lat * Math.PI) / 180));
  return { s: lat - dLat, w: lng - dLng, n: lat + dLat, e: lng + dLng };
}

const DEFAULT_US_BBOX = {
  s: 24.4, w: -125, n: 49.4, e: -66.9
};

function toCourse(el) {
  const tags = el?.tags ?? {};
  const name = tags.name?.trim?.();
  if (!name) return null;
  const lat = isFiniteNum(el.lat) ? el.lat : isFiniteNum(el.center?.lat) ? el.center.lat : null;
  const lng = isFiniteNum(el.lon) ? el.lon : isFiniteNum(el.center?.lon) ? el.center.lon : null;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) return null;
  const address = formatAddress(tags);
  return { source: "osm", osmType: el.type, osmId: el.id, name, address, lat, lng };
}

function formatAddress(tags) {
  const parts = [];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  if (street) parts.push(street);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  if (tags["addr:country"]) parts.push(tags["addr:country"]);
  return parts.join(", ");
}

function escapeOverpassRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreName(name, qLower) {
  const n = String(name).toLowerCase();
  if (n === qLower) return 0;
  if (n.startsWith(qLower)) return 1;
  if (n.includes(qLower)) return 2;
  return 3;
}

function dedupeByName(items) {
  const seen = new Set();
  return items.filter((it) => {
    const k = `${it.name}|${it.lat?.toFixed(4)}|${it.lng?.toFixed(4)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function isFiniteNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
