import { useState } from 'react';
import { recommendations } from '../data/recommendations';
import { theme } from '../styles/theme';
import type { DiagnosisItem, InstallItem, RemoveItem, UpdateItem } from '../data/recommendations';

// ═══════════════════════════════════════════════════════════
// Terminal-style accent colors
// ═══════════════════════════════════════════════════════════
const terminalColors = {
  analysis: '#FFC107',  // Yellow - warning/attention
  install: '#4ADE80',   // Green - add/success
  remove: '#EF4444',    // Red - delete/danger
  update: '#22D3EE',    // Cyan - info/update
} as const;

// ═══════════════════════════════════════════════════════════
// Tab Component - Clean minimal style with accent colors
// ═══════════════════════════════════════════════════════════
function Tab({ 
  active, 
  onClick, 
  children, 
  count,
  accentColor,
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
  count?: number;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 8px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? theme.colors.textPrimary : 'transparent'}`,
        color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        fontFamily: theme.fonts.sans,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        transition: theme.transitions.fast,
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = theme.colors.textSecondary;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = theme.colors.textMuted;
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: theme.radius.full,
          background: accentColor ? `${accentColor}15` : theme.colors.bgTertiary,
          color: accentColor || theme.colors.textMuted,
          fontFamily: theme.fonts.mono,
          fontWeight: theme.fontWeight.semibold,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Section Components - Clean minimal style
// ═══════════════════════════════════════════════════════════
function DiagnosisSection({ items }: { items: DiagnosisItem[] }) {
  const getTypeColor = (type: DiagnosisItem['type']) => {
    switch (type) {
      case 'success': return terminalColors.install;  // Green
      case 'warning': return terminalColors.analysis; // Yellow
      case 'error': return terminalColors.remove;     // Red
      default: return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => {
        const accentColor = getTypeColor(item.type);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              marginBottom: '10px',
              background: theme.colors.bgTertiary,
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              transition: theme.transitions.fast,
            }}
          >
            {/* Left accent bar */}
            <div style={{
              width: '3px',
              background: accentColor,
              flexShrink: 0,
            }} />
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: '4px',
                lineHeight: 1.4,
              }}>
                {item.text}
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                lineHeight: 1.5,
              }}>
                {item.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InstallSection({ items }: { items: InstallItem[] }) {
  const getPriorityColor = (priority: InstallItem['priority']) => {
    switch (priority) {
      case 'high': return terminalColors.remove;   // Red - urgent
      case 'medium': return terminalColors.analysis; // Yellow
      case 'low': return theme.colors.textMuted;
      default: return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => {
        const priorityColor = getPriorityColor(item.priority);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 0',
              borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
            }}
          >
            <span style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              color: priorityColor,
              padding: '3px 8px',
              background: `${priorityColor}15`,
              borderRadius: theme.radius.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {item.priority}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.textPrimary,
                fontFamily: theme.fonts.mono,
                marginBottom: '4px',
              }}>
                <span style={{ color: terminalColors.install }}>+</span> {item.id}
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                lineHeight: 1.5,
              }}>
                {item.reason}
              </div>
            </div>
          </div>
        );
      })}
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
            padding: '14px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}
        >
          <span style={{ 
            color: terminalColors.remove, 
            fontSize: '18px',
            lineHeight: 1,
            fontWeight: theme.fontWeight.bold,
          }}>
            −
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: terminalColors.remove,
              fontFamily: theme.fonts.mono,
              marginBottom: '4px',
              textDecoration: 'line-through',
              opacity: 0.85,
            }}>
              {item.id}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              lineHeight: 1.5,
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
            padding: '14px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
          }}
        >
          <span style={{ 
            color: terminalColors.update, 
            fontSize: '16px',
            lineHeight: 1,
          }}>
            ↑
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.textPrimary,
                fontFamily: theme.fonts.mono,
              }}>
                {item.id}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: theme.fontSize.xs,
                fontFamily: theme.fonts.mono,
              }}>
                <span style={{ color: theme.colors.textMuted, opacity: 0.6 }}>{item.from}</span>
                <span style={{ color: theme.colors.textMuted }}>→</span>
                <span style={{ 
                  color: terminalColors.update, 
                  fontWeight: theme.fontWeight.medium,
                }}>
                  {item.to}
                </span>
              </div>
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              lineHeight: 1.5,
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
          padding: '18px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Recommendations
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
      }}>
        <Tab 
          active={activeTab === 'diagnosis'} 
          onClick={() => setActiveTab('diagnosis')} 
          count={recommendations.diagnosis.length}
          accentColor={terminalColors.analysis}
        >
          Analysis
        </Tab>
        <Tab 
          active={activeTab === 'install'} 
          onClick={() => setActiveTab('install')} 
          count={recommendations.install.length}
          accentColor={terminalColors.install}
        >
          Install
        </Tab>
        <Tab 
          active={activeTab === 'remove'} 
          onClick={() => setActiveTab('remove')} 
          count={recommendations.remove.length}
          accentColor={terminalColors.remove}
        >
          Remove
        </Tab>
        <Tab 
          active={activeTab === 'update'} 
          onClick={() => setActiveTab('update')} 
          count={recommendations.update.length}
          accentColor={terminalColors.update}
        >
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
