import { useTranslation } from '../i18n/useTranslation';
import { theme } from '../styles/theme';
import type { VizData, SkillCluster } from '../types';

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VizData;
  healthScore: number;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const color = theme.categoryColors[label.toLowerCase()] || theme.colors.accent;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '6px 0',
    }}>
      <span style={{
        width: '100px',
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textTransform: 'capitalize',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '6px',
        background: theme.colors.bgTertiary,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, value)}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
        }} />
      </div>
      <span style={{
        width: '40px',
        textAlign: 'right',
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.mono,
      }}>
        {value}%
      </span>
    </div>
  );
}

function getGradeInfo(score: number, t: ReturnType<typeof useTranslation>['t']) {
  if (score >= 80) return { text: t.header.grade.excellent, color: theme.colors.success };
  if (score >= 65) return { text: t.header.grade.good, color: theme.colors.success };
  if (score >= 50) return { text: t.header.grade.average, color: theme.colors.warning };
  return { text: t.header.grade.poor, color: theme.colors.error };
}

function getCategoryStats(clusters: SkillCluster[], nodes: VizData['nodes']) {
  const totalNodes = nodes.length;
  return clusters
    .map(cluster => ({
      name: cluster.name,
      percentage: Math.round((cluster.skills.length / totalNodes) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export default function DiagnosticReportModal({
  isOpen,
  onClose,
  data,
  healthScore,
}: DiagnosticReportModalProps) {
  const { t, language } = useTranslation();
  
  if (!isOpen) return null;
  
  const gradeInfo = getGradeInfo(healthScore, t);
  const categoryStats = getCategoryStats(data.clusters, data.nodes);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString(
    language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 500,
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 440px)',
        maxHeight: '85vh',
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        zIndex: 501,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: theme.fonts.sans,
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            {t.diagnosis.title}
          </h2>
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
            ×
          </button>
        </div>
        
        {/* Meta */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          <div>{t.diagnosis.target}: <span style={{ color: theme.colors.textSecondary }}>seojoonkim</span></div>
          <div>{t.diagnosis.dateTime}: <span style={{ color: theme.colors.textSecondary }}>{dateStr}</span></div>
          <div>{t.diagnosis.totalSkills}: <span style={{ color: theme.colors.textSecondary }}>{data.nodes.length}</span></div>
          <div>{t.diagnosis.categories}: <span style={{ color: theme.colors.textSecondary }}>{data.clusters.length}</span></div>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Score */}
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.md,
            marginBottom: '24px',
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: theme.fontWeight.bold,
              color: gradeInfo.color,
              fontFamily: theme.fonts.mono,
              lineHeight: 1,
            }}>
              {healthScore}
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              marginTop: '8px',
            }}>
              {t.diagnosis.overallScore}: <span style={{ color: gradeInfo.color }}>{gradeInfo.text}</span>
            </div>
          </div>
          
          {/* Category Distribution */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {t.diagnosis.categoryDistribution}
            </h3>
            {categoryStats.slice(0, 5).map((stat) => (
              <ProgressBar
                key={stat.name}
                value={stat.percentage}
                label={stat.name}
              />
            ))}
          </div>
          
          {/* Strengths */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {t.diagnosis.strengths}
            </h3>
            <div style={{
              padding: '12px',
              background: theme.colors.bgTertiary,
              borderLeft: `2px solid ${theme.colors.success}`,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}>
              {t.diagnosis.messages.securityPresent}
            </div>
          </div>
          
          {/* Improvements */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {t.diagnosis.improvements}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                padding: '12px',
                background: theme.colors.bgTertiary,
                borderLeft: `2px solid ${theme.colors.warning}`,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}>
                {t.diagnosis.messages.noDataAnalytics}
              </div>
              <div style={{
                padding: '12px',
                background: theme.colors.bgTertiary,
                borderLeft: `2px solid ${theme.colors.warning}`,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}>
                {t.diagnosis.messages.noDevOps}
              </div>
            </div>
          </div>
          
          {/* Action Items */}
          <div>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {t.diagnosis.actionItems}
            </h3>
            
            {[
              { action: t.diagnosis.actions.install, skill: 'sql-query', priority: 'high' },
              { action: t.diagnosis.actions.remove, skill: 'ui-ux-pro-max-skill', priority: 'medium' },
              { action: t.diagnosis.actions.update, skill: 'prompt-guard v3.0', priority: 'low' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: i < 2 ? `1px solid ${theme.colors.border}` : 'none',
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.semibold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: item.priority === 'high' ? theme.colors.error : 
                           item.priority === 'medium' ? theme.colors.warning : theme.colors.textMuted,
                    textTransform: 'uppercase',
                    marginRight: '8px',
                  }}>
                    {item.action}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fonts.mono,
                  }}>
                    {item.skill}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
