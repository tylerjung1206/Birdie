import React, { useMemo, useState } from "react";

export default function Rounds({ rounds, onDelete, user }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = [...(rounds ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!q) return items;
    return items.filter((r) => {
      return (
        String(r.player || user?.username || "").toLowerCase().includes(q) ||
        String((r.course && (r.course.name || r.course)) ?? "").toLowerCase().includes(q) ||
        String(r.date ?? "").toLowerCase().includes(q) ||
        String(r.score ?? "").toLowerCase().includes(q)
      );
    });
  }, [rounds, query, user]);

  return (
    <div className="grid">
      <div className="card wide">
        <h3>All rounds</h3>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field" style={{ gridColumn: "span 12" }}>
            <label>Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by course, date, score…"
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {filtered.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Player</th>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Putts</th>
                  <th>GIR</th>
                  <th>Fairways</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.player || user?.username || "—"}</td>
                    <td>{(r.course && (r.course.name || r.course)) || "—"}</td>
                    <td>{r.score ?? "—"}</td>
                    <td>{r.putts ?? "—"}</td>
                    <td>
                      {r.gir ?? "—"} / {r.girTotal ?? 18}
                    </td>
                    <td>
                      {r.fairways ?? "—"} / {r.fairwaysTotal ?? 14}
                    </td>
                    <td style={{ width: 1, whiteSpace: "nowrap" }}>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => onDelete(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              No rounds match your filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

