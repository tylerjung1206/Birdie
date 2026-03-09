import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bboxFromPosition, searchGolfCourses } from "../lib/overpass.js";

export default function CourseAutocomplete({ value, onChange, onPick }) {
  const [text, setText] = useState(value?.name ?? "");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bbox, setBbox] = useState(null);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setText(value?.name ?? "");
  }, [value?.name]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setBbox(bboxFromPosition(pos, 120)),
      () => {},
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 1500 }
    );
  }, []);

  const debouncedQuery = useDebounced(text, 100);
  const searchEnabled = useMemo(() => debouncedQuery.trim().length >= 2, [debouncedQuery]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setError("");
      if (!searchEnabled) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const results = await searchGolfCourses({
          query: debouncedQuery,
          bbox,
          limit: 10,
          signal: controller.signal
        });
        if (!alive) return;
        setItems(results);
        setOpen(true);
      } catch (e) {
        if (!alive) return;
        if (String(e?.name) === "AbortError") return;
        setError("Couldn’t fetch courses. Try again in a moment.");
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [debouncedQuery, bbox, searchEnabled]);

  const handleClickOutside = useCallback((e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  function handlePick(it) {
    setText(it.name);
    setOpen(false);
    onPick?.(it);
  }

  const showDropdown = open && (items.length > 0 || loading);
  const showEmptyHint = open && !loading && searchEnabled && items.length === 0;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          setOpen(true);
          onChange?.(next);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing a golf course name…"
      />
      <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="pill" style={{ fontSize: 11 }}>
          OpenStreetMap
        </span>
        {loading ? (
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Searching…</span>
        ) : null}
        {error ? <span style={{ color: "rgba(255,180,180,0.95)", fontSize: 12 }}>{error}</span> : null}
      </div>

      {showDropdown ? (
        <div
          className="course-dropdown"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 8px)",
            background: "rgba(8, 22, 15, 0.98)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            zIndex: 50
          }}
          role="listbox"
        >
          {loading && items.length === 0 ? (
            <div style={{ padding: 16, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              Searching…
            </div>
          ) : items.length > 0 ? (
            items.map((it) => (
              <button
                key={`${it.osmType}:${it.osmId}`}
                type="button"
                onClick={() => handlePick(it)}
                className="course-dropdown-item"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  {it.address || `${it.lat?.toFixed(4)}, ${it.lng?.toFixed(4)}`}
                </div>
              </button>
            ))
          ) : null}
        </div>
      ) : null}

      {showEmptyHint ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 8px)",
            padding: 12,
            background: "rgba(8, 22, 15, 0.98)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 14,
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            zIndex: 50
          }}
        >
          No golf courses found. Try a different name.
        </div>
      ) : null}
    </div>
  );
}

function useDebounced(value, delayMs) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
