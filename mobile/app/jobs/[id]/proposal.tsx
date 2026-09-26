import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { api, ApiError } from "../../../src/api";
import { Button, ErrorState, Field, Heading, LoadingState } from "../../../src/components/ui";
import type { Job } from "../../../src/types";
import { colors, spacing } from "../../../src/theme";

export default function Proposal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const load = useCallback(async () => { try { const response = await api.job(String(id)); setJob(response.data); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load this job"); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <ErrorState message={error} onRetry={() => { setError(""); void load(); }} />;
  if (!job) return <LoadingState />;
  const currentJob = job;

  async function submit() {
    const parsedAmount = Number(amount);
    const parsedDays = Number(days);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isInteger(parsedDays) || parsedDays <= 0 || coverLetter.trim().length < 30) { setError("Enter a positive amount, a valid number of days, and at least 30 characters for your cover letter."); return; }
    setError(""); setSubmitting(true);
    try { await api.createProposal(currentJob.id, { coverLetter: coverLetter.trim(), proposedAmountMinor: currentJob.currency === "USD" ? Math.round(parsedAmount * 100) : Math.round(parsedAmount), currency: currentJob.currency, estimatedDays: parsedDays }); router.replace(`/jobs/${currentJob.id}`); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to send your proposal"); } finally { setSubmitting(false); }
  }

  return <ScrollView contentContainerStyle={styles.content}><Heading eyebrow={`Proposal Ã‚Â· ${currentJob.currency}`}>Make a thoughtful offer</Heading><Text style={styles.helper}>Your proposal currency must match the job currency. Enter the amount in {currentJob.currency === "USD" ? "dollars and cents" : "whole kyat"}; it is stored by the API in minor units.</Text><Field keyboardType="numeric" label={`Your amount (${currentJob.currency})`} onChangeText={setAmount} placeholder={currentJob.currency === "USD" ? "e.g. 850.00" : "e.g. 500000"} value={amount} /><Field keyboardType="numeric" label="Estimated days" onChangeText={setDays} placeholder="e.g. 14" value={days} /><Field label="Cover letter" multiline onChangeText={setCoverLetter} placeholder="Explain how you would approach this workÃ¢â‚¬Â¦" value={coverLetter} />{error ? <Text style={styles.error}>{error}</Text> : null}<Button disabled={submitting} label={submitting ? "SendingÃ¢â‚¬Â¦" : "Send proposal"} onPress={() => void submit()} /></ScrollView>;
}

const styles = StyleSheet.create({ content: { backgroundColor: colors.canvas, flexGrow: 1, gap: spacing.md, padding: spacing.lg }, helper: { color: colors.muted, fontSize: 14, lineHeight: 21 }, error: { color: colors.danger, fontSize: 14, lineHeight: 20 } });
