// ═══════════════════════════════════════════════════════════
// Lint Panel - SKILL.md Linter Results
// AgentLinter-style validation display
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { theme } from '../styles/theme';
import {
  lintSkillFromNode,
  gradeColor,
  severityColor,
  severityIcon,
  type LintResult,
  type LintGrade,
} from '../lib/skillLinter';
import type { SkillNode } from '../types';

interface LintPanelProps {
  skills?: SkillNode[];
  selectedSkill?: SkillNode | null;
  embedded?: boolean;
}

export default function LintPanel({
  skills = [],
  selectedSkill = null,
  embedded = false,
}: LintPanelProps) {
  const [results, setResults] = useState<Map<string, LintResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Auto-lint selected skill
  useEffect(() => {
    if (selectedSkill && !results.has(selectedSkill.id)) {
      lintSingle(selectedSkill.id);
    }
    if (selectedSkill) {
      setExpandedSkill(selectedSkill.id);
    }
  }, [selectedSkill]);

  const lintSingle = (skillId: string) => {
    const result = lintSkillFromNode(skillId);
    setResults((prev) => new Map(prev).set(skillId, result));
  };

  const lintAll = () => {
    setLoading(true);
    const newResults = new Map<string, LintResult>();
    skills.forEach((skill) => {
      newResults.set(skill.id, lintSkillFromNode(skill.id));
    });
    setResults(newResults);
    setLoading(false);
  };

  // Calculate summary stats
  const summary = useMemo(() => {
    if (results.size === 0) return null;

    const grades: Record<LintGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalScore = 0;

    results.forEach((r) => {
      grades[r.grade]++;
      totalScore += r.score;
    });

    return {
      grades,
      avgScore: Math.round(totalScore / results.size),
      total: results.size,
    };
  }, [results]);

  const GradeCircle = ({ grade, size = 36 }: { grade: LintGrade; size?: number }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${gradeColor(grade)}20`,
      border: `2px solid ${gradeColor(grade)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      fontWeight: theme.fontWeight.bold,
      color: gradeColor(grade),
    }}>
      {grade}
    </div>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: embedded ? 'transparent' : theme.colors.bgSecondary,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🔍</span>
        <span style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
        }}>
          SKILL.md Linter
        </span>
        <button
          onClick={lintAll}
          disabled={loading || skills.length === 0}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
            border: 'none',
            borderRadius: theme.radius.full,
            color: theme.colors.bgPrimary,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            fontFamily: theme.fonts.sans,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '...' : '⚡ Lint All'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
                color: gradeColor(
                  summary.avgScore >= 90 ? 'A' :
                  summary.avgScore >= 80 ? 'B' :
                  summary.avgScore >= 70 ? 'C' :
                  summary.avgScore >= 60 ? 'D' : 'F'
                ),
              }}>
                {summary.avgScore}
              </span>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
              }}>
                avg score
              </span>
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {summary.total} skills analyzed
            </div>
          </div>

          {/* Grade distribution */}
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            {(['A', 'B', 'C', 'D', 'F'] as LintGrade[]).map((grade) => (
              <div
                key={grade}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px',
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  color: gradeColor(grade),
                }}>
                  {summary.grades[grade]}
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  {grade}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {results.size === 0 && !selectedSkill ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '150px',
            color: theme.colors.textMuted,
            textAlign: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '24px' }}>🔍</span>
            <span style={{ fontSize: theme.fontSize.sm }}>
              Select a skill or click "Lint All" to analyze
            </span>
          </div>
        ) : (
          Array.from(results.entries()).map(([skillId, result]) => {
            const isExpanded = expandedSkill === skillId;
            const skill = skills.find((s) => s.id === skillId);

            return (
              <div
                key={skillId}
                style={{
                  marginBottom: '8px',
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  overflow: 'hidden',
                }}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedSkill(isExpanded ? null : skillId)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontFamily: theme.fonts.sans,
                  }}
                >
                  <GradeCircle grade={result.grade} size={32} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.textPrimary,
                    }}>
                      {skill?.name || skillId}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textMuted,
                    }}>
                      {result.summary}
                    </div>
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.bold,
                    color: gradeColor(result.grade),
                  }}>
                    {result.score}%
                  </div>
                  <span style={{
                    color: theme.colors.textMuted,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: theme.transitions.fast,
                  }}>
                    ▼
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    padding: '0 12px 12px',
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}>
                    {/* Issues */}
                    {result.issues.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{
                          fontSize: theme.fontSize.xs,
                          fontWeight: theme.fontWeight.semibold,
                          color: theme.colors.textMuted,
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          Issues ({result.issues.length})
                        </div>
                        {result.issues.map((issue, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '8px',
                              marginBottom: '4px',
                              background: `${severityColor(issue.severity)}10`,
                              border: `1px solid ${severityColor(issue.severity)}30`,
                              borderRadius: theme.radius.sm,
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                            }}>
                              <span>{severityIcon(issue.severity)}</span>
                              <div>
                                <div style={{
                                  fontSize: theme.fontSize.sm,
                                  color: theme.colors.textPrimary,
                                }}>
                                  {issue.message}
                                </div>
                                {issue.fix && (
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.textMuted,
                                    marginTop: '4px',
                                    fontFamily: theme.fonts.mono,
                                  }}>
                                    💡 {issue.fix}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Checks */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.semibold,
                        color: theme.colors.textMuted,
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Checks
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px',
                      }}>
                        {result.checks.map((check) => (
                          <div
                            key={check.id}
                            style={{
                              padding: '6px 8px',
                              background: check.passed ? `${theme.colors.success}10` : theme.colors.bgSecondary,
                              border: `1px solid ${check.passed ? theme.colors.success : theme.colors.border}30`,
                              borderRadius: theme.radius.sm,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span style={{ fontSize: '10px' }}>
                              {check.passed ? '✅' : '⬜'}
                            </span>
                            <span style={{
                              fontSize: theme.fontSize.xs,
                              color: check.passed ? theme.colors.success : theme.colors.textMuted,
                              flex: 1,
                            }}>
                              {check.name}
                            </span>
                            <span style={{
                              fontSize: theme.fontSize.xs,
                              color: theme.colors.textMuted,
                            }}>
                              {check.points}/{check.maxPoints}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
      }}>
        Powered by AgentLinter validation
      </div>
    </div>
  );
}
