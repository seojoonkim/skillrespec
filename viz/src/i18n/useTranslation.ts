// ═══════════════════════════════════════════════════════════
// useTranslation Hook - Convenience wrapper for i18n
// ═══════════════════════════════════════════════════════════

import { useLanguage } from './LanguageContext';

export function useTranslation() {
  const { language, setLanguage, t } = useLanguage();
  return { language, setLanguage, t };
}
