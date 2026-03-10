import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { searchUsers } from "../lib/api";
import { colors } from "../lib/theme";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPlayersScreen({ token, onViewUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let alive = true;
    async function run() {
      const q = debouncedQuery.trim().toLowerCase();
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const users = await searchUsers(q, token);
        if (!alive) return;
        setResults(users);
      } catch (e) {
        if (!alive) return;
        setError(e?.data?.error || e?.message || "Search failed");
        setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [debouncedQuery, token]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Type at least 2 characters…"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList
        data={results}
        keyExtractor={(u) => String(u.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: u }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onViewUser(u)}
            activeOpacity={0.7}
          >
            <Text style={styles.username}>{u.username}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 16 },
  search: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  loader: { marginTop: 10 },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  list: { padding: 16, paddingTop: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  username: { color: colors.text, fontWeight: "600" },
  arrow: { color: colors.muted },
});
