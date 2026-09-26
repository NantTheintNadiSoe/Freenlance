import { Redirect } from "expo-router";
import { LoadingState } from "../src/components/ui";
import { useAuth } from "../src/auth";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState />;
  return <Redirect href={user ? "/(tabs)" : "/(auth)/login"} />;
}
