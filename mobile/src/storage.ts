import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { Session } from "./types";

const SESSION_KEY = "archer_session";
let memorySession: Session | null = null;

function secureStoreAvailable() {
  return Platform.OS !== "web" && typeof SecureStore.getItemAsync === "function";
}

export async function getSession(): Promise<Session | null> {
  let value: string | null = null;
  if (Platform.OS === "web") {
    value = globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  } else if (secureStoreAvailable()) {
    try { value = await SecureStore.getItemAsync(SESSION_KEY); } catch { value = null; }
  } else {
    return memorySession;
  }

  if (!value) return memorySession;
  try {
    const session = JSON.parse(value) as Session;
    memorySession = session;
    return session;
  } catch {
    memorySession = null;
    if (Platform.OS === "web") globalThis.localStorage?.removeItem(SESSION_KEY);
    else if (secureStoreAvailable()) await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
    return null;
  }
}

export async function setSession(session: Session | null) {
  memorySession = session;
  if (Platform.OS === "web") {
    if (session) globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(session));
    else globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  if (!secureStoreAvailable()) return;
  try {
    if (session) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Keep the in-memory session so the current app session remains usable.
  }
}