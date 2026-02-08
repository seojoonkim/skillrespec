import { useMemo } from 'react';
import { theme } from '../styles/theme';
import type { VizData, SkillCluster, SkillEdge, SkillNode } from '../types';

interface ConnectionStats {
  totalConnections: number;
  density: 'high' | 'medium' | 'low';
  isolatedCount: number;
  hubSkill: { name: string; count: number } | null;
}

interface DiagnosticReportInlineProps {
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
      padding: '4px 0',
    }}>
      <span style={{
        width: '90px',
        fontSize: theme.fontSize.xs,
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
        width: '36px',
        textAlign: 'right',
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.mono,
      }}>
        {value}%
      </span>
    </div>
  );
}

function getGradeInfo(score: number) {
  if (score >= 80) return { text: 'Excellent', color: theme.colors.success };
  if (score >= 65) return { text: 'Good', color: theme.colors.success };
  if (score >= 50) return { text: 'Average', color: theme.colors.warning };
  return { text: 'Poor', color: theme.colors.error };
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

function calculateConnectionStats(nodes: SkillNode[], edges: SkillEdge[]): ConnectionStats {
  const totalConnections = edges.length;
  const nodeCount = nodes.length;
  
  // Calculate density
  const densityRatio = nodeCount > 0 ? totalConnections / nodeCount : 0;
  let density: 'high' | 'medium' | 'low';
  if (densityRatio >= 1.5) density = 'high';
  else if (densityRatio >= 0.8) density = 'medium';
  else density = 'low';
  
  // Count connections per node
  const connectionCounts: Record<string, number> = {};
  nodes.forEach(n => { connectionCounts[n.id] = 0; });
  edges.forEach(e => {
    connectionCounts[e.source] = (connectionCounts[e.source] || 0) + 1;
    connectionCounts[e.target] = (connectionCounts[e.target] || 0) + 1;
  });
  
  // Find isolated nodes
  const isolatedCount = Object.values(connectionCounts).filter(c => c === 0).length;
  
  // Find hub skill
  let hubSkill: { name: string; count: number } | null = null;
  let maxConnections = 0;
  Object.entries(connectionCounts).forEach(([id, count]) => {
    if (count > maxConnections) {
      maxConnections = count;
      const node = nodes.find(n => n.id === id);
      hubSkill = { name: node?.name || id, count };
    }
  });
  
  return { totalConnections, density, isolatedCount, hubSkill };
}

export default function DiagnosticReportInline({
  data,
  healthScore,
}: DiagnosticReportInlineProps) {
  const gradeInfo = getGradeInfo(healthScore);
  const categoryStats = getCategoryStats(data.clusters, data.nodes);
  const connectionStats = calculateConnectionStats(data.nodes, data.edges);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Generate action items
  const actionItems = useMemo(() => {
    const items: { action: 'INSTALL' | 'REMOVE' | 'UPDATE'; skill: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    // Check for missing development/data skills
    const categories = new Set(data.nodes.map(n => n.category));
    if (!categories.has('development')) {
      items.push({ action: 'INSTALL', skill: 'sql-query', priority: 'high' });
    }
    
    // Check for duplicates (skills with -max or -pro-max suffix)
    const duplicateSkills = data.nodes.filter(n => 
      n.id.includes('-max') || n.id.includes('-pro-max')
    );
    duplicateSkills.forEach(s => {
      items.push({ action: 'REMOVE', skill: s.id, priority: 'medium' });
    });
    
    // Check for heavy skills needing updates
    const heavySkills = data.nodes.filter(n => n.tokens > 5000);
    heavySkills.slice(0, 1).forEach(s => {
      items.push({ action: 'UPDATE', skill: s.id, priority: 'low' });
    });
    
    return items.slice(0, 3);
  }, [data.nodes]);
  
  const actionColors = {
    INSTALL: theme.colors.success,
    REMOVE: theme.colors.error,
    UPDATE: theme.colors.warning,
  };
  
  return (
    <section style={{
      padding: '20px 24px',
      borderBottom: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgSecondary,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <h2 style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📊</span> DIAGNOSTIC OVERVIEW
        </h2>
        
        {/* Meta info */}
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          <span>Target: <span style={{ color: theme.colors.textSecondary }}>seojoonkim</span></span>
          <span>{dateStr}</span>
        </div>
      </div>
      
      {/* Main grid: Score + Category Distribution + Action Items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
      }}>
        {/* Overall Score */}
        <div style={{
          padding: '16px',
          background: theme.colors.bgTertiary,
          borderRadius: theme.radius.md,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '42px',
            fontWeight: theme.fontWeight.bold,
            color: gradeInfo.color,
            fontFamily: theme.fonts.mono,
            lineHeight: 1,
          }}>
            {healthScore}
          </div>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            marginTop: '8px',
          }}>
            Overall Score: <span style={{ color: gradeInfo.color, fontWeight: theme.fontWeight.semibold }}>{gradeInfo.text}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '12px',
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
          }}>
            <span>🛡️ {data.nodes.length} Skills</span>
            <span>📦 {data.clusters.length} Categories</span>
          </div>
        </div>
        
        {/* Category Distribution */}
        <div style={{
          padding: '16px',
          background: theme.colors.bgTertiary,
          borderRadius: theme.radius.md,
        }}>
          <h3 style={{
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            marginBottom: '12px',
          }}>
            Category Distribution
          </h3>
          {categoryStats.slice(0, 4).map((stat) => (
            <ProgressBar
              key={stat.name}
              value={stat.percentage}
              label={stat.name}
            />
          ))}
          {categoryStats.length > 4 && (
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginTop: '4px',
              textAlign: 'right',
            }}>
              +{categoryStats.length - 4} more
            </div>
          )}
        </div>
        
        {/* Action Items */}
        <div style={{
          padding: '16px',
          background: theme.colors.bgTertiary,
          borderRadius: theme.radius.md,
        }}>
          <h3 style={{
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            marginBottom: '12px',
          }}>
            Action Items
          </h3>
          {actionItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {actionItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: theme.fontSize.sm,
                }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: theme.colors.bgSecondary,
                    color: theme.colors.textMuted,
                    fontSize: '10px',
                    fontWeight: theme.fontWeight.semibold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: actionColors[item.action],
                    fontWeight: theme.fontWeight.semibold,
                    minWidth: '55px',
                  }}>
                    {item.action}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fonts.mono,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.skill}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
            }}>
              No immediate actions required ✓
            </div>
          )}
        </div>
        
        {/* Connections */}
        <div style={{
          padding: '16px',
          background: theme.colors.bgTertiary,
          borderRadius: theme.radius.md,
        }}>
          <h3 style={{
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            marginBottom: '12px',
          }}>
            Connections
          </h3>
          
          {/* Total connections with icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>🔗</span>
            <span style={{
              fontSize: '28px',
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.accent,
              fontFamily: theme.fonts.mono,
              lineHeight: 1,
            }}>
              {connectionStats.totalConnections}
            </span>
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              total
            </span>
          </div>
          
          {/* Stats list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: theme.fontSize.xs }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.colors.textMuted }}>연결 밀도</span>
              <span style={{ 
                color: connectionStats.density === 'high' ? theme.colors.success : 
                       connectionStats.density === 'medium' ? theme.colors.warning : 
                       theme.colors.error,
                fontWeight: theme.fontWeight.semibold,
              }}>
                {connectionStats.density === 'high' ? '높음' : 
                 connectionStats.density === 'medium' ? '중간' : '낮음'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.colors.textMuted }}>고립된 스킬</span>
              <span style={{ 
                color: connectionStats.isolatedCount > 0 ? theme.colors.warning : theme.colors.success,
                fontWeight: theme.fontWeight.semibold,
              }}>
                {connectionStats.isolatedCount}개
              </span>
            </div>
            {connectionStats.hubSkill && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: theme.colors.textMuted }}>허브 스킬</span>
                <span style={{ 
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.mono,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                }}>
                  {connectionStats.hubSkill.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
