import React, { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "./screens/Dashboard.jsx";
import AddRound from "./screens/AddRound.jsx";
import Leaderboard from "./screens/Leaderboard.jsx";
import MapScreen from "./screens/Map.jsx";
import Rounds from "./screens/Rounds.jsx";
import Login from "./screens/Login.jsx";
import SearchPlayers from "./screens/SearchPlayers.jsx";
import PlayerProfile from "./screens/PlayerProfile.jsx";
import AdminSettings from "./screens/AdminSettings.jsx";
import Profile from "./screens/Profile.jsx";
import { getMyRounds, addRound as apiAddRound, deleteRound as apiDeleteRound } from "./lib/api.js";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Profile" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "search", label: "Search players" },
  { id: "map", label: "Map" },
  { id: "add", label: "Add round" },
  { id: "rounds", label: "Rounds" },
  { id: "admin", label: "Admin", adminOnly: true }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const configAvailable = typeof window !== "undefined" && window.birdieConfig;
  const golfApiAvailable = typeof window !== "undefined" && window.golfAPI;

  useEffect(() => {
    let alive = true;
    async function init() {
      if (!configAvailable) {
        setLoading(false);
        return;
      }
      const cfg = await window.birdieConfig.get();
      if (cfg?.token && cfg?.user) {
        setUser(cfg.user);
        setToken(cfg.token);
      }
      setLoading(false);
    }
    init();
    return () => { alive = false; };
  }, [configAvailable]);

  const loadRounds = useCallback(async () => {
    if (!configAvailable || !user) {
      if (golfApiAvailable) {
        const local = await window.golfAPI.listRounds();
        setRounds(local);
      }
      return;
    }
    const cfg = await window.birdieConfig.get();
    if (!cfg?.token) return;
    try {
      const data = await getMyRounds(cfg.token);
      setRounds(data);
    } catch {
      if (golfApiAvailable) {
        const local = await window.golfAPI.listRounds();
        setRounds(local);
      }
    }
  }, [configAvailable, user, golfApiAvailable]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const stats = useMemo(() => summarize(rounds), [rounds]);

  async function handleAdd(round) {
    if (configAvailable && user) {
      const cfg = await window.birdieConfig.get();
      if (cfg?.token) {
        try {
          const created = await apiAddRound(round, cfg.token);
          setRounds((prev) => [created, ...prev]);
          setTab("rounds");
          return;
        } catch {
          // fallback to local
        }
      }
    }
    if (golfApiAvailable) {
      const next = await window.golfAPI.addRound(round);
      setRounds(next);
    }
    setTab("rounds");
  }

  async function handleDelete(id) {
    if (configAvailable && user) {
      const cfg = await window.birdieConfig.get();
      if (cfg?.token) {
        try {
          await apiDeleteRound(id, cfg.token);
          setRounds((prev) => prev.filter((r) => r.id !== id));
          return;
        } catch {
          // fallback to local
        }
      }
    }
    if (golfApiAvailable) {
      const next = await window.golfAPI.deleteRound(id);
      setRounds(next);
    }
  }

  async function handleLogin(u) {
    const cfg = await window.birdieConfig.get();
    setUser(u);
    setToken(cfg?.token ?? null);
    await loadRounds();
  }

  async function handleLogout() {
    if (configAvailable) await window.birdieConfig.logout();
    setUser(null);
    setToken(null);
    setViewingUser(null);
    setRounds([]);
    if (golfApiAvailable) {
      const local = await window.golfAPI.listRounds();
      setRounds(local);
    }
  }

  const active = TABS.find((t) => t.id === tab)?.label ?? "Dashboard";

  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user && configAvailable) {
    return <Login onLogin={handleLogin} />;
  }

  if (viewingUser) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo" aria-hidden />
            <div>
              <h1>Birdie</h1>
              <p>Viewing {viewingUser.username}</p>
            </div>
          </div>
          <nav className="nav">
            <button type="button" onClick={() => setViewingUser(null)}>← Back to app</button>
          </nav>
        </aside>
        <main className="main">
          <PlayerProfile
            user={viewingUser}
            token={token}
            onBack={() => setViewingUser(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <h1>Birdie</h1>
            <p>Golf stats • friendly competition</p>
          </div>
        </div>
        {user ? (
          <div style={{ padding: "0 10px 10px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            Logged in as <strong>{user.username}</strong>
            {user.isAdmin ? <span className="pill" style={{ marginLeft: 6, fontSize: 10 }}>Admin</span> : null}
          </div>
        ) : null}
        <nav className="nav" aria-label="Primary">
          {TABS.filter((t) => !t.adminOnly || user?.isAdmin).map((t) => (
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
        {user ? (
          <button
            className="btn"
            type="button"
            onClick={handleLogout}
            style={{ marginTop: 12, width: "100%" }}
          >
            Log out
          </button>
        ) : null}
        {!configAvailable ? (
          <div style={{ marginTop: 16, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            Running in browser. Log in requires the desktop app.
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
                : tab === "profile"
                  ? "Your profile and stats."
                : tab === "leaderboard"
                  ? "Compare players across rounds."
                : tab === "search"
                  ? "Find friends by username."
                : tab === "map"
                  ? "A map of courses you've played."
                : tab === "add"
                  ? "Log a round in under a minute."
                : tab === "admin"
                  ? "API URL, users, and server controls."
                  : "Review rounds and keep improving."}
            </div>
          </div>
          <span className="pill">{rounds.length} rounds</span>
        </div>

        {tab === "dashboard" ? <Dashboard stats={stats} rounds={rounds} user={user} /> : null}
        {tab === "profile" ? (
          <Profile
            token={token}
            user={user}
            onUserUpdate={async (updated) => {
              setUser(updated);
              if (configAvailable) await window.birdieConfig.set({ user: updated });
            }}
          />
        ) : null}
        {tab === "leaderboard" ? <Leaderboard rounds={rounds} user={user} /> : null}
        {tab === "search" ? (
          <SearchPlayers token={token} onViewUser={setViewingUser} />
        ) : null}
        {tab === "map" ? <MapScreen rounds={rounds} /> : null}
        {tab === "add" ? <AddRound onAdd={handleAdd} user={user} /> : null}
        {tab === "rounds" ? <Rounds rounds={rounds} onDelete={handleDelete} user={user} /> : null}
        {tab === "admin" ? <AdminSettings token={token} configAvailable={configAvailable} /> : null}
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