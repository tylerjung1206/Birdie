import React, { useState } from "react";
import { login, register } from "../lib/api.js";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const configAvailable = typeof window !== "undefined" && window.birdieConfig;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = mode === "login" ? await login(username, password) : await register(username, password);
      await window.birdieConfig.set({ token: data.token, user: data.user });
      onLogin(data.user);
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Something went wrong";
      const isNetworkError = msg === "Failed to fetch" || err?.name === "TypeError";
      setError(
        isNetworkError
          ? "Couldn't connect to the server. Start the backend: cd backend && npm start"
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  if (!configAvailable) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>Birdie</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
            Run the desktop app to log in. Browser preview doesn’t support accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 24 }}>
          <div className="logo" aria-hidden />
          <div>
            <h1>Birdie</h1>
            <p>Golf stats • friendly competition</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dad"
              autoComplete="username"
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>
          {error ? (
            <div style={{ color: "rgba(255,90,106,0.95)", fontSize: 13, marginBottom: 12 }}>{error}</div>
          ) : null}
          <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="btn"
          style={{ marginTop: 16, width: "100%", background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13 }}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
