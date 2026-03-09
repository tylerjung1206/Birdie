import React, { useMemo } from "react";

export default function Dashboard({ stats, rounds, user }) {
  const recent = useMemo(() => {
    return [...(rounds ?? [])]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [rounds]);

  return (
    <div className="grid">
      <div className="card">
        <h3>Average score</h3>
        <div className="metric">{stats.avgScore ?? "—"}</div>
        <div className="hint">Across all logged rounds</div>
      </div>
      <div className="card">
        <h3>Average putts</h3>
        <div className="metric">{stats.avgPutts ?? "—"}</div>
        <div className="hint">Lower tends to follow better approach shots</div>
      </div>
      <div className="card">
        <h3>GIR%</h3>
        <div className="metric">{stats.girPct ?? "—"}</div>
        <div className="hint">Greens in regulation rate</div>
      </div>
      <div className="card wide">
        <h3>Recent rounds</h3>
        {recent.length ? (
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
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>
            No rounds yet. Add your first round to start seeing trends.
          </div>
        )}
      </div>
    </div>
  );
}

