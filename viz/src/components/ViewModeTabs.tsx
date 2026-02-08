// ═══════════════════════════════════════════════════════════
// ViewModeTabs - 뷰 모드 전환 탭 (3D View / Report View)
// Linear/Vercel 스타일 플랫 디자인
// ═══════════════════════════════════════════════════════════

import { useTranslation } from '../i18n/useTranslation';

export type ViewMode = '3d' | 'report';

interface ViewModeTabsProps {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  compact?: boolean;
}

export default function ViewModeTabs({ 
  activeMode, 
  onModeChange,
  compact = false,
}: ViewModeTabsProps) {
  const { t } = useTranslation();

  const tabs: { mode: ViewMode; icon: string; label: string }[] = [
    { mode: '3d', icon: '🌐', label: t.viewMode.graph },
    { mode: 'report', icon: '📋', label: t.viewMode.report },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      padding: '4px',
      background: '#141414',
      borderRadius: '10px',
      border: '1px solid #262626',
    }}>
      {tabs.map(({ mode, icon, label }) => {
        const isActive = activeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? '4px' : '6px',
              padding: compact ? '8px 12px' : '10px 16px',
              background: isActive ? '#262626' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: isActive ? '#fff' : '#666',
              fontSize: compact ? '12px' : '13px',
              fontWeight: 600,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.color = '#999';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            <span style={{ fontSize: compact ? '12px' : '14px' }}>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
