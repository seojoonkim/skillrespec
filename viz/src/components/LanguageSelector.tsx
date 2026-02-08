// ═══════════════════════════════════════════════════════════
// Language Selector - 언어 선택 드롭다운
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n/translations';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../i18n/translations';

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
          gap: compact ? '4px' : '6px',
          padding: compact ? '6px 10px' : '8px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#888',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        <span>🌐</span>
        <span>{language.toUpperCase()}</span>
        <span style={{ 
          fontSize: '10px', 
          opacity: 0.6,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          minWidth: '140px',
          background: 'rgba(15, 15, 25, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '6px',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          animation: 'fadeInDown 0.15s ease-out',
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
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: language === lang ? 'rgba(0,255,255,0.15)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: language === lang ? '#00ffff' : '#aaa',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (language !== lang) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#aaa';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_NAMES[lang]}</span>
              {language === lang && (
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '12px',
                  color: '#00ffff',
                }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
