import { Platform } from "react-native";

const DEFAULT_PORT = 3000;
const API_PATH = "/api/v1";

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}

function isLoopbackUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(value);
}

function useAndroidHost(value: string) {
  return value.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i, (_match, protocol) => `${protocol}10.0.2.2`);
}

/**
 * EXPO_PUBLIC_API_URL is supported for physical devices and remote APIs.
 * Android's emulator cannot reach the host computer through localhost, so
 * loopback URLs are rewritten to the Android emulator gateway automatically.
 */
export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    const normalized = normalizeUrl(configured);
    return Platform.OS === "android" && isLoopbackUrl(normalized) ? useAndroidHost(normalized) : normalized;
  }
  if (Platform.OS === "android") return `http://10.0.2.2:${DEFAULT_PORT}${API_PATH}`;
  return `http://localhost:${DEFAULT_PORT}${API_PATH}`;
}

export const API_URL = getApiUrl();