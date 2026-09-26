import { Bell, ChevronDown, LogOut, Menu, MessageCircle, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { useTranslation, type Language } from "../i18n";
import { Avatar, Button } from "./ui";
import { ThemeToggle } from "./theme-toggle";

function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const languages: Array<[Language, string]> = [["en", t("language.english")], ["my", t("language.burmese")]];
  return <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-bold" aria-label={t("language.switch")}><ThemeToggle />
    {languages.map(([value, label]) => <button key={value} type="button" onClick={() => setLanguage(value)} className={cn("rounded-md px-2 py-1 transition", language === value ? "bg-ink text-white" : "text-slate-500 hover:bg-slate-50")}>{label}</button>)}
  </div>;
}

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return <header className="border-b border-slate-200/70 bg-cream/90 backdrop-blur"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><Link to="/" className="flex items-center gap-2.5 text-lg font-black tracking-tight text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500"><Sparkles size={18} /></span>Archer</Link><nav className="hidden items-center gap-7 md:flex"><NavLink to="/jobs" className="text-sm font-semibold text-slate-500 hover:text-ink">{t("nav.findWork")}</NavLink><NavLink to="/freelancers" className="text-sm font-semibold text-slate-500 hover:text-ink">{t("nav.findTalent")}</NavLink></nav><div className="hidden items-center gap-3 md:flex"><LanguageSwitcher />{user ? <div className="relative"><button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-white"><Avatar name={user.displayName} image={user.avatarUrl} size="sm" /><span className="max-w-28 truncate text-sm font-semibold">{user.displayName}</span><ChevronDown size={15} /></button>{open && <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft"><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50" to="/app">{t("nav.dashboard")}</Link><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50" to="/app/profile">{t("nav.profile")}</Link><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={async () => { await logout(); navigate("/"); }}><LogOut size={14} /> {t("nav.logOut")}</button></div>}</div> : <><Link to="/login" className="px-3 py-2 text-sm font-semibold text-slate-600">{t("nav.logIn")}</Link><Link to="/register"><Button size="sm">{t("nav.getStarted")}</Button></Link></>}</div><button aria-label={t("nav.workspace")} className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <div className="border-t bg-white p-5 md:hidden"><div className="flex flex-col gap-4"><LanguageSwitcher /><Link to="/jobs">{t("nav.findWork")}</Link><Link to="/freelancers">{t("nav.findTalent")}</Link>{user ? <Link to="/app">{t("nav.dashboard")}</Link> : <Link to="/login">{t("nav.logIn")}</Link>}</div></div>}</header>;
}

export function AppShell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const unread = useQuery({ queryKey: ["notifications"], queryFn: api.notifications, enabled: Boolean(user) });
  const [mobile, setMobile] = useState(false);
  const items = user?.role === "CLIENT" ? [[t("nav.overview"), "/app"], [t("nav.myJobs"), "/app/jobs"], [t("nav.contracts"), "/app/contracts"], [t("nav.messages"), "/app/messages"]] : [[t("nav.overview"), "/app"], [t("nav.findWork"), "/jobs"], [t("nav.myProposals"), "/app/proposals"], [t("nav.contracts"), "/app/contracts"], [t("nav.messages"), "/app/messages"]];
  return <div className="min-h-screen bg-[#f6f7f8]"><aside className={cn("fixed inset-y-0 left-0 z-40 w-64 bg-ink p-5 text-white transition-transform lg:translate-x-0", mobile ? "translate-x-0" : "-translate-x-full")}><Link to="/app" className="mb-10 flex items-center gap-2.5 text-lg font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-ink"><Sparkles size={18} /></span>Archer</Link><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{t("nav.workspace")}</p><nav className="space-y-1">{items.map(([label, href]) => <NavLink key={href} to={href} end={href === "/app"} onClick={() => setMobile(false)} className={({ isActive }) => cn("block rounded-xl px-3 py-2.5 text-sm font-semibold", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}>{label}</NavLink>)}</nav><Link to="/app/notifications" className="mt-8 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"><Bell size={16} /> {t("nav.notifications")} {Boolean(unread.data?.data.some((item) => !item.readAt)) && <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />}</Link><div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-white/10 p-4"><div className="flex items-center gap-2"><Avatar name={user?.displayName ?? "User"} image={user?.avatarUrl} size="sm" /><div className="min-w-0"><p className="truncate text-xs font-bold">{user?.displayName}</p><p className="text-[10px] uppercase text-slate-400">{user?.role.toLowerCase()}</p></div></div></div></aside><div className="lg:pl-64"><div className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-[#f6f7f8]/90 px-5 backdrop-blur lg:px-8"><button aria-label={t("nav.workspace")} className="rounded-lg p-2 lg:hidden" onClick={() => setMobile(!mobile)}><Menu size={20} /></button><div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex"><Search size={16} /> {t("nav.archerWorkspace")}</div><div className="ml-auto flex items-center gap-4"><LanguageSwitcher /><Link to="/app/messages" className="text-slate-500 hover:text-ink"><MessageCircle size={18} /></Link><Link to="/app/notifications" className="text-slate-500 hover:text-ink"><Bell size={18} /></Link><Link to="/app/profile" className="flex items-center gap-2"><Avatar name={user?.displayName ?? "User"} image={user?.avatarUrl} size="sm" /><span className="hidden text-sm font-semibold sm:block">{user?.displayName}</span></Link></div></div><main className="mx-auto max-w-7xl p-5 lg:p-8"><Outlet /></main></div></div>;
}
