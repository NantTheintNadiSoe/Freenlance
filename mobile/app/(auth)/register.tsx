import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { ApiError } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors, radius, spacing } from "../../src/theme";

export default function Register() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("FREELANCER");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(""); setSubmitting(true);
    try { await register({ displayName, email, password, role, defaultCurrency: "USD" }); router.replace("/"); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to create your account"); } finally { setSubmitting(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.top}><Text style={styles.logo}>ARCHER</Text><Text style={styles.title}>Make room for better work.</Text><Text style={styles.muted}>Set up your profile and join a marketplace built around trust.</Text></View><View style={styles.form}><Text style={styles.formTitle}>Create an account</Text><Field label="Display name" onChangeText={setDisplayName} placeholder="How should we call you?" value={displayName} /><Field keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} /><Field label="Password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} /><Text style={styles.label}>I want to...</Text><View style={styles.roles}><View style={styles.roleButton}><Button label="Find talent" onPress={() => setRole("CLIENT")} variant={role === "CLIENT" ? "primary" : "secondary"} /></View><View style={styles.roleButton}><Button label="Find work" onPress={() => setRole("FREELANCER")} variant={role === "FREELANCER" ? "primary" : "secondary"} /></View></View>{error ? <Text style={styles.error}>{error}</Text> : null}<Button disabled={submitting || !displayName || !email || password.length < 8} label={submitting ? "Creating..." : "Create account"} onPress={submit} /><Link href="/(auth)/login" style={styles.link}>Already have an account? <Text style={styles.linkStrong}>Sign in</Text></Link></View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { backgroundColor: colors.canvas, flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, justifyContent: "center", padding: spacing.lg },
  top: { gap: spacing.sm },
  logo: { color: colors.primary, fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  title: { color: colors.ink, fontSize: 31, fontWeight: "900", letterSpacing: -0.7, lineHeight: 36, maxWidth: 300 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  formTitle: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  roles: { flexDirection: "row", gap: spacing.sm },
  roleButton: { flex: 1 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  link: { color: colors.muted, fontSize: 14, padding: spacing.sm, textAlign: "center" },
  linkStrong: { color: colors.primary, fontWeight: "900" }
});