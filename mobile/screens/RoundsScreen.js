import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { colors } from "../lib/theme";

export default function RoundsScreen({ rounds, onDelete, user }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = [...(rounds ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!q) return items;
    return items.filter((r) => {
      const course = (r.course && (r.course.name || r.course)) ?? "";
      return (
        String(user?.username || "").toLowerCase().includes(q) ||
        String(course).toLowerCase().includes(q) ||
        String(r.date ?? "").toLowerCase().includes(q) ||
        String(r.score ?? "").toLowerCase().includes(q)
      );
    });
  }, [rounds, query, user]);

  function handleDelete(id) {
    Alert.alert("Delete round", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(id) },
    ]);
  }

  const courseName = (r) => (r.course && (r.course.name || r.course)) || "—";

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Filter by course, date, score…"
          placeholderTextColor={colors.muted}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No rounds match your filter.</Text>
        }
        renderItem={({ item: r }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.date}>{r.date}</Text>
              <Text style={styles.course}>{courseName(r)}</Text>
              <Text style={styles.score}>
                {r.score ?? "—"} • {r.putts ?? "—"} putts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(r.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 16, paddingBottom: 0 },
  search: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowMain: { flex: 1 },
  date: { color: colors.text, fontWeight: "600" },
  course: { color: colors.muted, fontSize: 13 },
  score: { color: colors.accent2, fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { color: colors.danger, fontSize: 14 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
});
