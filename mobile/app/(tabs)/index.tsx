import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { api, ApiError } from "../../src/api";
import { Badge, Button, Card, ErrorState, Heading, LoadingState, formatMoney } from "../../src/components/ui";
import { colors, radius, spacing } from "../../src/theme";

export default function Dashboard() {
  const { user } = useAuth();
  const [contractCount, setContractCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [contracts, notifications] = await Promise.all([api.contracts(), api.notifications()]);
      setContractCount(contracts.data.length);
      setUnreadCount(notifications.data.filter((notification) => !notification.readAt).length);
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load your dashboard"); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={refreshing} tintColor={colors.primary} />}><View style={styles.greeting}><View><Text style={styles.eyebrow}>{user?.role === "CLIENT" ? "CLIENT WORKSPACE" : "FREELANCER WORKSPACE"}</Text><Text style={styles.greetingTitle}>Good to see you,</Text><Text style={styles.name}>{user?.displayName.split(" ")[0]}.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{user?.displayName.slice(0, 1).toUpperCase()}</Text></View></View><Text style={styles.intro}>{user?.role === "CLIENT" ? "Keep your projects moving and find the right people for your next brief." : "Discover meaningful work and keep your active contracts on track."}</Text><View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{contractCount}</Text><Text style={styles.statLabel}>Contracts</Text><Badge tone="green">In progress</Badge></View><View style={styles.stat}><Text style={styles.statValue}>{unreadCount}</Text><Text style={styles.statLabel}>Updates</Text><Badge tone={unreadCount ? "gold" : "neutral"}>{unreadCount ? "New" : "All caught up"}</Badge></View></View><Card tone="tinted"><Text style={styles.cardKicker}>NEXT STEP</Text><Text style={styles.cardTitle}>{user?.role === "CLIENT" ? "Ready to hire?" : "Ready to find your next project?"}</Text><Text style={styles.body}>{user?.role === "CLIENT" ? "Publish a clear brief and review proposals from the Jobs tab." : "Browse open roles, check the currency, and send a proposal when the fit is right."}</Text><Button label="Explore jobs" onPress={() => router.push("/jobs")} /></Card>{user?.hourlyRateMinor ? <Text style={styles.note}>Profile rate Â· {formatMoney(user.hourlyRateMinor, user.defaultCurrency)} / hour</Text> : null}</ScrollView>;
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.canvas, flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  greeting: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  greetingTitle: { color: colors.ink, fontSize: 28, fontWeight: "700", letterSpacing: -0.6, lineHeight: 33 },
  name: { color: colors.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 38 },
  avatar: { alignItems: "center", backgroundColor: colors.primary, borderColor: colors.white, borderRadius: radius.pill, borderWidth: 4, height: 64, justifyContent: "center", shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, width: 64, elevation: 4 },
  avatarText: { color: colors.white, fontSize: 25, fontWeight: "900" },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 340 },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.md },
  statValue: { color: colors.ink, fontSize: 32, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: "800", marginBottom: spacing.xs },
  cardKicker: { color: colors.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  cardTitle: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  note: { color: colors.muted, fontSize: 13, textAlign: "center" }
});