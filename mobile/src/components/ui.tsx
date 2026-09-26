import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ReactNode } from "react";
import { colors, radius, shadow, spacing } from "../theme";

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Heading({ children, eyebrow, accessory }: { children: ReactNode; eyebrow?: string; accessory?: ReactNode }) {
  return <View style={styles.headingRow}><View style={styles.heading}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}<Text style={styles.title}>{children}</Text></View>{accessory}</View>;
}

export function Button({ label, onPress, variant = "primary", disabled = false }: { label: string; onPress: () => void; variant?: "primary" | "secondary" | "quiet"; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${variant}`], pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.buttonText, variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{label}</Text></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = "default", multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: "default" | "email-address" | "numeric"; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"} autoCorrect={false} keyboardType={keyboardType} multiline={multiline} numberOfLines={multiline ? 5 : 1} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} style={[styles.input, multiline && styles.textarea]} value={value} /></View>;
}

export function Card({ children, onPress, tone = "default" }: { children: ReactNode; onPress?: () => void; tone?: "default" | "tinted" }) {
  const content = <View style={[styles.card, tone === "tinted" && styles.cardTinted]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>{content}</Pressable> : content;
}

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "gold" | "neutral" }) {
  return <View style={[styles.badge, tone === "gold" && styles.badgeGold, tone === "neutral" && styles.badgeNeutral]}><Text style={[styles.badgeText, tone === "gold" && styles.badgeTextGold, tone === "neutral" && styles.badgeTextNeutral]}>{children}</Text></View>;
}

export function LoadingState() { return <View style={styles.center}><View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View><Text style={styles.muted}>Loading your workspace…</Text></View>; }

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View style={styles.center}><View style={styles.errorMark}><Text style={styles.errorMarkText}>!</Text></View><Text style={styles.errorTitle}>Something went wrong</Text><Text style={styles.muted}>{message}</Text>{onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}</View>;
}

export function EmptyState({ title, message }: { title: string; message: string }) { return <View style={styles.center}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>+</Text></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.muted}>{message}</Text></View>; }

export function formatMoney(amountMinor: number, currency: string) {
  const amount = currency === "USD" ? amountMinor / 100 : amountMinor;
  return new Intl.NumberFormat(currency === "MMK" ? "my-MM" : "en-US", { style: "currency", currency, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(amount);
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1, padding: spacing.lg, gap: spacing.md },
  headingRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  heading: { flex: 1, gap: spacing.xs },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "900", letterSpacing: -0.7 },
  button: { alignItems: "center", borderRadius: radius.md, minHeight: 52, justifyContent: "center", paddingHorizontal: spacing.lg },
  button_primary: { backgroundColor: colors.primary, shadowColor: shadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, elevation: shadow.elevation },
  button_secondary: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
  button_quiet: { backgroundColor: "transparent" },
  buttonText: { fontSize: 15, fontWeight: "900" },
  buttonTextPrimary: { color: colors.white },
  buttonTextSecondary: { color: colors.primary },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  input: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 54, paddingHorizontal: spacing.md },
  textarea: { minHeight: 130, paddingTop: spacing.md, textAlignVertical: "top" },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md, shadowColor: shadow.color, shadowOffset: { width: 0, height: 5 }, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, elevation: 2 },
  cardTinted: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  badge: { alignSelf: "flex-start", backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  badgeGold: { backgroundColor: "#FFF1D7" },
  badgeNeutral: { backgroundColor: colors.surfaceMuted },
  badgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  badgeTextGold: { color: "#8A5A12" },
  badgeTextNeutral: { color: colors.muted },
  center: { alignItems: "center", flex: 1, gap: spacing.sm, justifyContent: "center", padding: spacing.xl },
  loader: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.lg, height: 64, justifyContent: "center", width: 64 },
  errorMark: { alignItems: "center", backgroundColor: "#FBE9E9", borderRadius: radius.pill, height: 54, justifyContent: "center", width: 54 },
  errorMarkText: { color: colors.danger, fontSize: 26, fontWeight: "900" },
  errorTitle: { color: colors.danger, fontSize: 18, fontWeight: "900" },
  emptyMark: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 54, justifyContent: "center", width: 54 },
  emptyMarkText: { color: colors.primary, fontSize: 28, fontWeight: "400" },
  emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" }
});