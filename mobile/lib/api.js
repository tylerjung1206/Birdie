import AsyncStorage from "@react-native-async-storage/async-storage";

const CONFIG_KEY = "@birdie_config";
const DEFAULT_API_URL = "https://birdie-production-ec4b.up.railway.app";

export async function getConfig() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : { apiUrl: DEFAULT_API_URL };
  } catch {
    return { apiUrl: DEFAULT_API_URL };
  }
}

export async function setConfig(updates) {
  const cfg = await getConfig();
  const next = { ...cfg, ...updates };
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  return next;
}

async function getBaseUrl() {
  const cfg = await getConfig();
  let url = cfg?.apiUrl || DEFAULT_API_URL;
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}

async function getToken() {
  const cfg = await getConfig();
  return cfg?.token || null;
}

async function request(method, path, body, token) {
  const base = await getBaseUrl();
  const t = token ?? (await getToken());
  const url = `${base.replace(/\/$/, "")}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function register(username, password) {
  return request("POST", "/auth/register", { username, password });
}

export async function login(username, password) {
  return request("POST", "/auth/login", { username, password });
}

export async function searchUsers(q, token) {
  return request("GET", `/users/search?q=${encodeURIComponent(q)}`, null, token);
}

export async function getMe(token) {
  return request("GET", "/users/me", null, token);
}

export async function updateProfile(profile, token) {
  return request("PUT", "/users/me/profile", profile, token);
}

export async function getUser(id, token) {
  return request("GET", `/users/${id}`, null, token);
}

export async function getUserRounds(id, token) {
  return request("GET", `/users/${id}/rounds`, null, token);
}

export async function getMyRounds(token) {
  return request("GET", "/rounds", null, token);
}

export async function addRound(round, token) {
  return request("POST", "/rounds", round, token);
}

export async function deleteRound(id, token) {
  return request("DELETE", `/rounds/${id}`, null, token);
}

export async function getAdminUsers(token) {
  return request("GET", "/admin/users", null, token);
}

export async function setUserAdmin(userId, admin, token) {
  return request("POST", `/admin/users/${userId}/admin`, { admin }, token);
}

export async function getAdminStats(token) {
  return request("GET", "/admin/stats", null, token);
}
