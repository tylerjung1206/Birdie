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
import { getConfig, setConfig, getAdminUsers, setUserAdmin, getAdminStats } from "../lib/api";
import { colors } from "../lib/theme";

export default function AdminSettingsScreen({ token }) {
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig().then((c) => setApiUrl(c.apiUrl || ""));
  }, []);

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
          getAdminStats(token),
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

  async function saveApiUrl() {
    let url = apiUrl.trim() || "https://birdie-production-ec4b.up.railway.app";
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    await setConfig({ apiUrl: url });
    setApiUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    setConnectionStatus("checking");
    const base = apiUrl.trim() || "https://birdie-production-ec4b.up.railway.app";
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
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
      setUsers((prev) =>
        prev.map((x) => (x.id === updated.id ? { ...x, isAdmin: updated.isAdmin } : x))
      );
    } catch {}
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
        <Text style={styles.title}>Admin settings</Text>
        <Text style={styles.label}>API URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="https://..."
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveApiUrl}>
            <Text style={styles.btnText}>{saved ? "Saved!" : "Save"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={testConnection}>
            <Text style={styles.btnTextLight}>
              {connectionStatus === "checking"
                ? "Checking…"
                : connectionStatus === "ok"
                  ? "OK"
                  : connectionStatus === "fail"
                    ? "Failed"
                    : "Test"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {stats ? (
        <View style={styles.card}>
          <Text style={styles.title}>Server stats</Text>
          <Text style={styles.stats}>
            {stats.userCount} users • {stats.roundCount} rounds
          </Text>
        </View>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.title}>Users</Text>
        {users.map((u) => (
          <View key={u.id} style={styles.userRow}>
            <View style={styles.userMain}>
              <Text style={styles.username}>{u.username}</Text>
              <Text style={styles.userMeta}>
                {u.roundCount} rounds {u.isAdmin ? "• Admin" : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.smallBtn, u.isAdmin && styles.smallBtnDanger]}
              onPress={() => toggleAdmin(u)}
            >
              <Text style={styles.smallBtnText}>
                {u.isAdmin ? "Remove admin" : "Make admin"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", marginTop: 12 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", marginRight: 12 },
  btnPrimary: { backgroundColor: colors.accent },
  btnText: { color: "#07160f", fontWeight: "600" },
  btnTextLight: { color: colors.text },
  stats: { color: colors.muted },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  userMain: { flex: 1 },
  username: { color: colors.text, fontWeight: "600" },
  userMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  smallBtnDanger: { backgroundColor: colors.danger },
  smallBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
