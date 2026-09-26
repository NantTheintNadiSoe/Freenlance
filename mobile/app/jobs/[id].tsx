import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { api, ApiError } from "../../src/api";
import { Button, Card, ErrorState, Heading, LoadingState, formatMoney } from "../../src/components/ui";
import type { Job } from "../../src/types";
import { colors, spacing } from "../../src/theme";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const response = await api.job(String(id)); setJob(response.data); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load this job"); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState />;
  if (error || !job) return <ErrorState message={error || "Job not found"} onRetry={() => void load()} />;
  const isOwner = job.client.id === user?.id;
  return <ScrollView contentContainerStyle={styles.content}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to jobs</Text></Pressable><Heading eyebrow={`${job.category} · ${job.experienceLevel}`}>{job.title}</Heading><Text style={styles.description}>{job.description}</Text><View style={styles.grid}><Card><Text style={styles.label}>Budget</Text><Text style={styles.value}>{formatMoney(job.budgetMinMinor, job.currency)} – {formatMoney(job.budgetMaxMinor, job.currency)}</Text><Text style={styles.meta}>{job.budgetType.toLowerCase()} · {job.currency}</Text></Card><Card><Text style={styles.label}>Work mode</Text><Text style={styles.value}>{job.locationMode}</Text><Text style={styles.meta}>{job.location || "Remote-friendly"}</Text></Card></View><Card><Text style={styles.label}>About the client</Text><Text style={styles.value}>{job.client.displayName}</Text><Text style={styles.meta}>Rating {job.client.ratingAverage.toFixed(1)} ({job.client.ratingCount} reviews)</Text></Card>{job.skills.length ? <View style={styles.section}><Text style={styles.sectionTitle}>Skills</Text><View style={styles.skills}>{job.skills.map(({ skill }) => <View key={skill.id} style={styles.skill}><Text style={styles.skillText}>{skill.name}</Text></View>)}</View></View> : null}{isOwner ? <Text style={styles.note}>This is your job. Proposal actions are available in the client workspace.</Text> : user?.role === "FREELANCER" ? <Button label="Send a proposal" onPress={() => router.push(`/jobs/${job.id}/proposal`)} /> : null}</ScrollView>;
}

const styles = StyleSheet.create({ content: { backgroundColor: colors.canvas, flexGrow: 1, gap: spacing.md, padding: spacing.lg }, back: { color: colors.primary, fontSize: 15, fontWeight: "800" }, description: { color: colors.ink, fontSize: 16, lineHeight: 25 }, grid: { flexDirection: "row", gap: spacing.sm }, label: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }, value: { color: colors.ink, fontSize: 17, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 13 }, section: { gap: spacing.sm }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" }, skills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, skill: { backgroundColor: "#E2EEE7", borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, skillText: { color: colors.primaryDark, fontSize: 13, fontWeight: "700" }, note: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" } });
