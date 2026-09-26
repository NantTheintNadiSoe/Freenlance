import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getStoredLanguage } from "../i18n";
export function cn(...values: ClassValue[]) { return twMerge(clsx(values)); }
export function formatMoney(amountMinor: number, currency: string) { const language = getStoredLanguage(); return new Intl.NumberFormat(language === "my" ? "my-MM" : "en-US", { style: "currency", currency, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(amountMinor / (currency === "USD" ? 100 : 1)); }
export function formatDate(value: string | Date) { return new Intl.DateTimeFormat(getStoredLanguage() === "my" ? "my-MM" : "en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
export function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
