// ═══════════════════════════════════════════════════════════
// History Panel - Skill change history with rollback capability
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { theme } from '../styles/theme';
import {
  getLocalHistory,
  groupHistoryByDate,
  getActionInfo,
  formatHistoryTimestamp,
  generateRollbackCommands,
  type SkillHistoryEntry,
  type RollbackCommand,
} from '../lib/skillHistory';
import type { SkillNode } from '../types';

interface HistoryPanelProps {
  currentSkills: SkillNode[];
  embedded?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Rollback Modal
// ═══════════════════════════════════════════════════════════

function RollbackModal({
  entry,
  commands,
  onClose,
}: {
  entry: SkillHistoryEntry;
  commands: RollbackCommand[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const allCommands = commands.map(c => c.command).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(allCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div
        style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>⏰</span> Rollback to this point
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              marginTop: '4px',
            }}>
              {formatHistoryTimestamp(entry.timestamp)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {commands.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: theme.colors.textMuted,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
              <div>No changes needed - you're already at this state!</div>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: '16px',
              }}>
                Run these commands to restore your skills:
              </div>

              {/* Command List */}
              <div style={{
                background: theme.colors.bgPrimary,
                borderRadius: theme.radius.lg,
                padding: '16px',
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
              }}>
                {commands.map((cmd, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 0',
                      borderBottom: i < commands.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: cmd.type === 'install' ? theme.colors.successGlow : theme.colors.errorGlow,
                      color: cmd.type === 'install' ? theme.colors.success : theme.colors.error,
                      fontSize: '12px',
                    }}>
                      {cmd.type === 'install' ? '+' : '-'}
                    </span>
                    <span style={{ color: theme.colors.textPrimary, flex: 1 }}>
                      {cmd.command}
                    </span>
                  </div>
                ))}
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: copied
                    ? theme.colors.success
                    : `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
                  border: 'none',
                  borderRadius: theme.radius.lg,
                  color: theme.colors.bgPrimary,
                  fontSize: theme.fontSize.md,
                  fontWeight: theme.fontWeight.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: theme.transitions.fast,
                }}
              >
                {copied ? (
                  <>✓ Copied!</>
                ) : (
                  <>📋 Copy All Commands</>
                )}
              </button>

              {/* Summary */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: theme.colors.bgTertiary,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.sm,
              }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: theme.colors.success }}>
                    +{commands.filter(c => c.type === 'install').length} install
                  </span>
                  <span style={{ color: theme.colors.error }}>
                    -{commands.filter(c => c.type === 'remove').length} remove
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// History Entry Item
// ═══════════════════════════════════════════════════════════

function HistoryEntryItem({
  entry,
  isLast,
  onRollback,
}: {
  entry: SkillHistoryEntry;
  isLast: boolean;
  onRollback: (entry: SkillHistoryEntry) => void;
}) {
  const actionInfo = getActionInfo(entry.action);

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      position: 'relative',
    }}>
      {/* Timeline Line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '28px',
          bottom: '-8px',
          width: '2px',
          background: theme.colors.border,
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bgTertiary,
        borderRadius: '50%',
        border: `2px solid ${actionInfo.color}`,
        fontSize: '12px',
        flexShrink: 0,
        zIndex: 1,
      }}>
        {actionInfo.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <div>
            <span style={{
              color: actionInfo.color,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {actionInfo.label}
            </span>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textPrimary,
              fontWeight: theme.fontWeight.medium,
              marginTop: '2px',
            }}>
              {entry.skillName}
            </div>
          </div>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
          }}>
            {formatHistoryTimestamp(entry.timestamp)}
          </span>
        </div>

        {/* Version info */}
        {(entry.previousVersion || entry.newVersion) && (
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            marginTop: '4px',
            fontFamily: theme.fonts.mono,
          }}>
            {entry.previousVersion && entry.newVersion ? (
              <>{entry.previousVersion} → {entry.newVersion}</>
            ) : entry.newVersion ? (
              <>v{entry.newVersion}</>
            ) : null}
          </div>
        )}

        {/* Rollback button */}
        <button
          onClick={() => onRollback(entry)}
          style={{
            marginTop: '8px',
            padding: '4px 10px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = theme.colors.accent;
            e.currentTarget.style.color = theme.colors.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          ⏪ Rollback to this point
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Panel
// ═══════════════════════════════════════════════════════════

export default function HistoryPanel({ currentSkills, embedded = false }: HistoryPanelProps) {
  const [history, setHistory] = useState<SkillHistoryEntry[]>([]);
  const [rollbackEntry, setRollbackEntry] = useState<SkillHistoryEntry | null>(null);

  // Load history on mount
  useEffect(() => {
    const localHistory = getLocalHistory();
    setHistory(localHistory);
  }, []);

  // Group by date
  const groupedHistory = useMemo(() => {
    return groupHistoryByDate(history);
  }, [history]);

  // Generate rollback commands when modal is open
  const rollbackCommands = useMemo(() => {
    if (!rollbackEntry) return [];
    return generateRollbackCommands(rollbackEntry.skillsSnapshot, currentSkills);
  }, [rollbackEntry, currentSkills]);

  const containerStyle = embedded ? {
    height: '100%',
    overflow: 'auto',
  } : {
    background: theme.colors.bgSecondary,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: embedded ? theme.colors.bgSecondary : 'transparent',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⏰</span>
          <span style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            History
          </span>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            background: theme.colors.bgTertiary,
            padding: '2px 8px',
            borderRadius: theme.radius.full,
          }}>
            {history.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.textMuted,
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
            <div style={{ fontSize: theme.fontSize.sm }}>No history yet</div>
            <div style={{
              fontSize: theme.fontSize.xs,
              marginTop: '4px',
              color: theme.colors.textSubtle,
            }}>
              Skill changes will appear here
            </div>
          </div>
        ) : (
          Array.from(groupedHistory.entries()).map(([date, entries]) => (
            <div key={date} style={{ marginBottom: '24px' }}>
              {/* Date Header */}
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                fontWeight: theme.fontWeight.medium,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {date}
              </div>

              {/* Entries */}
              {entries.map((entry, i) => (
                <HistoryEntryItem
                  key={entry.id}
                  entry={entry}
                  isLast={i === entries.length - 1}
                  onRollback={setRollbackEntry}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Rollback Modal */}
      {rollbackEntry && (
        <RollbackModal
          entry={rollbackEntry}
          commands={rollbackCommands}
          onClose={() => setRollbackEntry(null)}
        />
      )}
    </div>
  );
}

export { RollbackModal };
