import React, { useEffect, useMemo, useState } from "react";
import Dashboard from "./screens/Dashboard.jsx";
import AddRound from "./screens/AddRound.jsx";
import Leaderboard from "./screens/Leaderboard.jsx";
import Rounds from "./screens/Rounds.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "add", label: "Add round" },
  { id: "rounds", label: "Rounds" }
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [rounds, setRounds] = useState([]);
  const apiAvailable = typeof window !== "undefined" && window.golfAPI;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiAvailable) return;
      const data = await window.golfAPI.listRounds();
      if (!cancelled) setRounds(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiAvailable]);

  const stats = useMemo(() => summarize(rounds), [rounds]);

  async function handleAdd(round) {
    const next = await window.golfAPI.addRound(round);
    setRounds(next);
    setTab("rounds");
  }

  async function handleDelete(id) {
    const next = await window.golfAPI.deleteRound(id);
    setRounds(next);
  }

  const active = TABS.find((t) => t.id === tab)?.label ?? "Dashboard";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <h1>Birdie</h1>
            <p>Golf stats • trends • friendly competition</p>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-active={t.id === tab}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </nav>

        {!apiAvailable ? (
          <div style={{ marginTop: 16, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            Running in browser preview. Data APIs only work in the desktop app.
          </div>
        ) : null}
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h2>{active}</h2>
            <div className="subtitle">
              {tab === "dashboard"
                ? "Quick look at your recent performance."
                : tab === "leaderboard"
                  ? "Compare players across rounds."
                : tab === "add"
                  ? "Log a round in under a minute."
                  : "Review rounds and keep improving."}
            </div>
          </div>
          <span className="pill">{rounds.length} rounds</span>
        </div>

        {tab === "dashboard" ? <Dashboard stats={stats} rounds={rounds} /> : null}
        {tab === "leaderboard" ? <Leaderboard rounds={rounds} /> : null}
        {tab === "add" ? <AddRound onAdd={handleAdd} /> : null}
        {tab === "rounds" ? <Rounds rounds={rounds} onDelete={handleDelete} /> : null}
      </main>
    </div>
  );
}

function summarize(rounds) {
  if (!rounds?.length) {
    return {
      avgScore: null,
      avgPutts: null,
      girPct: null,
      fairwayPct: null,
      last: null
    };
  }

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

  const last = [...rounds].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  return {
    avgScore: round1(totals.score / n),
    avgPutts: round1(totals.putts / n),
    girPct: totals.maxGir ? Math.round((totals.gir / totals.maxGir) * 100) : null,
    fairwayPct: totals.maxFairways
      ? Math.round((totals.fairways / totals.maxFairways) * 100)
      : null,
    last
  };
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

