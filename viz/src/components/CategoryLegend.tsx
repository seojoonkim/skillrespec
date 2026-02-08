import { theme } from '../styles/theme';
import type { SkillCluster, SkillEdge, SkillNode } from '../types';

interface ConnectionStats {
  totalConnections: number;
  density: 'high' | 'medium' | 'low';
  isolatedCount: number;
  hubSkill: { name: string; count: number } | null;
}

interface CategoryLegendProps {
  clusters: SkillCluster[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  compact?: boolean;
  mobile?: boolean;
  embedded?: boolean;
  healthScore?: number;
  nodes?: SkillNode[];
  edges?: SkillEdge[];
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

export default function CategoryLegend({ 
  clusters, 
  selectedCategory, 
  onSelect,
  compact = false,
  mobile = false,
  embedded = false,
  healthScore,
  nodes = [],
  edges = [],
}: CategoryLegendProps) {
  const totalSkills = clusters.reduce((sum, c) => sum + c.skills.length, 0);
  const sortedClusters = [...clusters].sort((a, b) => b.skills.length - a.skills.length);
  
  const connectionStats = calculateConnectionStats(nodes, edges);
  const hasStats = healthScore !== undefined && nodes.length > 0;

  // Mobile layout
  if (mobile) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            Categories
          </h2>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.mono,
          }}>
            {totalSkills} total
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {/* All */}
          <button
            onClick={() => onSelect(null)}
            style={{
              padding: '8px 12px',
              background: selectedCategory === null ? theme.colors.bgTertiary : 'transparent',
              border: `1px solid ${selectedCategory === null ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            All ({totalSkills})
          </button>

          {sortedClusters.map(cluster => {
            const isSelected = selectedCategory === cluster.category;
            const color = theme.categoryColors[cluster.category] || theme.colors.textMuted;
            
            return (
              <button
                key={cluster.id}
                onClick={() => onSelect(isSelected ? null : cluster.category)}
                style={{
                  padding: '8px 12px',
                  background: isSelected ? theme.colors.bgTertiary : 'transparent',
                  border: `1px solid ${isSelected ? color : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: isSelected ? color : theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: color,
                }} />
                {cluster.name}
                <span style={{ color: theme.colors.textMuted }}>
                  {cluster.skills.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop/Tablet
  const panelWidth = compact ? 180 : 200;

  // Embedded mode: fill parent container
  const containerStyle: React.CSSProperties = embedded
    ? {
        width: '100%',
        height: '100%',
        minWidth: '160px',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        position: 'absolute',
        top: '80px',
        left: '20px',
        width: panelWidth,
        minWidth: '160px',
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      };

  return (
    <div style={containerStyle}>
      {/* Health & Connection Stats */}
      {hasStats && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          {/* Health */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: '14px' }}>❤️</span>
              <span style={{
                fontSize: theme.fontSize.md,
                fontWeight: theme.fontWeight.bold,
                color: healthScore! >= 65 ? theme.colors.success : healthScore! >= 50 ? theme.colors.warning : theme.colors.error,
                fontFamily: theme.fonts.mono,
              }}>
                {Math.round(healthScore!)}%
              </span>
              <span style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
              }}>
                Health
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              lineHeight: 1.4,
            }}>
              전체 스킬셋 건강도 (중복도, 균형, 최신성)
            </p>
          </div>
          
          {/* Connections */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: '14px' }}>🔗</span>
              <span style={{
                fontSize: theme.fontSize.md,
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.accent,
                fontFamily: theme.fonts.mono,
              }}>
                {connectionStats.totalConnections}
              </span>
              <span style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
              }}>
                Connections
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              lineHeight: 1.4,
            }}>
              스킬 간 연결 수 · 밀도{' '}
              <span style={{ 
                color: connectionStats.density === 'high' ? theme.colors.success : 
                       connectionStats.density === 'medium' ? theme.colors.warning : 
                       theme.colors.error 
              }}>
                {connectionStats.density === 'high' ? '높음' : 
                 connectionStats.density === 'medium' ? '중간' : '낮음'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
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
          {clusters.length} Categories
        </span>
        <span style={{ 
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.mono,
        }}>
          {totalSkills} skills
        </span>
      </div>

      <div style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 12px',
            background: selectedCategory === null ? theme.colors.bgTertiary : 'transparent',
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            textAlign: 'left',
            marginBottom: '4px',
            transition: 'background 0.15s ease',
          }}
        >
          <span>All</span>
          <span style={{ 
            fontFamily: theme.fonts.mono,
            fontSize: theme.fontSize.xs,
          }}>
            {totalSkills}
          </span>
        </button>

        {/* Category items */}
        {sortedClusters.map(cluster => {
          const isSelected = selectedCategory === cluster.category;
          const color = theme.categoryColors[cluster.category] || theme.colors.textMuted;
          const percentage = Math.round((cluster.skills.length / totalSkills) * 100);
          
          return (
            <button
              key={cluster.id}
              onClick={() => onSelect(isSelected ? null : cluster.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: isSelected ? theme.colors.bgTertiary : 'transparent',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                textAlign: 'left',
                marginBottom: '2px',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Color dot */}
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }} />
              
              {/* Name */}
              <span style={{ 
                flex: 1,
                fontWeight: isSelected ? theme.fontWeight.medium : theme.fontWeight.normal,
                color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
                textTransform: 'capitalize',
                wordBreak: 'break-word',
                lineHeight: 1.3,
              }}>
                {cluster.name}
              </span>
              
              {/* Count & percentage */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.xs,
              }}>
                <span style={{ color: isSelected ? color : theme.colors.textMuted }}>
                  {cluster.skills.length}
                </span>
                <span style={{ color: theme.colors.textMuted }}>
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
