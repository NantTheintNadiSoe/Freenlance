import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme";
import { useTranslation } from "../i18n";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const nextLabel = theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark");
  return <button type="button" onClick={toggleTheme} aria-label={nextLabel} aria-pressed={theme === "dark"} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>;
}
