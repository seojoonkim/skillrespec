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

function getSkillPurpose(name: string): string[] {
  const nameLower = name.toLowerCase();
  const keywords: Record<string, string[]> = {
    security: ['guard', 'protect', 'secure', 'audit', 'defense'],
    automation: ['auto', 'workflow', 'pipeline', 'bot'],
    generation: ['create', 'generate', 'build', 'make'],
    analysis: ['analyze', 'scan', 'check', 'validate'],
  };
  
  const purposes: string[] = [];
  for (const [purpose, words] of Object.entries(keywords)) {
    if (words.some(k => nameLower.includes(k))) {
      purposes.push(purpose);
    }
  }
  return purposes.length > 0 ? purposes : ['utility'];
}

function explainSimilarity(node1: SkillNode, node2: SkillNode, weight: number): string {
  const purposes1 = getSkillPurpose(node1.name);
  const purposes2 = getSkillPurpose(node2.name);
  const shared = purposes1.filter(p => purposes2.includes(p));
  
  if (shared.length > 0) return `Both: ${shared.join(', ')}`;
  if (node1.category === node2.category) return `Same category`;
  if (weight > 0.7) return 'High semantic overlap';
  return 'Similar use cases';
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: color || theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '2px',
      }}>
        {label}
      </div>
    </div>
  );
}

// Bottom fixed panel - no overlay, no modal
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

  // Empty state - just show placeholder text
  if (!node) {
    return (
      <div style={{
        height: mobile ? '100px' : '130px',
        background: theme.colors.bgSecondary,
        borderTop: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        fontFamily: theme.fonts.sans,
      }}>
        <span style={{ opacity: 0.6 }}>Click a skill node to view details</span>
      </div>
    );
  }

  // Active state - show skill info
  return (
    <div style={{
      height: mobile ? '100px' : '130px',
      background: theme.colors.bgSecondary,
      borderTop: `1px solid ${theme.colors.border}`,
      display: 'flex',
      fontFamily: theme.fonts.sans,
      overflow: 'hidden',
    }}>
      {/* Left: Skill Name & Category */}
      <div style={{
        width: mobile ? '140px' : '200px',
        padding: mobile ? '12px 16px' : '16px 20px',
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: node.color || theme.categoryColors[node.category] || theme.colors.accent,
              flexShrink: 0,
            }}
          />
          <h2 style={{
            fontSize: mobile ? theme.fontSize.sm : theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {node.name}
          </h2>
        </div>
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          marginTop: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {node.category}
        </div>
      </div>

      {/* Center: Stats */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mobile ? '24px' : '48px',
        padding: '16px',
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
        />
        <StatItem 
          label="Links" 
          value={String(connectedNodes.length)} 
        />
      </div>

      {/* Right: Top Similar Skills */}
      {!mobile && connectedNodes.length > 0 && (
        <div style={{
          width: '280px',
          padding: '12px 16px',
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
            marginBottom: '8px',
            fontWeight: theme.fontWeight.medium,
          }}>
            Similar Skills
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}>
            {connectedNodes.slice(0, 3).map(({ node: n, weight }) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.fontSize.xs,
                }}
              >
                <span style={{ color: theme.colors.textSecondary }}>
                  {n.name}
                </span>
                <span style={{
                  fontWeight: theme.fontWeight.semibold,
                  color: weight > 0.7 ? theme.colors.warning : theme.colors.textMuted,
                  fontFamily: theme.fonts.mono,
                }}>
                  {Math.round(weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: theme.colors.textMuted,
          fontSize: '18px',
          cursor: 'pointer',
          padding: '4px 8px',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
        onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textMuted}
      >
        ×
      </button>
    </div>
  );
}
