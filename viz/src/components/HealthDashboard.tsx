// ═══════════════════════════════════════════════════════════
// Health Dashboard - Overall skill health score visualization
// ═══════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { theme } from '../styles/theme';
import { 
  calculateDashboardHealth, 
  gradeToColor,
  type HealthGrade,
  type DashboardHealth,
  type SkillHealthScore,
} from '../lib/healthScore';
import type { SkillNode } from '../types';

interface HealthDashboardProps {
  nodes: SkillNode[];
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Grade Badge Component
// ═══════════════════════════════════════════════════════════

function GradeBadge({ 
  grade, 
  size = 'md',
  showGlow = true,
}: { 
  grade: HealthGrade; 
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}) {
  const color = gradeToColor(grade);
  const isDark = grade === 'A' || grade === 'B' || grade === 'F';

  const sizes = {
    sm: { font: '12px', padding: '2px 8px' },
    md: { font: '14px', padding: '4px 12px' },
    lg: { font: '20px', padding: '8px 20px' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: color,
      color: isDark ? '#fff' : '#000',
      fontSize: sizes[size].font,
      fontWeight: theme.fontWeight.bold,
      padding: sizes[size].padding,
      borderRadius: theme.radius.md,
      boxShadow: showGlow ? `0 0 16px ${color}40` : 'none',
      fontFamily: theme.fonts.mono,
    }}>
      {grade}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// Score Ring Component
// ═══════════════════════════════════════════════════════════

function ScoreRing({ 
  score, 
  grade,
  size = 80,
}: { 
  score: number; 
  grade: HealthGrade;
  size?: number;
}) {
  const color = gradeToColor(grade);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ 
      position: 'relative', 
      width: size, 
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.bgTertiary}
          strokeWidth={6}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <span style={{
          fontSize: theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.textPrimary,
          fontFamily: theme.fonts.mono,
        }}>
          {score}
        </span>
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Grade Distribution Bar
// ═══════════════════════════════════════════════════════════

function GradeDistribution({ distribution }: { distribution: Record<HealthGrade, number> }) {
  const grades: HealthGrade[] = ['A', 'B', 'C', 'D', 'F'];
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        height: '8px',
        borderRadius: theme.radius.full,
        overflow: 'hidden',
        background: theme.colors.bgTertiary,
      }}>
        {grades.map(grade => {
          const count = distribution[grade];
          if (count === 0) return null;
          const width = (count / total) * 100;
          return (
            <div
              key={grade}
              style={{
                width: `${width}%`,
                background: gradeToColor(grade),
                transition: 'width 0.3s ease',
              }}
            />
          );
        })}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
      }}>
        {grades.map(grade => (
          <div key={grade} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: gradeToColor(grade),
            }} />
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {grade}: {distribution[grade]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Skill Health List Item
// ═══════════════════════════════════════════════════════════

function SkillHealthItem({ item }: { item: SkillHealthScore }) {
  const color = gradeToColor(item.grade);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${theme.colors.borderLight}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textPrimary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.skillName}
        </div>
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          display: 'flex',
          gap: '8px',
          marginTop: '2px',
        }}>
          <span>🛡️ {item.components.security}</span>
          <span>📅 {item.components.freshness}</span>
          <span>📊 {item.components.usage}</span>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          color: color,
          fontFamily: theme.fonts.mono,
        }}>
          {item.overallScore}
        </span>
        <GradeBadge grade={item.grade} size="sm" showGlow={false} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════════════════

export default function HealthDashboard({ nodes, compact = false }: HealthDashboardProps) {
  const health = useMemo(() => calculateDashboardHealth(nodes), [nodes]);

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        background: theme.colors.bgTertiary,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <GradeBadge grade={health.averageGrade} size="md" />
        <div>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            Health Score: {health.averageScore}
          </div>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
          }}>
            {health.totalSkills} skills • {health.criticalCount} critical • {health.outdatedCount} outdated
          </div>
        </div>
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
        gap: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>💊</span>
        <div>
          <div style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            Skill Health Overview
          </div>
          <div style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
          }}>
            Security (40%) + Freshness (30%) + Usage (30%)
          </div>
        </div>
      </div>

      {/* Main Score */}
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <ScoreRing score={health.averageScore} grade={health.averageGrade} size={100} />
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <GradeBadge grade={health.averageGrade} size="lg" />
            <span style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
            }}>
              Average Grade
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            gap: '12px',
            fontSize: theme.fontSize.sm,
          }}>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Skills: </span>
              <span style={{ color: theme.colors.textPrimary, fontWeight: theme.fontWeight.semibold }}>
                {health.totalSkills}
              </span>
            </div>
            <div>
              <span style={{ color: theme.colors.error }}>Critical: </span>
              <span style={{ color: theme.colors.textPrimary, fontWeight: theme.fontWeight.semibold }}>
                {health.criticalCount}
              </span>
            </div>
            <div>
              <span style={{ color: theme.colors.warning }}>Outdated: </span>
              <span style={{ color: theme.colors.textPrimary, fontWeight: theme.fontWeight.semibold }}>
                {health.outdatedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.textSecondary,
          marginBottom: '12px',
        }}>
          Grade Distribution
        </div>
        <GradeDistribution distribution={health.gradeDistribution} />
      </div>

      {/* Top & Bottom Skills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderTop: `1px solid ${theme.colors.border}`,
      }}>
        {/* Top Healthy */}
        <div style={{
          padding: '16px',
          borderRight: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.success,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>✨</span> Healthiest
          </div>
          {health.topHealthy.slice(0, 3).map(item => (
            <SkillHealthItem key={item.skillId} item={item} />
          ))}
        </div>

        {/* Bottom Healthy */}
        <div style={{ padding: '16px' }}>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.error,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>⚠️</span> Needs Attention
          </div>
          {health.bottomHealthy.slice(0, 3).map(item => (
            <SkillHealthItem key={item.skillId} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Export sub-components for reuse
export { GradeBadge, ScoreRing, GradeDistribution };
