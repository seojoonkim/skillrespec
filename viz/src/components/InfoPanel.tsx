import { useMemo } from 'react';
import { theme } from '../styles/theme';
import type { SkillNode, SkillEdge, VizMetrics } from '../types';

interface InfoPanelProps {
  node: SkillNode | null;
  allNodes: SkillNode[];
  edges: SkillEdge[];
  metrics?: VizMetrics;
  onClose: () => void;
  mobile?: boolean;
}

function StatItem({ label, value, color, subtext }: { 
  label: string; 
  value: string; 
  color?: string;
  subtext?: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: color || theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginTop: '4px',
        fontWeight: theme.fontWeight.medium,
      }}>
        {label}
      </div>
      {subtext && (
        <div style={{
          fontSize: '10px',
          color: theme.colors.textSubtle,
          marginTop: '2px',
        }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

function SimilarSkillChip({ name, similarity, color }: { 
  name: string; 
  similarity: number; 
  color: string;
}) {
  const isHigh = similarity > 70;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: theme.colors.bgTertiary,
      border: `1px solid ${isHigh ? theme.colors.warning : theme.colors.border}`,
      borderRadius: theme.radius.full,
      fontSize: theme.fontSize.xs,
      transition: theme.transitions.fast,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 4px ${color}`,
      }} />
      <span style={{ 
        color: theme.colors.textSecondary,
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      <span style={{
        fontWeight: theme.fontWeight.semibold,
        color: isHigh ? theme.colors.warning : theme.colors.textMuted,
        fontFamily: theme.fonts.mono,
      }}>
        {similarity}%
      </span>
    </div>
  );
}

// Bottom fixed panel - clean, modern design
export default function InfoPanel({ node, allNodes, edges, onClose, mobile = false }: InfoPanelProps) {
  const { connectedNodes, overlapScore } = useMemo(() => {
    if (!node) return { connectedNodes: [], overlapScore: 0 };
    
    const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    
    const connected = connectedEdges.map(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      return {
        node: allNodes.find(n => n.id === otherId)!,
        weight: e.weight,
      };
    }).filter(c => c.node).sort((a, b) => b.weight - a.weight);
    
    const avgWeight = connected.length > 0
      ? connected.reduce((sum, c) => sum + c.weight, 0) / connected.length
      : 0;
    
    return {
      connectedNodes: connected,
      overlapScore: Math.round(avgWeight * 100),
    };
  }, [node, allNodes, edges]);

  // Empty state - elegant placeholder
  if (!node) {
    return (
      <div style={{
        height: mobile ? '100px' : '140px',
        background: `linear-gradient(180deg, ${theme.colors.bgSecondary} 0%, ${theme.colors.bgPrimary} 100%)`,
        borderTop: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        fontFamily: theme.fonts.sans,
        gap: '8px',
      }}>
        <span style={{ opacity: 0.6, fontSize: '20px' }}>🎯</span>
        <span style={{ opacity: 0.6 }}>Click a skill node to view details</span>
      </div>
    );
  }

  const nodeColor = node.color || theme.categoryColors[node.category] || theme.colors.accent;

  // Active state - show skill info
  return (
    <div style={{
      height: mobile ? '100px' : '140px',
      background: `linear-gradient(180deg, ${theme.colors.bgSecondary} 0%, ${theme.colors.bgPrimary} 100%)`,
      borderTop: `1px solid ${theme.colors.border}`,
      display: 'flex',
      fontFamily: theme.fonts.sans,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Accent line at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${nodeColor}, transparent)`,
        opacity: 0.6,
      }} />

      {/* Left: Skill Name & Category */}
      <div style={{
        width: mobile ? '140px' : '220px',
        padding: mobile ? '16px 20px' : '20px 24px',
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: nodeColor,
              boxShadow: `0 0 10px ${nodeColor}`,
              flexShrink: 0,
            }}
          />
          <h2 style={{
            fontSize: mobile ? theme.fontSize.md : theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {node.name}
          </h2>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
        }}>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: theme.fontWeight.medium,
          }}>
            {node.category}
          </span>
        </div>
      </div>

      {/* Center: Stats */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mobile ? '32px' : '56px',
        padding: '20px',
      }}>
        <StatItem 
          label="Tokens" 
          value={`~${node.tokens.toLocaleString()}`} 
          color={theme.colors.accent} 
        />
        <StatItem 
          label="Overlap" 
          value={`${overlapScore}%`} 
          color={overlapScore > 50 ? theme.colors.warning : theme.colors.textPrimary}
          subtext={overlapScore > 70 ? 'High redundancy' : overlapScore > 40 ? 'Moderate' : 'Unique'}
        />
        <StatItem 
          label="Links" 
          value={String(connectedNodes.length)} 
          subtext={connectedNodes.length === 0 ? 'Isolated' : connectedNodes.length > 5 ? 'Hub skill' : 'Connected'}
        />
      </div>

      {/* Right: Similar Skills */}
      {!mobile && connectedNodes.length > 0 && (
        <div style={{
          width: '320px',
          padding: '16px 20px',
          borderLeft: `1px solid ${theme.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px',
            fontWeight: theme.fontWeight.semibold,
          }}>
            Similar Skills
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {connectedNodes.slice(0, 3).map(({ node: n, weight }) => (
              <SimilarSkillChip
                key={n.id}
                name={n.name}
                similarity={Math.round(weight * 100)}
                color={theme.categoryColors[n.category] || theme.colors.textMuted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          background: theme.colors.bgTertiary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.full,
          color: theme.colors.textMuted,
          fontSize: '14px',
          cursor: 'pointer',
          padding: '6px 10px',
          transition: theme.transitions.fast,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.colors.borderHover;
          e.currentTarget.style.color = theme.colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.color = theme.colors.textMuted;
        }}
      >
        ✕
      </button>
    </div>
  );
}
