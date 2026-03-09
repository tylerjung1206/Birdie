import React, { useEffect, useMemo, useState } from "react";
import { getUser, getUserRounds } from "../lib/api.js";

function summarize(rounds) {
  if (!rounds?.length) return { avgScore: null, avgPutts: null, girPct: null, fairwayPct: null };
  const n = rounds.length;
  const totals = rounds.reduce(
    (acc, r) => {
      acc.score += toNum(r.score);
      acc.putts += toNum(r.putts);
      acc.gir += toNum(r.gir);
      acc.fairways += toNum(r.fairways);
      acc.maxGir += toNum(r.girTotal ?? 18);
      acc.maxFairways += toNum(r.fairwaysTotal ?? 14);
      return acc;
    },
    { score: 0, putts: 0, gir: 0, fairways: 0, maxGir: 0, maxFairways: 0 }
  );
  return {
    avgScore: round1(totals.score / n),
    avgPutts: round1(totals.putts / n),
    girPct: totals.maxGir ? Math.round((totals.gir / totals.maxGir) * 100) : null,
    fairwayPct: totals.maxFairways ? Math.round((totals.fairways / totals.maxFairways) * 100) : null
  };
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

export default function PlayerProfile({ user, token, onBack }) {
  const [profile, setProfile] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [p, r] = await Promise.all([
          getUser(user.id, token),
          getUserRounds(user.id, token)
        ]);
        if (!alive) return;
        setProfile(p);
        setRounds(r);
      } catch (e) {
        if (!alive) return;
        setError(e?.data?.error || e?.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [user.id, token]);

  const stats = useMemo(() => summarize(rounds), [rounds]);
  const recent = useMemo(() => [...rounds].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10), [rounds]);

  if (loading) {
    return (
      <div className="grid">
        <div className="card wide">
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid">
        <div className="card wide">
          <p style={{ color: "rgba(255,90,106,0.95)" }}>{error}</p>
          <button className="btn" onClick={onBack} style={{ marginTop: 12 }}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card wide">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button className="btn" type="button" onClick={onBack}>← Back</button>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              flexShrink: 0
            }}
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 18 }}>
                {(profile?.username ?? user.username)?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>
              {profile?.username ?? user.username}
              {profile?.isAdmin ? (
                <span className="pill" style={{ marginLeft: 8, fontSize: 11, background: "rgba(41,209,127,0.2)" }}>Admin</span>
              ) : null}
            </h3>
            <span className="pill">{rounds.length} rounds</span>
          </div>
        </div>

        {(profile?.aboutMe || profile?.funFact || profile?.favoriteClub) ? (
          <div style={{ marginBottom: 20, padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            {profile?.aboutMe ? (
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.9)" }}>{profile.aboutMe}</p>
            ) : null}
            {profile?.funFact ? (
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                <strong>Fun fact:</strong> {profile.funFact}
              </p>
            ) : null}
            {profile?.favoriteClub ? (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                <strong>Favorite club:</strong> {profile.favoriteClub}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid" style={{ marginBottom: 20 }}>
          <div className="card">
            <h3>Avg score</h3>
            <div className="metric">{stats.avgScore ?? "—"}</div>
          </div>
          <div className="card">
            <h3>Avg putts</h3>
            <div className="metric">{stats.avgPutts ?? "—"}</div>
          </div>
          <div className="card">
            <h3>GIR%</h3>
            <div className="metric">{stats.girPct ?? "—"}</div>
          </div>
          <div className="card">
            <h3>Fairways%</h3>
            <div className="metric">{stats.fairwayPct ?? "—"}</div>
          </div>
        </div>

        <h3>Recent rounds</h3>
        {recent.length ? (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Date</th>
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
                  <td>{(r.course && (r.course.name || r.course)) || "—"}</td>
                  <td>{r.score ?? "—"}</td>
                  <td>{r.putts ?? "—"}</td>
                  <td>{r.gir ?? "—"} / {r.girTotal ?? 18}</td>
                  <td>{r.fairways ?? "—"} / {r.fairwaysTotal ?? 14}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>No rounds yet.</p>
        )}
      </div>
    </div>
  );
}
