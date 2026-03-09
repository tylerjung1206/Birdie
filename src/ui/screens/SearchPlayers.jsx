import React, { useMemo, useState } from "react";
import { searchUsers, getUser, getUserRounds } from "../lib/api.js";

export default function SearchPlayers({ token, onViewUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounced(query, 200);

  React.useEffect(() => {
    let alive = true;
    async function run() {
      const q = debouncedQuery.trim().toLowerCase();
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const users = await searchUsers(q, token);
        if (!alive) return;
        setResults(users);
      } catch (e) {
        if (!alive) return;
        setError(e?.data?.error || e?.message || "Search failed");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [debouncedQuery, token]);

  return (
    <div className="grid">
      <div className="card wide">
        <h3>Search players</h3>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          Find friends by username to compare stats.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <div className="field" style={{ gridColumn: "span 12" }}>
            <label>Username</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type at least 2 characters…"
            />
          </div>
        </div>
        {loading ? <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>Searching…</div> : null}
        {error ? <div style={{ color: "rgba(255,90,106,0.95)", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
        {results.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td style={{ width: 1 }}>
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => onViewUser(u)}
                      >
                        View profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : debouncedQuery.trim().length >= 2 && !loading ? (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 12 }}>
            No players found. Try a different username.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function useDebounced(value, delayMs) {
  const [v, setV] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
