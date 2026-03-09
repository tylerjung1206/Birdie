import React, { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons with bundlers
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow
});

export default function MapScreen({ rounds }) {
  const [playerFilter, setPlayerFilter] = useState("All");

  const players = useMemo(() => {
    const set = new Set();
    for (const r of rounds ?? []) set.add((r.player || "Dad").trim() || "Dad");
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rounds]);

  const places = useMemo(() => {
    const key = (c) => {
      if (!c) return null;
      if (c.source === "osm" && c.osmType && c.osmId) return `osm:${c.osmType}:${c.osmId}`;
      if (typeof c.lat === "number" && typeof c.lng === "number") return `ll:${c.lat},${c.lng}:${c.name}`;
      return `name:${c.name}`;
    };

    const map = new Map();
    for (const r of rounds ?? []) {
      const p = (r.player || "Dad").trim() || "Dad";
      if (playerFilter !== "All" && p !== playerFilter) continue;
      const c = normalizeCourse(r.course);
      if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") continue;
      const k = key(c);
      if (!k) continue;
      if (!map.has(k)) {
        map.set(k, { ...c, visits: 1, players: new Set([p]) });
      } else {
        const it = map.get(k);
        it.visits += 1;
        it.players.add(p);
      }
    }
    return [...map.values()]
      .map((x) => ({ ...x, players: Array.from(x.players).sort((a, b) => a.localeCompare(b)) }))
      .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
  }, [rounds, playerFilter]);

  const center = useMemo(() => {
    if (!places.length) return { lat: 39.5, lng: -98.35 }; // US-ish default
    const avg = places.reduce(
      (acc, p) => {
        acc.lat += p.lat;
        acc.lng += p.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return { lat: avg.lat / places.length, lng: avg.lng / places.length };
  }, [places]);

  return (
    <div className="grid">
      <div className="card wide">
        <h3>Places golfed</h3>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Player</label>
            <select value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
              {players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Summary</label>
            <input value={`${places.length} mapped courses`} readOnly />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 460,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.14)"
            }}
          >
            <MapContainer center={[center.lat, center.lng]} zoom={5} style={{ height: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {places.map((p) => (
                <Marker key={`${p.source ?? "x"}:${p.osmType ?? "t"}:${p.osmId ?? p.name}`} position={[p.lat, p.lng]}>
                  <Popup>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                    {p.address ? <div style={{ opacity: 0.85, marginBottom: 6 }}>{p.address}</div> : null}
                    <div style={{ opacity: 0.85 }}>
                      Visits: {p.visits}
                      <br />
                      Players: {p.players.join(", ")}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Visits</th>
                <th>Players</th>
                <th>Coords</th>
              </tr>
            </thead>
            <tbody>
              {places.slice(0, 12).map((p) => (
                <tr key={`${p.source ?? "x"}:${p.osmType ?? "t"}:${p.osmId ?? p.name}:row`}>
                  <td>{p.name}</td>
                  <td>{p.visits}</td>
                  <td>{p.players.join(", ")}</td>
                  <td style={{ color: "rgba(255,255,255,0.75)" }}>
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {places.length > 12 ? (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 }}>
              Showing first 12 in the table; all are pinned on the map.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function normalizeCourse(course) {
  if (!course) return null;
  if (typeof course === "string") return { name: course };
  if (typeof course === "object") return course;
  return null;
}

