import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

export default function DashboardScreen({ stats, rounds, user }) {
  const recent = useMemo(() => {
    return [...(rounds ?? [])]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [rounds]);

  const courseName = (r) => (r.course && (r.course.name || r.course)) || "—";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avg score</Text>
          <Text style={styles.metric}>{stats?.avgScore ?? "—"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avg putts</Text>
          <Text style={styles.metric}>{stats?.avgPutts ?? "—"}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GIR%</Text>
          <Text style={styles.metric}>{stats?.girPct ?? "—"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fairways%</Text>
          <Text style={styles.metric}>{stats?.fairwayPct ?? "—"}</Text>
        </View>
      </View>
      <View style={[styles.card, styles.wide]}>
        <Text style={styles.cardTitle}>Recent rounds</Text>
        {recent.length ? (
          recent.map((r) => (
            <View key={r.id} style={styles.roundRow}>
              <Text style={styles.roundDate}>{r.date}</Text>
              <Text style={styles.roundCourse}>{courseName(r)}</Text>
              <Text style={styles.roundScore}>{r.score ?? "—"} • {r.putts ?? "—"} putts</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No rounds yet. Add your first round.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  row: { flexDirection: "row", marginBottom: 12 },
  card: {
    flex: 1,
    marginRight: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  wide: { flex: 1, flexBasis: "100%" },
  cardTitle: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  metric: { fontSize: 24, fontWeight: "bold", color: colors.accent },
  roundRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  roundDate: { color: colors.text, fontWeight: "600" },
  roundCourse: { color: colors.muted, fontSize: 13 },
  roundScore: { color: colors.accent2, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 14, marginTop: 10 },
});
