import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

const METRICS = [
  { id: "avgScore", label: "Avg score" },
  { id: "bestScore", label: "Best score" },
  { id: "avgPutts", label: "Avg putts" },
  { id: "girPct", label: "GIR%" },
  { id: "fairwayPct", label: "Fairways%" },
  { id: "rounds", label: "Rounds" },
];

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export default function LeaderboardScreen({ rounds, user }) {
  const [metric, setMetric] = useState("avgScore");
  const defaultPlayer = user?.username || "Dad";

  const rows = useMemo(() => {
    const byPlayer = new Map();
    for (const r of rounds ?? []) {
      const player = (r.player || defaultPlayer).trim() || defaultPlayer;
      if (!byPlayer.has(player)) {
        byPlayer.set(player, {
          player,
          rounds: 0,
          totalScore: 0,
          scoredRounds: 0,
          bestScore: null,
          totalPutts: 0,
          puttRounds: 0,
          gir: 0,
          girTotal: 0,
          fairways: 0,
          fairwaysTotal: 0,
        });
      }
      const p = byPlayer.get(player);
      p.rounds += 1;
      if (isNum(r.score)) {
        p.totalScore += r.score;
        p.scoredRounds += 1;
        p.bestScore = p.bestScore == null ? r.score : Math.min(p.bestScore, r.score);
      }
      if (isNum(r.putts)) {
        p.totalPutts += r.putts;
        p.puttRounds += 1;
      }
      if (isNum(r.gir)) p.gir += r.gir;
      p.girTotal += isNum(r.girTotal) ? r.girTotal : 18;
      if (isNum(r.fairways)) p.fairways += r.fairways;
      p.fairwaysTotal += isNum(r.fairwaysTotal) ? r.fairwaysTotal : 14;
    }

    const list = [...byPlayer.values()].map((p) => {
      const avgScore = p.scoredRounds ? round1(p.totalScore / p.scoredRounds) : null;
      const avgPutts = p.puttRounds ? round1(p.totalPutts / p.puttRounds) : null;
      const girPct = p.girTotal ? Math.round((p.gir / p.girTotal) * 100) : null;
      const fairwayPct = p.fairwaysTotal ? Math.round((p.fairways / p.fairwaysTotal) * 100) : null;
      return {
        player: p.player,
        rounds: p.rounds,
        avgScore,
        bestScore: p.bestScore,
        avgPutts,
        girPct,
        fairwayPct,
      };
    });

    const lowerIsBetter = ["avgScore", "bestScore", "avgPutts"].includes(metric);
    const sorted = [...list].sort((a, b) => {
      const av = a[metric];
      const bv = b[metric];
      if (av == null && bv == null) return a.player.localeCompare(b.player);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return a.player.localeCompare(b.player);
      return lowerIsBetter ? av - bv : bv - av;
    });
    return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [rounds, metric, defaultPlayer]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.metricRow}>
        {METRICS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.metricBtn, metric === m.id && styles.metricBtnActive]}
            onPress={() => setMetric(m.id)}
          >
            <Text style={[styles.metricBtnText, metric === m.id && styles.metricBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {rows.length ? (
        rows.map((r) => (
          <View key={r.player} style={styles.row}>
            <Text style={styles.rank}>#{r.rank}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.player}>{r.player}</Text>
              <Text style={styles.stats}>
                {r.rounds} rounds • Avg {r.avgScore ?? "—"} • Best {r.bestScore ?? "—"}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No rounds yet. Add rounds to compare.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  metricRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  metricBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  metricBtnText: { color: colors.muted, fontSize: 12 },
  metricBtnTextActive: { color: "#07160f", fontWeight: "600" },
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
  rank: { color: colors.accent, fontWeight: "bold", marginRight: 12, fontSize: 16 },
  rowMain: { flex: 1 },
  player: { color: colors.text, fontWeight: "600" },
  stats: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
});
