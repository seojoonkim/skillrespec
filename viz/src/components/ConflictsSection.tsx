// ═══════════════════════════════════════════════════════════
// Conflicts Section - Smart conflict detection and resolution
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';
import {
  detectConflicts,
  getSeverityInfo,
  getConflictTypeInfo,
  getSafeCombinations,
  type SkillConflict,
  type SafeCombination,
} from '../lib/conflictRules';
import type { SkillNode } from '../types';

interface ConflictsSectionProps {
  skills: SkillNode[];
  expanded?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Conflict Card
// ═══════════════════════════════════════════════════════════

function ConflictCard({
  conflict,
  onApplyResolution,
}: {
  conflict: SkillConflict;
  onApplyResolution?: (command: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityInfo = getSeverityInfo(conflict.severity);
  const typeInfo = getConflictTypeInfo(conflict.type);

  return (
    <div style={{
      background: severityInfo.bgColor,
      border: `1px solid ${severityInfo.color}30`,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          {/* Severity Icon */}
          <span style={{ fontSize: '16px' }}>{severityInfo.icon}</span>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.fontWeight.medium,
                color: severityInfo.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {severityInfo.label}
              </span>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>

            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textPrimary,
              fontWeight: theme.fontWeight.medium,
            }}>
              {conflict.description}
            </div>

            {/* Skills involved */}
            <div style={{
              marginTop: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              {conflict.skillNames.map((name, i) => (
                <span
                  key={i}
                  style={{
                    padding: '2px 8px',
                    background: theme.colors.bgSecondary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.full,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Expand indicator */}
          <span style={{
            color: theme.colors.textMuted,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: theme.transitions.fast,
          }}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: '0 12px 12px 38px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          {/* Impact */}
          <div style={{
            padding: '12px 0',
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
          }}>
            <span style={{ fontWeight: theme.fontWeight.medium }}>Impact:</span>{' '}
            {conflict.impact}
          </div>

          {/* Resolutions */}
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
            marginBottom: '8px',
            fontWeight: theme.fontWeight.medium,
          }}>
            Suggested Resolutions:
          </div>

          {conflict.resolution.map((res, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                background: theme.colors.bgSecondary,
                borderRadius: theme.radius.md,
                marginBottom: '8px',
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.colors.bgTertiary,
                borderRadius: '50%',
                fontSize: '12px',
              }}>
                {res.type === 'disable' ? '🔌' :
                 res.type === 'configure' ? '⚙️' :
                 res.type === 'replace' ? '🔄' : '🔗'}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textPrimary,
                }}>
                  {res.description}
                </div>
                {res.command && (
                  <code style={{
                    display: 'block',
                    marginTop: '4px',
                    padding: '4px 8px',
                    background: theme.colors.bgPrimary,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.fontSize.xs,
                    fontFamily: theme.fonts.mono,
                    color: theme.colors.accent,
                  }}>
                    {res.command}
                  </code>
                )}
              </div>

              {res.command && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(res.command!);
                    onApplyResolution?.(res.command!);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: theme.colors.bgTertiary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md,
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.xs,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.colors.accent;
                    e.currentTarget.style.color = theme.colors.accent;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.color = theme.colors.textSecondary;
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Safe Combination Card
// ═══════════════════════════════════════════════════════════

function SafeCombinationCard({ combo }: { combo: SafeCombination }) {
  return (
    <div style={{
      padding: '12px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.borderLight}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>✅</span>
        <span style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.textPrimary,
        }}>
          {combo.name}
        </span>
      </div>

      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginBottom: '8px',
      }}>
        {combo.description}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
      }}>
        {combo.skills.map((skill, i) => (
          <span
            key={i}
            style={{
              padding: '2px 6px',
              background: theme.colors.successGlow,
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.xs,
              color: theme.colors.success,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Section
// ═══════════════════════════════════════════════════════════

export default function ConflictsSection({ skills, expanded = false }: ConflictsSectionProps) {
  const [showAll, setShowAll] = useState(expanded);

  const conflicts = useMemo(() => detectConflicts(skills), [skills]);
  const safeCombos = useMemo(() => getSafeCombinations(skills), [skills]);

  const criticalCount = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high').length;
  const totalCount = conflicts.length;

  if (totalCount === 0) {
    return (
      <div style={{
        padding: '20px',
        background: theme.colors.bgTertiary,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.colors.successGlow,
            borderRadius: '50%',
            fontSize: '20px',
          }}>
            ✓
          </span>
          <div>
            <div style={{
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.success,
            }}>
              No Conflicts Detected
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
            }}>
              Your skills are working in harmony
            </div>
          </div>
        </div>

        {/* Safe combinations */}
        {safeCombos.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              fontWeight: theme.fontWeight.medium,
              marginBottom: '8px',
            }}>
              Verified Safe Combinations:
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {safeCombos.slice(0, 2).map((combo, i) => (
                <SafeCombinationCard key={i} combo={combo} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: theme.colors.bgSecondary,
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <div style={{
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
            }}>
              Conflicts Detected
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
            }}>
              {criticalCount > 0 && (
                <span style={{ color: theme.colors.error }}>
                  {criticalCount} critical •{' '}
                </span>
              )}
              {totalCount} total
            </div>
          </div>
        </div>

        {totalCount > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.xs,
              cursor: 'pointer',
            }}
          >
            {showAll ? 'Show Less' : `Show All (${totalCount})`}
          </button>
        )}
      </div>

      {/* Conflicts List */}
      <div style={{ padding: '16px' }}>
        {(showAll ? conflicts : conflicts.slice(0, 3)).map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
          />
        ))}

        {!showAll && totalCount > 3 && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
          }}>
            +{totalCount - 3} more conflicts
          </div>
        )}
      </div>

      {/* Safe combinations suggestion */}
      {safeCombos.length > 0 && (
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
        }}>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.textSecondary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>💡</span> Recommended Safe Combinations
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {safeCombos.slice(0, 2).map((combo, i) => (
              <SafeCombinationCard key={i} combo={combo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ConflictCard, SafeCombinationCard };
