import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../../src/api";
import { Card, EmptyState, ErrorState, Heading, LoadingState, formatMoney } from "../../src/components/ui";
import type { Contract } from "../../src/types";
import { colors, spacing } from "../../src/theme";

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (pull = false) => { if (pull) setRefreshing(true); else setLoading(true); setError(""); try { const response = await api.contracts(); setContracts(response.data); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load contracts"); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  return <View style={styles.container}><Heading eyebrow="Your work">Contracts</Heading><FlatList contentContainerStyle={styles.list} data={contracts} keyExtractor={(item) => item.id} ListEmptyComponent={<EmptyState message="Accepted proposals and active work will appear here." title="No contracts yet" />} refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={refreshing} tintColor={colors.primary} />} renderItem={({ item }) => <Card><View style={styles.row}><Text style={styles.title}>{item.title}</Text><Text style={[styles.status, item.status === "ACTIVE" && styles.active]}>{item.status}</Text></View><Text style={styles.description}>{item.description}</Text><View style={styles.row}><Text style={styles.money}>{formatMoney(item.agreedAmountMinor, item.currency)}</Text><Text style={styles.meta}>{item.currency}</Text></View><Text style={styles.meta}>Client: {item.client.displayName} · Freelancer: {item.freelancer.displayName}</Text></Card>} showsVerticalScrollIndicator={false} /></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }, list: { gap: spacing.sm, paddingBottom: spacing.xl }, row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" }, title: { color: colors.ink, flex: 1, fontSize: 17, fontWeight: "800" }, status: { color: colors.muted, fontSize: 11, fontWeight: "900" }, active: { color: colors.primary }, description: { color: colors.muted, fontSize: 14, lineHeight: 20 }, money: { color: colors.ink, fontSize: 16, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 12 } });
