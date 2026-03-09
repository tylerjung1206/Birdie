import React, { useEffect, useState } from "react";
import { getMe, updateProfile } from "../lib/api.js";

export default function Profile({ token, user: initialUser, onUserUpdate }) {
  const [profile, setProfile] = useState(initialUser || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [funFact, setFunFact] = useState("");
  const [favoriteClub, setFavoriteClub] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) {
        setProfile(initialUser);
        setLoading(false);
        return;
      }
      try {
        const data = await getMe(token);
        if (!alive) return;
        setProfile(data);
        setAvatar(data.avatar || "");
        setAboutMe(data.aboutMe || "");
        setFunFact(data.funFact || "");
        setFavoriteClub(data.favoriteClub || "");
      } catch {
        if (!alive) return;
        setProfile(initialUser);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [token, initialUser?.id]);

  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar || "");
      setAboutMe(profile.aboutMe || "");
      setFunFact(profile.funFact || "");
      setFavoriteClub(profile.favoriteClub || "");
    }
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile(
        { avatar, aboutMe, funFact, favoriteClub },
        token
      );
      setProfile(updated);
      onUserUpdate?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="grid">
        <div className="card wide">
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card wide">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.2)",
              flexShrink: 0
            }}
          >
            {avatar ? (
              <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 28 }}>
                {profile?.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>
              {profile?.username}
              {profile?.isAdmin ? (
                <span className="pill" style={{ marginLeft: 10, background: "rgba(41,209,127,0.2)", borderColor: "rgba(41,209,127,0.4)" }}>
                  Admin
                </span>
              ) : null}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "4px 0 0" }}>
              {profile?.roundCount ?? 0} rounds
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Profile photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>About me</label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="A few words about you and your golf journey…"
              rows={3}
            />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Fun fact</label>
            <input
              value={funFact}
              onChange={(e) => setFunFact(e.target.value)}
              placeholder="e.g. Hit a hole-in-one in 2019"
            />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Favorite club</label>
            <input
              value={favoriteClub}
              onChange={(e) => setFavoriteClub(e.target.value)}
              placeholder="e.g. 7-iron, Putter"
            />
          </div>
          <div className="actions">
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            {saved ? <span style={{ color: "rgba(41,209,127,0.9)", fontSize: 13 }}>Saved</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
