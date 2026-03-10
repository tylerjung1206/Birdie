import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

export default function MapScreen({ rounds }) {
  const courses = [...new Set((rounds ?? []).map((r) => {
    const c = r.course;
    return c && (c.name || c) ? String(c.name || c) : null;
  }).filter(Boolean))];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses played</Text>
      {courses.length ? (
        courses.map((name) => (
          <View key={name} style={styles.row}>
            <Text style={styles.courseName}>{name}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No courses yet. Add rounds to see them here.</Text>
      )}
      <Text style={styles.note}>Map view coming soon. Courses listed above.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 },
  row: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  courseName: { color: colors.text },
  empty: { color: colors.muted, marginTop: 20 },
  note: { color: colors.muted, fontSize: 12, marginTop: 24 },
});
