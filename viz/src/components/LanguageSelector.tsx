import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { theme } from '../styles/theme';
import type { Language } from '../i18n/translations';
import { LANGUAGE_NAMES } from '../i18n/translations';

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: Language[] = ['ko', 'en', 'ja', 'zh'];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '8px' : '8px 12px',
          background: 'transparent',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span>{language.toUpperCase()}</span>
        {!compact && (
          <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          minWidth: '120px',
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: '4px',
          zIndex: 1000,
        }}>
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
                background: language === lang ? theme.colors.bgTertiary : 'transparent',
                border: 'none',
                borderRadius: theme.radius.sm,
                color: language === lang ? theme.colors.accent : theme.colors.textSecondary,
                fontSize: theme.fontSize.sm,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <span>{LANGUAGE_NAMES[lang]}</span>
              {language === lang && (
                <span style={{ color: theme.colors.accent }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
