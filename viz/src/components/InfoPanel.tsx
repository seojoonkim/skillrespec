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
    <div>
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: color || theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
      }}>
        {value}
      </div>
    </div>
  );
}

export default function InfoPanel({ node, allNodes, edges, onClose, mobile = false }: InfoPanelProps) {
  if (!node) return null;

  const { connectedNodes, overlapScore } = useMemo(() => {
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

  const panelStyle: React.CSSProperties = {
    background: theme.colors.bgSecondary,
    border: `1px solid ${theme.colors.border}`,
    fontFamily: theme.fonts.sans,
    overflow: 'hidden',
    zIndex: 1000,
    pointerEvents: 'auto',
  };

  if (mobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 999,
          }}
        />
        
        {/* Modal */}
        <div style={{
          ...panelStyle,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '360px',
          maxHeight: 'calc(100vh - 120px)',
          borderRadius: theme.radius.lg,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: 0,
              }}>
                {node.name}
              </h2>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {node.category}
              </div>
            </div>
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

          {/* Content */}
          <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <StatItem label="Tokens" value={`~${node.tokens.toLocaleString()}`} color={theme.colors.accent} />
              <StatItem label="Overlap" value={`${overlapScore}%`} color={overlapScore > 50 ? theme.colors.warning : theme.colors.textPrimary} />
              <StatItem label="Links" value={String(connectedNodes.length)} />
            </div>

            {/* Similar Skills */}
            {connectedNodes.length > 0 && (
              <>
                <h3 style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                  fontWeight: theme.fontWeight.medium,
                }}>
                  Similar Skills
                </h3>
                {connectedNodes.slice(0, 3).map(({ node: n, weight }) => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textPrimary,
                        fontWeight: theme.fontWeight.medium,
                      }}>
                        {n.name}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        marginTop: '2px',
                      }}>
                        {explainSimilarity(node, n, weight)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                      color: weight > 0.7 ? theme.colors.warning : theme.colors.textSecondary,
                      fontFamily: theme.fonts.mono,
                    }}>
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop
  return (
    <div style={{
      ...panelStyle,
      position: 'absolute',
      top: '80px',
      right: '340px',
      width: '320px',
      maxHeight: 'calc(100vh - 160px)',
      borderRadius: theme.radius.lg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            {node.name}
          </h2>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {node.category}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textMuted}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}>
          <StatItem label="Tokens" value={`~${node.tokens.toLocaleString()}`} color={theme.colors.accent} />
          <StatItem label="Overlap" value={`${overlapScore}%`} color={overlapScore > 50 ? theme.colors.warning : theme.colors.textPrimary} />
          <StatItem label="Links" value={String(connectedNodes.length)} />
        </div>

        {/* Similar Skills */}
        {connectedNodes.length > 0 && (
          <>
            <h3 style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              fontWeight: theme.fontWeight.medium,
            }}>
              Similar Skills
            </h3>
            {connectedNodes.slice(0, 4).map(({ node: n, weight }) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontWeight: theme.fontWeight.medium,
                  }}>
                    {n.name}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                    marginTop: '2px',
                  }}>
                    {explainSimilarity(node, n, weight)}
                  </div>
                </div>
                <span style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  color: weight > 0.7 ? theme.colors.warning : theme.colors.textSecondary,
                  fontFamily: theme.fonts.mono,
                }}>
                  {Math.round(weight * 100)}%
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
