import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./auth";
import { AppShell, Header } from "./components/layout";
import { HomePage } from "./pages/home";
import { LoginPage, RegisterPage } from "./pages/auth";
import { JobDetailPage, JobsPage } from "./pages/jobs";
import { ProfileDetailPage, ProfilesPage } from "./pages/profiles";
import { DashboardPage, NewJobPage } from "./pages/dashboard";
import { ContractsPage, MessagesPage, MyJobsPage, NotificationsPage, ProfilePage, ProposalsPage } from "./pages/workspace";
import { LanguageProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import "./index.css";
import "./i18n/typography.css";
import "./theme.css";
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
function PublicLayout() { return <><Header /><Outlet /></>; }
function ProtectedLayout() { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="flex min-h-screen items-center justify-center bg-cream"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>; if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />; return <AppShell />; }
function App() { return <Routes><Route element={<PublicLayout />}><Route path="/" element={<HomePage />} /><Route path="/jobs" element={<JobsPage />} /><Route path="/jobs/:jobId" element={<JobDetailPage />} /><Route path="/freelancers" element={<ProfilesPage />} /><Route path="/freelancers/:userId" element={<ProfileDetailPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /></Route><Route element={<ProtectedLayout />}><Route path="/app" element={<DashboardPage />} /><Route path="/app/jobs" element={<MyJobsPage />} /><Route path="/app/jobs/new" element={<NewJobPage />} /><Route path="/app/proposals" element={<ProposalsPage />} /><Route path="/app/contracts" element={<ContractsPage />} /><Route path="/app/messages" element={<MessagesPage />} /><Route path="/app/notifications" element={<NotificationsPage />} /><Route path="/app/profile" element={<ProfilePage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }
createRoot(document.getElementById("root")!).render(<ThemeProvider><LanguageProvider><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></QueryClientProvider></LanguageProvider></ThemeProvider>);
