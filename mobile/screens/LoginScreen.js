import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { login, register, getConfig, setConfig } from "../lib/api";
import { colors } from "../lib/theme";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiUrl, setApiUrl] = useState("https://birdie-production-ec4b.up.railway.app");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConfig().then((c) => {
      if (c?.apiUrl) setApiUrl(c.apiUrl);
    });
  }, []);

  async function saveApiUrl() {
    let url = apiUrl.trim() || "https://birdie-production-ec4b.up.railway.app";
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    setApiUrl(url);
    await setConfig({ apiUrl: url });
  }

  async function submit() {
    setError("");
    await saveApiUrl();
    setLoading(true);
    try {
      const data = mode === "login"
        ? await login(username, password)
        : await register(username, password);
      await setConfig({ token: data.token, user: data.user });
      onLogin(data.user, data.token);
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Something went wrong";
      const isNetwork =
        msg?.includes?.("fetch failed") || msg === "Failed to fetch" || err?.name === "TypeError";
      setError(isNetwork ? "Couldn't connect. Check Server URL." : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Birdie</Text>
        <Text style={styles.subtitle}>Golf stats • friendly competition</Text>

        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          onBlur={saveApiUrl}
          placeholder="https://..."
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. dad"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{mode === "login" ? "Log in" : "Create account"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switch}
          onPress={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          <Text style={styles.switchText}>
            {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnText: {
    color: "#07160f",
    fontWeight: "600",
    fontSize: 16,
  },
  switch: {
    marginTop: 16,
    alignItems: "center",
  },
  switchText: {
    color: colors.muted,
    fontSize: 14,
  },
});
