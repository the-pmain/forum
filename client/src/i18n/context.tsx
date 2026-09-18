import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES } from "@shared/constants.ts";
import type { Locale } from "@shared/types.ts";
import { de } from "./locales/de.ts";
import { en, type Messages } from "./locales/en.ts";
import { nl } from "./locales/nl.ts";

const dictionaries: Record<Locale, Messages> = { en, nl, de };

type Vars = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  t: (path: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: (path) => path,
});

function lookup(messages: Messages, path: string): string {
  const value = path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object" && key in node) return (node as Record<string, unknown>)[key];
    return undefined;
  }, messages);
  return typeof value === "string" ? value : path;
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({
    locale,
    t: (path, vars) => {
      let text = lookup(dictionaries[locale] ?? en, path);
      if (vars) {
        for (const [key, item] of Object.entries(vars)) text = text.replaceAll(`{${key}}`, String(item));
      }
      return text;
    },
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return LOCALES.includes(first as Locale) ? (first as Locale) : DEFAULT_LOCALE;
}

export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean === "/" ? "/" : clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
