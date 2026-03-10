import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getMe, updateProfile } from "../lib/api";
import { colors } from "../lib/theme";

export default function ProfileScreen({ token, user: initialUser, onUserUpdate, onLogout }) {
  const [profile, setProfile] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProfile(
        { aboutMe, funFact, favoriteClub },
        token
      );
      setProfile(updated);
      onUserUpdate?.(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.username}>{profile?.username}</Text>
        {profile?.isAdmin ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        ) : null}
        <Text style={styles.label}>About me</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={aboutMe}
          onChangeText={setAboutMe}
          placeholder="Tell us about yourself"
          placeholderTextColor={colors.muted}
          multiline
        />
        <Text style={styles.label}>Fun fact</Text>
        <TextInput
          style={styles.input}
          value={funFact}
          onChangeText={setFunFact}
          placeholder="e.g. Hole-in-one at 14"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Favorite club</Text>
        <TextInput
          style={styles.input}
          value={favoriteClub}
          onChangeText={setFavoriteClub}
          placeholder="e.g. 7-iron"
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#07160f" />
          ) : (
            <Text style={styles.btnText}>Save</Text>
          )}
        </TouchableOpacity>
        {onLogout ? (
          <TouchableOpacity
            style={[styles.btn, styles.logoutBtn]}
            onPress={onLogout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  username: { fontSize: 20, fontWeight: "bold", color: colors.text },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(41,209,127,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  adminText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notes: { minHeight: 60 },
  btn: { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  btnPrimary: { backgroundColor: colors.accent },
  btnText: { color: "#07160f", fontWeight: "600", fontSize: 16 },
  logoutBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.danger, marginTop: 12 },
  logoutText: { color: colors.danger, fontWeight: "600", fontSize: 16 },
});
