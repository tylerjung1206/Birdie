import React, { useEffect, useState } from "react";
import { getAdminUsers, setUserAdmin, getAdminStats } from "../lib/api.js";

export default function AdminSettings({ token, configAvailable }) {
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configAvailable) return;
    window.birdieConfig.get().then((c) => setApiUrl(c.apiUrl || ""));
  }, [configAvailable]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [u, s] = await Promise.all([
          getAdminUsers(token),
          getAdminStats(token)
        ]);
        if (!alive) return;
        setUsers(u);
        setStats(s);
      } catch {
        if (!alive) return;
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [token]);

  async function saveApiUrl(e) {
    e.preventDefault();
    if (!configAvailable) return;
    await window.birdieConfig.set({ apiUrl: apiUrl.trim() || "http://localhost:3001" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    setConnectionStatus("checking");
    const base = apiUrl.trim() || "http://localhost:3001";
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus(res.ok ? "ok" : "fail");
    } catch {
      setConnectionStatus("fail");
    }
    setTimeout(() => setConnectionStatus(null), 3000);
  }

  async function toggleAdmin(u) {
    try {
      const updated = await setUserAdmin(u.id, !u.isAdmin, token);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? { ...x, isAdmin: updated.isAdmin } : x)));
    } catch {}
  }

  if (!configAvailable) {
    return (
      <div className="grid">
        <div className="card wide">
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Admin settings require the desktop app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card wide">
        <h3>Admin settings</h3>

        <form onSubmit={saveApiUrl} style={{ marginBottom: 24 }}>
          <div className="field" style={{ marginTop: 10 }}>
            <label>API URL</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 6 }}>
            Backend server address. All users on this device use this URL.
          </p>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn primary" type="submit">Save</button>
            <button className="btn" type="button" onClick={testConnection}>
              {connectionStatus === "checking" ? "Testing…" : connectionStatus === "ok" ? "✓ Connected" : connectionStatus === "fail" ? "✗ Failed" : "Test connection"}
            </button>
            {saved ? <span style={{ color: "rgba(41,209,127,0.9)", fontSize: 13 }}>Saved</span> : null}
          </div>
        </form>

        {stats ? (
          <div style={{ marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span className="pill">{stats.userCount} users</span>
            <span className="pill">{stats.roundCount} rounds</span>
          </div>
        ) : null}

        <h3 style={{ marginTop: 24 }}>Users</h3>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Loading…</p>
        ) : users.length ? (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Rounds</th>
                <th>Admin</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.roundCount}</td>
                  <td>{u.isAdmin ? "Yes" : "—"}</td>
                  <td>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => toggleAdmin(u)}
                      style={{ fontSize: 12 }}
                    >
                      {u.isAdmin ? "Remove admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>No users yet.</p>
        )}
      </div>
    </div>
  );
}
