import React, { useMemo, useState } from "react";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AddRound({ onAdd }) {
  const [player, setPlayer] = useState("Dad");
  const [date, setDate] = useState(todayISO());
  const [course, setCourse] = useState("");
  const [score, setScore] = useState("");
  const [putts, setPutts] = useState("");
  const [gir, setGir] = useState("");
  const [girTotal, setGirTotal] = useState("18");
  const [fairways, setFairways] = useState("");
  const [fairwaysTotal, setFairwaysTotal] = useState("14");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return Boolean(date) && String(score).trim().length > 0;
  }, [date, score]);

  async function submit(e) {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onAdd({
        player: player.trim() || "Dad",
        date,
        course: course.trim(),
        score: toIntOrNull(score),
        putts: toIntOrNull(putts),
        gir: toIntOrNull(gir),
        girTotal: toIntOrNull(girTotal) ?? 18,
        fairways: toIntOrNull(fairways),
        fairwaysTotal: toIntOrNull(fairwaysTotal) ?? 14,
        notes: notes.trim()
      });
      setCourse("");
      setScore("");
      setPutts("");
      setGir("");
      setFairways("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid">
      <div className="card wide">
        <h3>Round details</h3>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Player</label>
            <input
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              placeholder="e.g. Dad"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
          </div>
          <div className="field">
            <label>Course</label>
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Pebble Beach"
            />
          </div>
          <div className="field">
            <label>Score (required)</label>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 92"
            />
          </div>
          <div className="field">
            <label>Putts</label>
            <input
              value={putts}
              onChange={(e) => setPutts(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 34"
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>GIR (greens in regulation)</label>
            <input
              value={gir}
              onChange={(e) => setGir(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 7"
            />
          </div>
          <div className="field">
            <label>GIR total</label>
            <input
              value={girTotal}
              onChange={(e) => setGirTotal(e.target.value)}
              inputMode="numeric"
              placeholder="18"
            />
          </div>
          <div className="field">
            <label>Fairways hit</label>
            <input
              value={fairways}
              onChange={(e) => setFairways(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 6"
            />
          </div>
          <div className="field">
            <label>Fairways total</label>
            <input
              value={fairwaysTotal}
              onChange={(e) => setFairwaysTotal(e.target.value)}
              inputMode="numeric"
              placeholder="14"
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <div className="field" style={{ gridColumn: "span 12" }}>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering (weather, clubs working, swing thought, etc.)"
              rows={4}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn primary" disabled={!canSave || saving} type="submit">
            {saving ? "Saving…" : "Save round"}
          </button>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, alignSelf: "center" }}>
            Stored locally on this computer.
          </div>
        </div>
      </div>
    </form>
  );
}

function toIntOrNull(v) {
  const n = Number.parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

