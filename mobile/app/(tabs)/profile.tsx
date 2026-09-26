import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { Button, Card, Heading } from "../../src/components/ui";
import { colors, spacing } from "../../src/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  if (!user) return null;
  async function signOut() { setLoggingOut(true); await logout(); setLoggingOut(false); router.replace("/"); }
  return <View style={styles.container}><Heading eyebrow="Account">Your profile</Heading><Card><View style={styles.avatar}><Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.name}>{user.displayName}</Text><Text style={styles.email}>{user.email}</Text><Text style={styles.role}>{user.role === "CLIENT" ? "Client" : "Freelancer"}</Text></Card><Card><Text style={styles.sectionTitle}>Profile basics</Text><Text style={styles.item}>Location: {user.location || "Not set"}</Text><Text style={styles.item}>Default currency: {user.defaultCurrency}</Text><Text style={styles.item}>Availability: {user.availability.toLowerCase()}</Text>{user.headline ? <Text style={styles.item}>{user.headline}</Text> : null}</Card><Button disabled={loggingOut} label={loggingOut ? "Signing out…" : "Sign out"} onPress={() => Alert.alert("Sign out?", "Your secure session will be removed from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => { void signOut(); } }])} variant="secondary" /></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1, gap: spacing.md, padding: spacing.lg }, avatar: { alignItems: "center", backgroundColor: "#E2EEE7", borderRadius: 36, height: 72, justifyContent: "center", width: 72 }, avatarText: { color: colors.primary, fontSize: 30, fontWeight: "900" }, name: { color: colors.ink, fontSize: 22, fontWeight: "800" }, email: { color: colors.muted, fontSize: 14 }, role: { color: colors.primary, fontSize: 13, fontWeight: "800" }, sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" }, item: { color: colors.muted, fontSize: 14, lineHeight: 22 } });
