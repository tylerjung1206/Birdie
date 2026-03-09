import React, { useMemo, useState } from "react";

export default function Leaderboard({ rounds, user }) {
  const [metric, setMetric] = useState("avgScore");
  const defaultPlayer = user?.username || "Dad";

  const rows = useMemo(() => {
    const byPlayer = new Map();

    for (const r of rounds ?? []) {
      const player = (r.player || defaultPlayer).trim() || defaultPlayer;
      if (!byPlayer.has(player)) {
        byPlayer.set(player, {
          player,
          rounds: 0,
          totalScore: 0,
          scoredRounds: 0,
          bestScore: null,
          totalPutts: 0,
          puttRounds: 0,
          gir: 0,
          girTotal: 0,
          fairways: 0,
          fairwaysTotal: 0
        });
      }
      const p = byPlayer.get(player);
      p.rounds += 1;

      if (isNum(r.score)) {
        p.totalScore += r.score;
        p.scoredRounds += 1;
        p.bestScore = p.bestScore == null ? r.score : Math.min(p.bestScore, r.score);
      }
      if (isNum(r.putts)) {
        p.totalPutts += r.putts;
        p.puttRounds += 1;
      }
      if (isNum(r.gir)) p.gir += r.gir;
      p.girTotal += isNum(r.girTotal) ? r.girTotal : 18;
      if (isNum(r.fairways)) p.fairways += r.fairways;
      p.fairwaysTotal += isNum(r.fairwaysTotal) ? r.fairwaysTotal : 14;
    }

    const list = [...byPlayer.values()].map((p) => {
      const avgScore = p.scoredRounds ? round1(p.totalScore / p.scoredRounds) : null;
      const avgPutts = p.puttRounds ? round1(p.totalPutts / p.puttRounds) : null;
      const girPct = p.girTotal ? Math.round((p.gir / p.girTotal) * 100) : null;
      const fairwayPct = p.fairwaysTotal ? Math.round((p.fairways / p.fairwaysTotal) * 100) : null;

      return {
        player: p.player,
        rounds: p.rounds,
        avgScore,
        bestScore: p.bestScore,
        avgPutts,
        girPct,
        fairwayPct
      };
    });

    const sorted = [...list].sort((a, b) => compareRows(a, b, metric));
    return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [rounds, metric]);

  return (
    <div className="grid">
      <div className="card wide">
        <h3>Leaderboard</h3>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Sort by</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="avgScore">Average score (lower is better)</option>
              <option value="bestScore">Best score (lower is better)</option>
              <option value="avgPutts">Average putts (lower is better)</option>
              <option value="girPct">GIR% (higher is better)</option>
              <option value="fairwayPct">Fairways% (higher is better)</option>
              <option value="rounds">Rounds played (higher is better)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {rows.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Rounds</th>
                  <th>Avg score</th>
                  <th>Best</th>
                  <th>Avg putts</th>
                  <th>GIR%</th>
                  <th>Fairways%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.player}>
                    <td>{r.rank}</td>
                    <td>{r.player}</td>
                    <td>{r.rounds}</td>
                    <td>{r.avgScore ?? "—"}</td>
                    <td>{r.bestScore ?? "—"}</td>
                    <td>{r.avgPutts ?? "—"}</td>
                    <td>{r.girPct ?? "—"}</td>
                    <td>{r.fairwayPct ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              No rounds yet. Add rounds for multiple players to compare.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function compareRows(a, b, metric) {
  const lowerIsBetter = metric === "avgScore" || metric === "bestScore" || metric === "avgPutts";
  const av = a[metric];
  const bv = b[metric];

  // numbers first, then nulls
  if (av == null && bv == null) return a.player.localeCompare(b.player);
  if (av == null) return 1;
  if (bv == null) return -1;

  if (av === bv) return a.player.localeCompare(b.player);
  return lowerIsBetter ? av - bv : bv - av;
}

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

