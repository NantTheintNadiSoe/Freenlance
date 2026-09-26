import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { api, ApiError } from "../../src/api";
import { Card, EmptyState, ErrorState, Heading, LoadingState, formatMoney } from "../../src/components/ui";
import type { Job } from "../../src/types";
import { colors, spacing } from "../../src/theme";

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (pull = false, search = activeQuery) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError("");
    try { const response = await api.jobs(search ? `?q=${encodeURIComponent(search)}` : ""); setJobs(response.data); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load jobs"); } finally { setLoading(false); setRefreshing(false); }
  }, [activeQuery]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return <View style={styles.container}><Heading eyebrow="Marketplace">Find work that fits</Heading><View style={styles.searchRow}><TextInput autoCapitalize="none" onChangeText={setQuery} onSubmitEditing={() => { setActiveQuery(query.trim()); }} placeholder="Search jobs" placeholderTextColor={colors.muted} returnKeyType="search" style={styles.search} value={query} /><Text onPress={() => setActiveQuery(query.trim())} style={styles.searchAction}>Search</Text></View><FlatList contentContainerStyle={styles.list} data={jobs} keyExtractor={(item) => item.id} ListEmptyComponent={<EmptyState message="Try another search or check back soon." title="No open jobs yet" />} refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={refreshing} tintColor={colors.primary} />} renderItem={({ item }) => <Card onPress={() => router.push(`/jobs/${item.id}`)}><View style={styles.row}><Text style={styles.jobTitle}>{item.title}</Text><Text style={styles.currency}>{item.currency}</Text></View><Text numberOfLines={2} style={styles.description}>{item.description}</Text><View style={styles.row}><Text style={styles.money}>{formatMoney(item.budgetMinMinor, item.currency)} – {formatMoney(item.budgetMaxMinor, item.currency)}</Text><Text style={styles.meta}>{item.locationMode}</Text></View><Text style={styles.client}>Posted by {item.client.displayName}</Text></Card>} showsVerticalScrollIndicator={false} /></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }, searchRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }, search: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, flex: 1, height: 48, paddingHorizontal: spacing.md }, searchAction: { color: colors.primary, fontWeight: "800", padding: spacing.sm }, list: { gap: spacing.sm, paddingBottom: spacing.xl }, row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }, jobTitle: { color: colors.ink, flex: 1, fontSize: 17, fontWeight: "800" }, currency: { color: colors.primary, fontSize: 12, fontWeight: "900" }, description: { color: colors.muted, fontSize: 14, lineHeight: 20 }, money: { color: colors.ink, fontSize: 15, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 12, textTransform: "capitalize" }, client: { color: colors.muted, fontSize: 12 } });
