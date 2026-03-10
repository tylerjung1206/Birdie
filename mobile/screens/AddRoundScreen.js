import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { colors } from "../lib/theme";

function toInt(v) {
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export default function AddRoundScreen({ onAdd, user }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [course, setCourse] = useState("");
  const [score, setScore] = useState("");
  const [putts, setPutts] = useState("");
  const [gir, setGir] = useState("");
  const [fairways, setFairways] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = date && String(score).trim().length > 0;

  async function submit() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onAdd({
        date,
        course: course.trim() ? { name: course.trim() } : null,
        score: toInt(score),
        putts: toInt(putts),
        gir: toInt(gir),
        girTotal: 18,
        fairways: toInt(fairways),
        fairwaysTotal: 14,
        notes: notes.trim(),
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Course</Text>
          <TextInput
            style={styles.input}
            value={course}
            onChangeText={setCourse}
            placeholder="e.g. Pebble Beach"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Score (required)</Text>
          <TextInput
            style={styles.input}
            value={score}
            onChangeText={setScore}
            placeholder="e.g. 92"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>Putts</Text>
          <TextInput
            style={styles.input}
            value={putts}
            onChangeText={setPutts}
            placeholder="e.g. 32"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>GIR</Text>
          <TextInput
            style={styles.input}
            value={gir}
            onChangeText={setGir}
            placeholder="e.g. 10"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>Fairways</Text>
          <TextInput
            style={styles.input}
            value={fairways}
            onChangeText={setFairways}
            placeholder="e.g. 8"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notes]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, !canSave && styles.btnDisabled]}
            onPress={submit}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator color="#07160f" />
            ) : (
              <Text style={styles.btnText}>Add round</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginTop: 12 },
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
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#07160f", fontWeight: "600", fontSize: 16 },
});
