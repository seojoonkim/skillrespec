import { useState } from 'react';
import { recommendations } from '../data/recommendations';
import { theme } from '../styles/theme';
import type { DiagnosisItem, InstallItem, RemoveItem, UpdateItem } from '../data/recommendations';

// ═══════════════════════════════════════════════════════════
// Tab Component
// ═══════════════════════════════════════════════════════════
function Tab({ 
  active, 
  onClick, 
  children, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 6px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? theme.colors.accent : 'transparent'}`,
        color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        fontFamily: theme.fonts.sans,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        transition: 'color 0.15s ease',
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: '10px',
          color: active ? theme.colors.accent : theme.colors.textMuted,
          fontFamily: theme.fonts.mono,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Section Components
// ═══════════════════════════════════════════════════════════
function DiagnosisSection({ items }: { items: DiagnosisItem[] }) {
  const getColor = (type: string) => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'error': return theme.colors.error;
      default: return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '12px',
            borderLeft: `2px solid ${getColor(item.type)}`,
            marginBottom: '8px',
            background: theme.colors.bgTertiary,
          }}
        >
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.textPrimary,
            marginBottom: '4px',
          }}>
            {item.text}
          </div>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
          }}>
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

function InstallSection({ items }: { items: InstallItem[] }) {
  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}
        >
          <span style={{
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.success,
            padding: '2px 6px',
            background: theme.colors.accentMuted,
            borderRadius: theme.radius.sm,
            textTransform: 'uppercase',
          }}>
            {item.priority}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
              marginBottom: '4px',
            }}>
              {item.id}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {item.reason}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RemoveSection({ items }: { items: RemoveItem[] }) {
  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}
        >
          <span style={{ color: theme.colors.error, fontSize: '14px' }}>−</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
              marginBottom: '4px',
            }}>
              {item.id}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {item.reason}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateSection({ items }: { items: UpdateItem[] }) {
  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}
        >
          <span style={{ color: theme.colors.info, fontSize: '14px' }}>↑</span>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
                fontFamily: theme.fonts.mono,
              }}>
                {item.id}
              </span>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.mono,
              }}>
                {item.from} → {item.to}
              </span>
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {item.reason}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
interface RecommendationsPanelProps {
  position?: 'right' | 'bottom' | 'mobile';
  embedded?: boolean;
}

export default function RecommendationsPanel({ position = 'right', embedded = false }: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'install' | 'remove' | 'update'>('diagnosis');

  const isBottom = position === 'bottom';
  const isMobile = position === 'mobile';

  const containerStyle: React.CSSProperties = {
    background: embedded ? 'transparent' : theme.colors.bgSecondary,
    border: embedded ? 'none' : `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: embedded ? 'auto' : 900,
    pointerEvents: 'auto',
  };

  if (embedded) {
    // Fill parent container
    Object.assign(containerStyle, {
      width: '100%',
      height: '100%',
      minWidth: '280px',
    });
  } else if (isBottom) {
    Object.assign(containerStyle, {
      position: 'absolute',
      bottom: '80px',
      left: '200px',
      right: '20px',
      height: '200px',
      borderRadius: theme.radius.lg,
    });
  } else if (isMobile) {
    Object.assign(containerStyle, {
      borderRadius: 0,
      border: 'none',
    });
  } else {
    Object.assign(containerStyle, {
      position: 'absolute',
      top: '80px',
      right: '20px',
      width: '300px',
      maxHeight: 'calc(100vh - 160px)',
      borderRadius: theme.radius.lg,
    });
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      {!isMobile && (
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            Recommendations
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <Tab active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} count={recommendations.diagnosis.length}>
          Diagnosis
        </Tab>
        <Tab active={activeTab === 'install'} onClick={() => setActiveTab('install')} count={recommendations.install.length}>
          Install
        </Tab>
        <Tab active={activeTab === 'remove'} onClick={() => setActiveTab('remove')} count={recommendations.remove.length}>
          Remove
        </Tab>
        <Tab active={activeTab === 'update'} onClick={() => setActiveTab('update')} count={recommendations.update.length}>
          Update
        </Tab>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'diagnosis' && <DiagnosisSection items={recommendations.diagnosis} />}
        {activeTab === 'install' && <InstallSection items={recommendations.install} />}
        {activeTab === 'remove' && <RemoveSection items={recommendations.remove} />}
        {activeTab === 'update' && <UpdateSection items={recommendations.update} />}
      </div>
    </div>
  );
}
