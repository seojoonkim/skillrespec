// ═══════════════════════════════════════════════════════════
// Category Legend - Glass morphism sidebar
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { theme, glass } from '../styles/theme';
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
  onSelectNode?: (node: SkillNode) => void;
  selectedNode?: SkillNode | null;
}

function calculateConnectionStats(nodes: SkillNode[], edges: SkillEdge[]): ConnectionStats {
  const totalConnections = edges.length;
  const nodeCount = nodes.length;
  
  const densityRatio = nodeCount > 0 ? totalConnections / nodeCount : 0;
  let density: 'high' | 'medium' | 'low';
  if (densityRatio >= 1.5) density = 'high';
  else if (densityRatio >= 0.8) density = 'medium';
  else density = 'low';
  
  const connectionCounts: Record<string, number> = {};
  nodes.forEach(n => { connectionCounts[n.id] = 0; });
  edges.forEach(e => {
    connectionCounts[e.source] = (connectionCounts[e.source] || 0) + 1;
    connectionCounts[e.target] = (connectionCounts[e.target] || 0) + 1;
  });
  
  const isolatedCount = Object.values(connectionCounts).filter(c => c === 0).length;
  
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

function getDensityLabel(density: 'high' | 'medium' | 'low'): string {
  switch (density) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
  }
}

function getDensityColor(density: 'high' | 'medium' | 'low'): string {
  switch (density) {
    case 'high': return theme.colors.success;
    case 'medium': return theme.colors.warning;
    case 'low': return theme.colors.error;
  }
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
  onSelectNode,
  selectedNode,
}: CategoryLegendProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const totalSkills = clusters.reduce((sum, c) => sum + c.skills.length, 0);
  const sortedClusters = [...clusters].sort((a, b) => b.skills.length - a.skills.length);
  
  const connectionStats = calculateConnectionStats(nodes, edges);
  const hasStats = healthScore !== undefined && nodes.length > 0;

  const toggleExpand = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Mobile layout
  if (mobile) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-base font-semibold m-0"
            style={{ color: theme.colors.textPrimary }}
          >
            Categories
          </h2>
          <span 
            className="text-xs font-mono"
            style={{ color: theme.colors.textMuted }}
          >
            {totalSkills} total
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* All */}
          <button
            onClick={() => onSelect(null)}
            className="px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-100"
            style={{
              background: selectedCategory === null ? theme.colors.bgSurface : 'transparent',
              border: `1px solid ${selectedCategory === null ? theme.colors.accent : theme.colors.border}`,
              color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
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
                className="px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-100"
                style={{
                  background: isSelected ? theme.colors.bgSurface : 'transparent',
                  border: `1px solid ${isSelected ? color : theme.colors.border}`,
                  color: isSelected ? color : theme.colors.textSecondary,
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: color,
                    boxShadow: isSelected ? `0 0 8px ${color}` : 'none',
                  }}
                />
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
        width: compact ? 180 : 200,
        minWidth: '160px',
        ...glass,
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
        <div 
          className="p-4 animate-fade-in"
          style={{
            borderBottom: `1px solid ${theme.colors.border}`,
            background: theme.colors.bgTertiary,
          }}
        >
          {/* Health Score */}
          <div className="mb-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-base">❤️</span>
              <span 
                className="text-xl font-bold font-mono"
                style={{ 
                  color: healthScore! >= 65 ? theme.colors.success : healthScore! >= 50 ? theme.colors.warning : theme.colors.error 
                }}
              >
                {Math.round(healthScore!)}%
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: theme.colors.textPrimary }}
              >
                Health
              </span>
            </div>
            <p 
              className="m-0 text-xs leading-relaxed"
              style={{ color: theme.colors.textMuted }}
            >
              Skill health score
            </p>
          </div>
          
          {/* Connections */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-base">⬡</span>
              <span 
                className="text-xl font-bold font-mono"
                style={{ color: theme.colors.accent }}
              >
                {connectionStats.totalConnections}
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: theme.colors.textPrimary }}
              >
                Links
              </span>
            </div>
            <p 
              className="m-0 text-xs leading-relaxed"
              style={{ color: theme.colors.textMuted }}
            >
              Density{' '}
              <span 
                className="font-medium"
                style={{ color: getDensityColor(connectionStats.density) }}
              >
                {getDensityLabel(connectionStats.density)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <span 
          className="text-sm font-semibold tracking-tight"
          style={{ color: theme.colors.textPrimary }}
        >
          {clusters.length} Categories
        </span>
        <span 
          className="text-xs font-mono"
          style={{ color: theme.colors.textMuted }}
        >
          {totalSkills}
        </span>
      </div>

      <div className="p-2 overflow-y-auto flex-1">
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-md mb-2 transition-all duration-100"
          style={{
            background: selectedCategory === null ? theme.colors.bgSurface : 'transparent',
            color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            border: 'none',
          }}
        >
          <span>All Skills</span>
          <span 
            className="font-mono text-xs"
            style={{ color: theme.colors.accent }}
          >
            {totalSkills}
          </span>
        </button>

        {/* Categories with expand */}
        <div className="flex flex-col gap-0.5">
          {sortedClusters.map((cluster) => {
            const isExpanded = expandedCategories.has(cluster.category);
            const isSelected = selectedCategory === cluster.category;
            const color = theme.categoryColors[cluster.category] || theme.colors.textMuted;
            const percentage = totalSkills > 0 
              ? Math.round((cluster.skills.length / totalSkills) * 100) 
              : 0;
            
            const categoryNodes = nodes.filter(n => n.category === cluster.category);
            
            return (
              <div key={cluster.category}>
                <button
                  onClick={(e) => toggleExpand(cluster.category, e)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-all duration-100 hover:bg-white/[0.03]"
                  style={{
                    background: isSelected ? theme.colors.bgSurface : 'transparent',
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.medium,
                    border: 'none',
                  }}
                >
                  {/* Expand indicator */}
                  <span 
                    className="text-xs font-bold w-3.5 transition-transform duration-150"
                    style={{ 
                      color: isExpanded ? theme.colors.accent : theme.colors.textMuted,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▸
                  </span>
                  
                  {/* Category color dot */}
                  <span 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: color,
                      boxShadow: `0 0 6px ${color}`,
                    }}
                  />
                  
                  {/* Category name */}
                  <span className="flex-1 text-left">{cluster.name}</span>
                  
                  {/* Count and percentage */}
                  <span 
                    className="font-mono text-xs"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {cluster.skills.length}
                    <span className="opacity-50 ml-1">{percentage}%</span>
                  </span>
                </button>
                
                {/* Expanded skills list */}
                {isExpanded && onSelectNode && (
                  <div className="pl-8 py-1 animate-slide-down">
                    {categoryNodes.map((node, idx) => {
                      const isLast = idx === categoryNodes.length - 1;
                      const isNodeSelected = selectedNode?.id === node.id;
                      
                      return (
                        <button
                          key={node.id}
                          onClick={() => onSelectNode(node)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded transition-all duration-100 hover:bg-white/[0.03]"
                          style={{
                            background: isNodeSelected ? theme.colors.bgSurface : 'transparent',
                            color: isNodeSelected ? theme.colors.textPrimary : theme.colors.textMuted,
                            fontSize: theme.fontSize.xs,
                            border: 'none',
                          }}
                        >
                          <span 
                            className="text-2xs font-mono"
                            style={{ color: theme.colors.textSubtle }}
                          >
                            {isLast ? '└' : '├'}
                          </span>
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <span className="flex-1 text-left truncate">
                            {node.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
