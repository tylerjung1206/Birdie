import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { getUser, getUserRounds } from "../lib/api";
import { colors } from "../lib/theme";

export default function PlayerProfileScreen({ userId, token, onBack }) {
  const [user, setUser] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [u, r] = await Promise.all([
          getUser(userId, token),
          getUserRounds(userId, token),
        ]);
        if (!alive) return;
        setUser(u);
        setRounds(r || []);
      } catch {
        if (!alive) return;
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [userId, token]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const courseName = (r) => (r.course && (r.course.name || r.course)) || "—";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.username}>{user?.username}</Text>
        {user?.isAdmin ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        ) : null}
        <Text style={styles.about}>{user?.aboutMe || "No bio yet."}</Text>
        <Text style={styles.roundCount}>{rounds.length} rounds</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent rounds</Text>
      {rounds.slice(0, 10).map((r) => (
        <View key={r.id} style={styles.roundRow}>
          <Text style={styles.date}>{r.date}</Text>
          <Text style={styles.course}>{courseName(r)}</Text>
          <Text style={styles.score}>{r.score ?? "—"}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.accent, fontSize: 16 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  about: { color: colors.muted, marginTop: 12 },
  roundCount: { color: colors.accent2, marginTop: 8, fontSize: 14 },
  sectionTitle: { color: colors.muted, fontSize: 14, marginBottom: 12 },
  roundRow: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  date: { color: colors.text, fontWeight: "600" },
  course: { color: colors.muted, fontSize: 13 },
  score: { color: colors.accent2, fontSize: 14, marginTop: 4 },
});
