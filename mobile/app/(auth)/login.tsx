import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { ApiError } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors, radius, spacing } from "../../src/theme";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    setSubmitting(true);
    try { await login(email, password); router.replace("/"); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to sign in"); } finally { setSubmitting(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.hero}><View style={styles.heroCircle} /><Text style={styles.logo}>ARCHER</Text><Text style={styles.heroTitle}>Good work starts with the right connection.</Text><Text style={styles.heroBody}>A calmer way to find great projects and trusted people.</Text></View><View style={styles.form}><Text style={styles.title}>Welcome back</Text><Text style={styles.muted}>Sign in to continue to your workspace.</Text><Field keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} /><Field label="Password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} />{error ? <Text style={styles.error}>{error}</Text> : null}<Button disabled={submitting || !email || !password} label={submitting ? "Signing in..." : "Sign in"} onPress={submit} /><Link href="/(auth)/register" style={styles.link}>New to Archer? <Text style={styles.linkStrong}>Create an account</Text></Link></View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { backgroundColor: colors.canvas, flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, justifyContent: "center", padding: spacing.lg },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, gap: spacing.sm, overflow: "hidden", padding: spacing.lg, position: "relative" },
  heroCircle: { backgroundColor: "#2B956E", borderRadius: 120, height: 190, opacity: 0.55, position: "absolute", right: -74, top: -78, width: 190 },
  logo: { color: colors.accent, fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  heroTitle: { color: colors.white, fontSize: 29, fontWeight: "900", letterSpacing: -0.6, lineHeight: 35, maxWidth: 300 },
  heroBody: { color: "#D8F3E4", fontSize: 15, lineHeight: 22, maxWidth: 280 },
  form: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  title: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  link: { color: colors.muted, fontSize: 14, padding: spacing.sm, textAlign: "center" },
  linkStrong: { color: colors.primary, fontWeight: "900" }
});