import { useState, useCallback } from 'react';
import { recommendations } from '../data/recommendations';
import { theme } from '../styles/theme';
import type { DiagnosisItem, InstallItem, RemoveItem, UpdateItem, SecurityItem } from '../data/recommendations';

// ═══════════════════════════════════════════════════════════
// Terminal-style accent colors
// ═══════════════════════════════════════════════════════════
const terminalColors = {
  analysis: '#FFC107',  // Yellow - warning/attention
  install: '#4ADE80',   // Green - add/success
  remove: '#EF4444',    // Red - delete/danger
  update: '#22D3EE',    // Cyan - info/update
  security: '#F97316',  // Orange - security/risk
} as const;

// Vulnerability level colors
const riskColors = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
} as const;

// ═══════════════════════════════════════════════════════════
// Clipboard Helper + Toast
// ═══════════════════════════════════════════════════════════
function copyToClipboard(text: string, onSuccess?: () => void) {
  navigator.clipboard.writeText(text).then(() => {
    onSuccess?.();
  }).catch((err) => {
    console.error('Failed to copy:', err);
  });
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(20px)'}`,
      padding: '10px 20px',
      background: theme.colors.bgElevated,
      border: `1px solid ${theme.colors.accent}`,
      borderRadius: theme.radius.full,
      color: theme.colors.textPrimary,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.mono,
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'all 0.2s ease',
      pointerEvents: 'none',
      boxShadow: `0 4px 20px ${theme.colors.accentGlow}`,
    }}>
      ✓ {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Action Button Component
// ═══════════════════════════════════════════════════════════
interface ActionButtonProps {
  icon: string;
  label: string;
  command: string;
  color: string;
  onCopy: (msg: string) => void;
}

function ActionButton({ icon, label, command, color, onCopy }: ActionButtonProps) {
  const [hover, setHover] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(command, () => onCopy(`Copied: ${command}`));
  };
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Copy: ${command}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: hover ? `${color}20` : 'transparent',
        border: `1px solid ${hover ? color : theme.colors.border}`,
        borderRadius: theme.radius.sm,
        color: hover ? color : theme.colors.textMuted,
        fontSize: '10px',
        fontFamily: theme.fonts.mono,
        cursor: 'pointer',
        transition: theme.transitions.fast,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Export Report Generator
// ═══════════════════════════════════════════════════════════
function generateMarkdownReport(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  
  let md = `# SkillRespec Analysis Report\n\n`;
  md += `**Generated:** ${dateStr} ${timeStr}\n\n`;
  md += `---\n\n`;
  
  // Summary
  md += `## 📊 Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Diagnosis Items | ${recommendations.diagnosis.length} |\n`;
  md += `| Skills to Install | ${recommendations.install.length} |\n`;
  md += `| Skills to Remove | ${recommendations.remove.length} |\n`;
  md += `| Skills to Update | ${recommendations.update.length} |\n`;
  md += `| Security Alerts | ${recommendations.security.length} |\n\n`;
  
  // Diagnosis
  md += `## 🔍 Diagnosis\n\n`;
  recommendations.diagnosis.forEach(item => {
    const icon = item.type === 'success' ? '✅' : item.type === 'warning' ? '⚠️' : '❌';
    md += `- ${icon} **${item.text}**\n`;
    md += `  - ${item.detail}\n`;
  });
  md += `\n`;
  
  // Security Alerts
  if (recommendations.security.length > 0) {
    md += `## 🔒 Security Alerts\n\n`;
    recommendations.security.forEach(item => {
      const riskEmoji = item.risk === 'critical' ? '🔴' : item.risk === 'high' ? '🟠' : item.risk === 'medium' ? '🟡' : '🟢';
      md += `### ${riskEmoji} ${item.id} (${item.risk.toUpperCase()} - Score: ${item.score})\n\n`;
      md += `- **Reason:** ${item.reason}\n`;
      md += `- **Action:** ${item.action}\n`;
      if (item.permissions?.length) {
        md += `- **Permissions:** ${item.permissions.join(', ')}\n`;
      }
      md += `\n`;
    });
  }
  
  // Install Recommendations
  if (recommendations.install.length > 0) {
    md += `## ⬇️ Install Recommendations\n\n`;
    md += `| Skill | Priority | Reason |\n`;
    md += `|-------|----------|--------|\n`;
    recommendations.install.forEach(item => {
      md += `| \`${item.id}\` | ${item.priority.toUpperCase()} | ${item.reason} |\n`;
    });
    md += `\n`;
    md += `**Commands:**\n\`\`\`bash\n`;
    recommendations.install.forEach(item => {
      md += `clawhub install ${item.id}\n`;
    });
    md += `\`\`\`\n\n`;
  }
  
  // Remove Recommendations
  if (recommendations.remove.length > 0) {
    md += `## 🗑️ Remove Recommendations\n\n`;
    recommendations.remove.forEach(item => {
      md += `- **${item.id}**\n`;
      md += `  - Reason: ${item.reason}\n`;
      if (item.conflictsWith) {
        md += `  - Conflicts with: \`${item.conflictsWith}\`\n`;
      }
    });
    md += `\n`;
    md += `**Commands:**\n\`\`\`bash\n`;
    recommendations.remove.forEach(item => {
      md += `clawhub remove ${item.id}\n`;
    });
    md += `\`\`\`\n\n`;
  }
  
  // Update Recommendations
  if (recommendations.update.length > 0) {
    md += `## 🔄 Update Recommendations\n\n`;
    md += `| Skill | Current | Latest | Reason |\n`;
    md += `|-------|---------|--------|--------|\n`;
    recommendations.update.forEach(item => {
      md += `| \`${item.id}\` | ${item.from} | ${item.to} | ${item.reason} |\n`;
    });
    md += `\n`;
    md += `**Commands:**\n\`\`\`bash\n`;
    md += `# Update all\nclawhub update --all\n\n`;
    md += `# Or individually:\n`;
    recommendations.update.forEach(item => {
      md += `clawhub update ${item.id}\n`;
    });
    md += `\`\`\`\n\n`;
  }
  
  md += `---\n\n`;
  md += `*Generated by [SkillRespec](https://skillrespec.vercel.app)*\n`;
  
  return md;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
        padding: '8px 4px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? (accentColor || theme.colors.textPrimary) : 'transparent'}`,
        color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        fontSize: '11px',
        fontWeight: theme.fontWeight.medium,
        fontFamily: theme.fonts.sans,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
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
      <span>{children}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: '12px',
          fontFamily: theme.fonts.mono,
          fontWeight: theme.fontWeight.bold,
          color: accentColor || theme.colors.textMuted,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Section Components - With Action Buttons
// ═══════════════════════════════════════════════════════════
function DiagnosisSection({ items, onCopy }: { items: DiagnosisItem[]; onCopy: (msg: string) => void }) {
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

function InstallSection({ items, onCopy }: { items: InstallItem[]; onCopy: (msg: string) => void }) {
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.mono,
                }}>
                  <span style={{ color: terminalColors.install }}>+</span> {item.id}
                </span>
                <ActionButton
                  icon="⬇️"
                  label="Install"
                  command={`clawhub install ${item.id}`}
                  color={terminalColors.install}
                  onCopy={onCopy}
                />
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

function RemoveSection({ items, onCopy }: { items: RemoveItem[]; onCopy: (msg: string) => void }) {
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                color: terminalColors.remove,
                fontFamily: theme.fonts.mono,
                textDecoration: 'line-through',
                opacity: 0.85,
              }}>
                {item.id}
              </span>
              <ActionButton
                icon="🗑️"
                label="Remove"
                command={`clawhub remove ${item.id}`}
                color={terminalColors.remove}
                onCopy={onCopy}
              />
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

function UpdateSection({ items, onCopy }: { items: UpdateItem[]; onCopy: (msg: string) => void }) {
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
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '6px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
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
              <ActionButton
                icon="📦"
                label="Update"
                command={`clawhub update ${item.id}`}
                color={terminalColors.update}
                onCopy={onCopy}
              />
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

function SecuritySection({ items, onCopy }: { items: SecurityItem[]; onCopy: (msg: string) => void }) {
  return (
    <div style={{ padding: '16px' }}>
      {items.map((item, i) => {
        const riskColor = riskColors[item.risk];
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
              background: riskColor,
              flexShrink: 0,
            }} />
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.mono,
                }}>
                  🔓 {item.id}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: riskColor,
                    padding: '2px 8px',
                    background: `${riskColor}15`,
                    borderRadius: theme.radius.sm,
                    textTransform: 'uppercase',
                  }}>
                    {item.risk} ({item.score})
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginBottom: '8px',
                lineHeight: 1.5,
              }}>
                {item.reason}
              </div>
              {item.permissions && item.permissions.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}>
                  {item.permissions.map((perm, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: theme.colors.bgSecondary,
                        borderRadius: theme.radius.sm,
                        color: theme.colors.textMuted,
                        fontFamily: theme.fonts.mono,
                      }}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: theme.fontSize.xs,
                  color: terminalColors.security,
                  fontWeight: theme.fontWeight.medium,
                }}>
                  → {item.action}
                </span>
                <ActionButton
                  icon="🔍"
                  label="Audit"
                  command={`clawhub audit ${item.id}`}
                  color={terminalColors.security}
                  onCopy={onCopy}
                />
              </div>
            </div>
          </div>
        );
      })}
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
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'install' | 'remove' | 'update' | 'security'>('diagnosis');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const handleExport = () => {
    const markdown = generateMarkdownReport();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadMarkdown(markdown, `skillrespec-report-${dateStr}.md`);
    showToast('Report downloaded!');
  };

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
      {/* Header with Export Button */}
      {!isMobile && (
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.xs,
              fontFamily: theme.fonts.sans,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accent;
              e.currentTarget.style.color = theme.colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border;
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
          >
            <span>📊</span>
            Export
          </button>
        </div>
      )}

      {/* Mobile Header with Export */}
      {isMobile && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            Recommendations
          </span>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: theme.colors.accent + '20',
              border: 'none',
              borderRadius: theme.radius.sm,
              color: theme.colors.accent,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            📊 Export
          </button>
        </div>
      )}

      {/* Tabs - Vertical layout (name above, count below) */}
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
          active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')} 
          count={recommendations.security.length}
          accentColor={terminalColors.security}
        >
          Security
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
        {activeTab === 'diagnosis' && <DiagnosisSection items={recommendations.diagnosis} onCopy={showToast} />}
        {activeTab === 'security' && <SecuritySection items={recommendations.security} onCopy={showToast} />}
        {activeTab === 'install' && <InstallSection items={recommendations.install} onCopy={showToast} />}
        {activeTab === 'remove' && <RemoveSection items={recommendations.remove} onCopy={showToast} />}
        {activeTab === 'update' && <UpdateSection items={recommendations.update} onCopy={showToast} />}
      </div>

      {/* Toast Notification */}
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
