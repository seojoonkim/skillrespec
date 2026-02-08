// ═══════════════════════════════════════════════════════════
// Diagnostic Report Modal - 스킬셋 종합 진단 보고서
// ═══════════════════════════════════════════════════════════

import { useTranslation } from '../i18n/useTranslation';
import type { VizData, SkillCluster } from '../types';

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VizData;
  healthScore: number;
}

// Progress bar component
function ProgressBar({ 
  value, 
  color, 
  label 
}: { 
  value: number; 
  color: string; 
  label: string;
}) {
  const percentage = Math.min(100, Math.max(0, value));
  const barWidth = 18;
  const filled = Math.round((percentage / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '4px 0',
    }}>
      <span style={{
        width: '100px',
        fontSize: '12px',
        color: '#888',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: color,
        letterSpacing: '0.5px',
      }}>
        {bar}
      </span>
      <span style={{
        width: '40px',
        textAlign: 'right',
        fontSize: '12px',
        color: color,
        fontWeight: 600,
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {percentage}%
      </span>
    </div>
  );
}

function getGradeInfo(score: number, t: ReturnType<typeof useTranslation>['t']) {
  if (score >= 80) return { text: t.header.grade.excellent, color: '#10b981', emoji: '🏆' };
  if (score >= 65) return { text: t.header.grade.good, color: '#22c55e', emoji: '🎯' };
  if (score >= 50) return { text: t.header.grade.average, color: '#f59e0b', emoji: '📊' };
  return { text: t.header.grade.poor, color: '#ef4444', emoji: '⚠️' };
}

function getCategoryStats(clusters: SkillCluster[], nodes: VizData['nodes']) {
  const totalNodes = nodes.length;
  return clusters
    .map(cluster => ({
      name: cluster.name,
      color: cluster.color,
      count: cluster.skills.length,
      percentage: Math.round((cluster.skills.length / totalNodes) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

function analyzeStrengths(clusters: SkillCluster[], nodes: VizData['nodes'], t: ReturnType<typeof useTranslation>['t']) {
  const strengths: string[] = [];
  const stats = getCategoryStats(clusters, nodes);
  
  // Check for marketing strength
  const marketing = stats.find(s => s.name.toLowerCase() === 'marketing');
  if (marketing && marketing.percentage >= 15) {
    strengths.push(`✅ ${t.diagnosis.messages.marketingStrong}`);
  }
  
  // Check for security
  const security = stats.find(s => s.name.toLowerCase() === 'security');
  if (security && security.count >= 2) {
    strengths.push(`✅ ${t.diagnosis.messages.securityPresent} (prompt-guard)`);
  }
  
  // Well balanced check
  const topCategory = stats[0];
  if (topCategory && topCategory.percentage < 30) {
    strengths.push(`✅ ${t.diagnosis.messages.wellBalanced}`);
  }
  
  // Good coverage
  if (clusters.length >= 6) {
    strengths.push(`✅ ${t.diagnosis.messages.goodCoverage}`);
  }
  
  return strengths;
}

function analyzeImprovements(
  clusters: SkillCluster[], 
  nodes: VizData['nodes'], 
  t: ReturnType<typeof useTranslation>['t']
) {
  const improvements: string[] = [];
  const stats = getCategoryStats(clusters, nodes);
  
  // Check for marketing overload
  const marketing = stats.find(s => s.name.toLowerCase() === 'marketing');
  if (marketing && marketing.percentage > 30) {
    improvements.push(`⚠️ ${t.diagnosis.messages.marketingOverload}`);
  }
  
  // Check for missing data/analytics
  const hasDataAnalytics = clusters.some(c => 
    c.name.toLowerCase().includes('data') || 
    c.name.toLowerCase().includes('analytics')
  );
  if (!hasDataAnalytics) {
    improvements.push(`❌ ${t.diagnosis.messages.noDataAnalytics}`);
  }
  
  // Check for DevOps
  const hasDevOps = nodes.some(n => 
    n.name.toLowerCase().includes('devops') || 
    n.name.toLowerCase().includes('ci') ||
    n.name.toLowerCase().includes('docker')
  );
  if (!hasDevOps) {
    improvements.push(`❌ ${t.diagnosis.messages.noDevOps}`);
  }
  
  // Low development
  const development = stats.find(s => s.name.toLowerCase() === 'development');
  if (development && development.percentage < 15) {
    improvements.push(`⚠️ ${t.diagnosis.messages.lowDevelopment}`);
  }
  
  return improvements;
}

function generateActionItems(t: ReturnType<typeof useTranslation>['t']) {
  // These would come from actual analysis in production
  return [
    {
      action: t.diagnosis.actions.install,
      skill: 'sql-query',
      priority: t.diagnosis.priority.high,
      color: '#ef4444',
    },
    {
      action: t.diagnosis.actions.remove,
      skill: 'ui-ux-pro-max-skill',
      priority: t.diagnosis.priority.medium,
      color: '#f59e0b',
    },
    {
      action: t.diagnosis.actions.update,
      skill: 'prompt-guard v3.0',
      priority: t.diagnosis.priority.low,
      color: '#22c55e',
    },
  ];
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
  const strengths = analyzeStrengths(data.clusters, data.nodes, t);
  const improvements = analyzeImprovements(data.clusters, data.nodes, t);
  const actionItems = generateActionItems(t);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString(
    language === 'ko' ? 'ko-KR' : 
    language === 'ja' ? 'ja-JP' : 
    language === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 500,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 480px)',
        maxHeight: '85vh',
        background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        overflow: 'hidden',
        zIndex: 501,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(0, 255, 255, 0.1)',
        animation: 'modalSlideIn 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(0,255,255,0.05) 0%, rgba(255,0,255,0.05) 100%)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {t.diagnosis.title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#888',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.3)';
                e.currentTarget.style.color = '#ff4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#888';
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Meta info */}
          <div style={{
            marginTop: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '12px',
            color: '#666',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            <div><span style={{ color: '#888' }}>{t.diagnosis.target}:</span> Simon (seojoonkim)</div>
            <div><span style={{ color: '#888' }}>{t.diagnosis.dateTime}:</span> {dateStr}</div>
            <div><span style={{ color: '#888' }}>{t.diagnosis.totalSkills}:</span> {data.nodes.length}</div>
            <div><span style={{ color: '#888' }}>{t.diagnosis.categories}:</span> {data.clusters.length}</div>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div style={{
          padding: '20px 24px',
          maxHeight: 'calc(85vh - 160px)',
          overflowY: 'auto',
        }}>
          {/* Overall Score */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: `${gradeInfo.color}10`,
            border: `1px solid ${gradeInfo.color}30`,
            borderRadius: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{gradeInfo.emoji}</div>
            <div style={{
              fontSize: '36px',
              fontWeight: 800,
              color: gradeInfo.color,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {healthScore}/100
            </div>
            <div style={{
              fontSize: '14px',
              color: gradeInfo.color,
              fontWeight: 600,
              marginTop: '4px',
            }}>
              {t.diagnosis.overallScore}: {gradeInfo.text}
            </div>
          </div>
          
          {/* Category Distribution */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#888',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              ━━━ {t.diagnosis.categoryDistribution} ━━━
            </h3>
            {categoryStats.slice(0, 5).map((stat) => (
              <ProgressBar
                key={stat.name}
                value={stat.percentage}
                color={stat.color}
                label={stat.name}
              />
            ))}
          </div>
          
          {/* Strengths */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#888',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              ━━━ {t.diagnosis.strengths} ━━━
            </h3>
            {strengths.length > 0 ? (
              strengths.map((item, i) => (
                <div key={i} style={{
                  fontSize: '13px',
                  color: '#10b981',
                  padding: '6px 0',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}>
                  {item}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#666' }}>—</div>
            )}
          </div>
          
          {/* Improvements */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#888',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              ━━━ {t.diagnosis.improvements} ━━━
            </h3>
            {improvements.length > 0 ? (
              improvements.map((item, i) => (
                <div key={i} style={{
                  fontSize: '13px',
                  color: item.startsWith('⚠️') ? '#f59e0b' : '#ef4444',
                  padding: '6px 0',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}>
                  {item}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#666' }}>—</div>
            )}
          </div>
          
          {/* Action Items */}
          <div>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#888',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              ━━━ {t.diagnosis.actionItems} ━━━
            </h3>
            {actionItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: `${item.color}20`,
                  color: item.color,
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '10px',
                    color: item.color,
                    fontWeight: 600,
                    background: `${item.color}15`,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginRight: '8px',
                  }}>
                    {item.action}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: '#ddd',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    {item.skill}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  color: item.color,
                  fontWeight: 500,
                }}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
