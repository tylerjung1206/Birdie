import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getConfig, setConfig, getMyRounds, addRound, deleteRound } from "./lib/api";
import { colors } from "./lib/theme";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{String(this.state.error?.message || this.state.error)}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AddRoundScreen from "./screens/AddRoundScreen";
import RoundsScreen from "./screens/RoundsScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import MapScreen from "./screens/MapScreen";
import SearchPlayersScreen from "./screens/SearchPlayersScreen";
import PlayerProfileScreen from "./screens/PlayerProfileScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminSettingsScreen from "./screens/AdminSettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function summarize(rounds) {
  if (!rounds?.length) {
    return { avgScore: null, avgPutts: null, girPct: null, fairwayPct: null, last: null };
  }
  const n = rounds.length;
  const totals = rounds.reduce(
    (acc, r) => {
      acc.score += toNum(r.score);
      acc.putts += toNum(r.putts);
      acc.gir += toNum(r.gir);
      acc.fairways += toNum(r.fairways);
      acc.maxGir += toNum(r.girTotal ?? 18);
      acc.maxFairways += toNum(r.fairwaysTotal ?? 14);
      return acc;
    },
    { score: 0, putts: 0, gir: 0, fairways: 0, maxGir: 0, maxFairways: 0 }
  );
  const last = [...rounds].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return {
    avgScore: round1(totals.score / n),
    avgPutts: round1(totals.putts / n),
    girPct: totals.maxGir ? Math.round((totals.gir / totals.maxGir) * 100) : null,
    fairwayPct: totals.maxFairways
      ? Math.round((totals.fairways / totals.maxFairways) * 100)
      : null,
    last,
  };
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function MainTabs({ user, token, rounds, onAdd, onDelete, onLogout, onViewUser, onUserUpdate }) {
  const stats = useMemo(() => summarize(rounds), [rounds]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ title: "Birdie" }}
      >
        {() => <DashboardScreen stats={stats} rounds={rounds} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Rounds" options={{ title: "Rounds" }}>
        {() => <RoundsScreen rounds={rounds} onDelete={onDelete} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Add" options={{ title: "Add" }}>
        {() => <AddRoundScreen onAdd={onAdd} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard">
        {() => <LeaderboardScreen rounds={rounds} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Map">
        {() => <MapScreen rounds={rounds} />}
      </Tab.Screen>
      <Tab.Screen name="Search" options={{ title: "Search" }}>
        {() => <SearchPlayersScreen token={token} onViewUser={onViewUser} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: "Me" }}>
        {() => (
          <ProfileScreen
            token={token}
            user={user}
            onUserUpdate={onUserUpdate}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
      {user?.isAdmin ? (
        <Tab.Screen name="Admin" options={{ title: "Admin" }}>
          {() => <AdminSettingsScreen token={token} />}
        </Tab.Screen>
      ) : null}
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState(null);

  useEffect(() => {
    getConfig().then((c) => {
      if (c?.token && c?.user) {
        setUser(c.user);
        setToken(c.token);
      }
      setLoading(false);
    });
  }, []);

  const loadRounds = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await getMyRounds(token);
      setRounds(data);
    } catch {
      setRounds([]);
    }
  }, [user, token]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  async function handleAdd(round) {
    if (!token) return;
    try {
      const created = await addRound(round, token);
      setRounds((prev) => [created, ...prev]);
    } catch {}
  }

  async function handleDelete(id) {
    if (!token) return;
    try {
      await deleteRound(id, token);
      setRounds((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  function handleLogin(u, t) {
    setUser(u);
    setToken(t ?? null);
  }

  async function handleLogout() {
    await setConfig({ token: null, user: null });
    setUser(null);
    setToken(null);
    setViewingUser(null);
    setRounds([]);
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  if (viewingUser) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <PlayerProfileScreen
            userId={viewingUser.id}
            token={token}
            onBack={() => setViewingUser(null)}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: colors.accent,
              background: colors.bg,
              card: colors.bg,
              text: colors.text,
              border: colors.line,
            },
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
            }}
          >
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
            >
              {() => (
                <MainTabs
                  user={user}
                  token={token}
                  rounds={rounds}
                  onAdd={handleAdd}
                  onDelete={handleDelete}
                  onLogout={handleLogout}
                  onViewUser={setViewingUser}
                  onUserUpdate={(u) => setUser(u)}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: "center", alignItems: "center", padding: 24 },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: colors.muted },
  errorTitle: { color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  errorText: { color: colors.muted, fontSize: 14, textAlign: "center", marginBottom: 24 },
  retryBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: "#07160f", fontWeight: "600" },
});
