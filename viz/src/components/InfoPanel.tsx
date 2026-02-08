import { useMemo } from 'react';
import type { SkillNode, SkillEdge, VizMetrics } from '../types';

interface InfoPanelProps {
  node: SkillNode | null;
  allNodes: SkillNode[];
  edges: SkillEdge[];
  metrics?: VizMetrics;
  onClose: () => void;
  mobile?: boolean;
}

// Keywords that indicate skill purpose
const SKILL_KEYWORDS: Record<string, string[]> = {
  security: ['guard', 'protect', 'secure', 'audit', 'defense', 'injection', 'safe'],
  automation: ['auto', 'workflow', 'pipeline', 'bot', 'schedule', 'cron'],
  generation: ['create', 'generate', 'build', 'make', 'produce', 'write'],
  analysis: ['analyze', 'scan', 'check', 'validate', 'lint', 'review'],
  integration: ['connect', 'sync', 'bridge', 'api', 'webhook', 'integrate'],
  media: ['image', 'video', 'audio', 'render', 'visual', 'design'],
};

function getSkillPurpose(name: string): string[] {
  const nameLower = name.toLowerCase();
  const purposes: string[] = [];
  
  for (const [purpose, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(k => nameLower.includes(k))) {
      purposes.push(purpose);
    }
  }
  
  return purposes.length > 0 ? purposes : ['utility'];
}

function explainSimilarity(node1: SkillNode, node2: SkillNode, weight: number): string {
  const purposes1 = getSkillPurpose(node1.name);
  const purposes2 = getSkillPurpose(node2.name);
  const sharedPurposes = purposes1.filter(p => purposes2.includes(p));
  
  if (sharedPurposes.length > 0) {
    return `Both focus on ${sharedPurposes.join(' & ')}`;
  }
  
  if (node1.category === node2.category) {
    return `Same category (${node1.category})`;
  }
  
  if (weight > 0.7) {
    return 'High semantic overlap in descriptions';
  }
  
  return 'Similar terminology and use cases';
}

function getRecommendation(node: SkillNode, connectedNodes: { node: SkillNode; weight: number }[]): { type: 'merge' | 'complement' | 'replace' | 'keep'; message: string } {
  const highOverlap = connectedNodes.filter(c => c.weight > 0.7);
  const mediumOverlap = connectedNodes.filter(c => c.weight > 0.4 && c.weight <= 0.7);
  
  if (highOverlap.length >= 2) {
    return {
      type: 'merge',
      message: `Consider merging with ${highOverlap[0].node.name} - ${Math.round(highOverlap[0].weight * 100)}% overlap`,
    };
  }
  
  if (node.tokens > 4000) {
    const lighter = connectedNodes.find(c => c.node.tokens < node.tokens * 0.5 && c.weight > 0.5);
    if (lighter) {
      return {
        type: 'replace',
        message: `${lighter.node.name} is lighter (~${lighter.node.tokens} tokens) with similar function`,
      };
    }
  }
  
  if (mediumOverlap.length > 0) {
    const complement = mediumOverlap.find(c => c.node.category !== node.category);
    if (complement) {
      return {
        type: 'complement',
        message: `Pairs well with ${complement.node.name} for cross-domain work`,
      };
    }
  }
  
  return {
    type: 'keep',
    message: 'Unique skill with good differentiation',
  };
}

function StatCard({ label, value, color, compact }: { label: string; value: string; color: string; compact?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      padding: compact ? '8px 10px' : '10px 12px',
      borderRadius: compact ? 8 : 10,
      textAlign: 'center',
    }}>
      <div style={{ 
        fontSize: compact ? 9 : 10, 
        color: '#666', 
        marginBottom: compact ? 2 : 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: compact ? 14 : 16, 
        fontWeight: 700, 
        color,
        textShadow: `0 0 20px ${color}40`,
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function InfoPanel({ node, allNodes, edges, metrics, onClose, mobile = false }: InfoPanelProps) {
  if (!node) return null;

  const { connectedNodes, recommendation, overlapScore } = useMemo(() => {
    const connectedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );
    
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
      recommendation: getRecommendation(node, connected),
      overlapScore: Math.round(avgWeight * 100),
    };
  }, [node, allNodes, edges]);

  const recColors = {
    merge: { bg: 'rgba(255, 100, 100, 0.1)', border: '#ff6464', icon: '🔀' },
    replace: { bg: 'rgba(255, 200, 100, 0.1)', border: '#ffc864', icon: '🔄' },
    complement: { bg: 'rgba(100, 255, 200, 0.1)', border: '#64ffc8', icon: '🤝' },
    keep: { bg: 'rgba(100, 200, 255, 0.1)', border: '#64c8ff', icon: '✅' },
  };
  const recStyle = recColors[recommendation.type];

  // Mobile: Center modal with overlay
  if (mobile) {
    return (
      <>
        {/* Overlay */}
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 300,
          }}
        />
        
        {/* Modal */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '360px',
          maxHeight: 'calc(100vh - 120px)',
          background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: 0,
          border: `1px solid ${node.color}30`,
          boxShadow: `0 0 60px ${node.color}15, 0 20px 40px rgba(0,0,0,0.5)`,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          overflow: 'hidden',
          zIndex: 301,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Header with gradient */}
          <div style={{
            background: `linear-gradient(135deg, ${node.color}20 0%, transparent 100%)`,
            padding: '16px',
            borderBottom: `1px solid ${node.color}20`,
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#888',
                fontSize: 14,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `radial-gradient(circle at 30% 30%, ${node.color}, ${node.color}80)`,
                boxShadow: `0 0 20px ${node.color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                }} />
              </div>
              <div>
                <h2 style={{ 
                  fontSize: 16, 
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                }}>
                  {node.name}
                </h2>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  marginTop: 2,
                }}>
                  <span style={{
                    fontSize: 10,
                    color: node.color,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}>
                    {node.category}
                  </span>
                  <span style={{ color: '#333' }}>•</span>
                  <span style={{ fontSize: 10, color: '#666' }}>
                    {node.connections.length} connections
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '12px 16px', 
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 240px)',
          }}>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}>
              <StatCard 
                label="Tokens" 
                value={`~${node.tokens.toLocaleString()}`}
                color="#00ffff"
                compact
              />
              <StatCard 
                label="Overlap" 
                value={`${overlapScore}%`}
                color={overlapScore > 50 ? '#ff6464' : '#64ff64'}
                compact
              />
              <StatCard 
                label="Size" 
                value={node.size > 0.6 ? 'Heavy' : node.size > 0.3 ? 'Medium' : 'Light'}
                color="#ff00ff"
                compact
              />
            </div>

            {/* Recommendation */}
            <div style={{
              background: recStyle.bg,
              border: `1px solid ${recStyle.border}40`,
              borderRadius: 10,
              padding: 10,
              marginBottom: 12,
            }}>
              <div style={{ 
                fontSize: 10, 
                color: recStyle.border, 
                marginBottom: 4,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {recStyle.icon} Recommendation
              </div>
              <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.4 }}>
                {recommendation.message}
              </div>
            </div>

            {/* Similar Skills - Show only top 3 on mobile */}
            {connectedNodes.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: 10,
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  fontWeight: 600,
                }}>
                  🔗 Similar Skills
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {connectedNodes.slice(0, 3).map(({ node: connNode, weight }) => (
                    <div
                      key={connNode.id}
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: 8,
                        padding: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{
                        width: 3,
                        borderRadius: 2,
                        background: connNode.color,
                        boxShadow: `0 0 8px ${connNode.color}60`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 2,
                        }}>
                          <span style={{ 
                            fontSize: 12, 
                            color: '#fff', 
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {connNode.name}
                          </span>
                          <span style={{ 
                            fontSize: 11, 
                            color: weight > 0.7 ? '#ff6464' : weight > 0.5 ? '#ffaa00' : '#00ffff',
                            fontWeight: 700,
                            marginLeft: 6,
                            fontFamily: '"JetBrains Mono", monospace',
                          }}>
                            {Math.round(weight * 100)}%
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: 10, 
                          color: '#888',
                          lineHeight: 1.3,
                        }}>
                          {explainSimilarity(node, connNode, weight)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet: Side panel
  return (
    <div style={{
      position: 'absolute',
      top: 90,
      right: 340,
      width: 340,
      background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: 16,
      padding: 0,
      border: `1px solid ${node.color}30`,
      boxShadow: `0 0 60px ${node.color}15, 0 20px 40px rgba(0,0,0,0.5)`,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 180px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      pointerEvents: 'auto',
    }}>
      {/* Header with gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${node.color}20 0%, transparent 100%)`,
        padding: '20px 20px 16px 20px',
        borderBottom: `1px solid ${node.color}20`,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#666',
            fontSize: 16,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `radial-gradient(circle at 30% 30%, ${node.color}, ${node.color}80)`,
            boxShadow: `0 0 30px ${node.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
            }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: 18, 
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {node.name}
            </h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginTop: 4,
            }}>
              <span style={{
                fontSize: 11,
                color: node.color,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
              }}>
                {node.category}
              </span>
              <span style={{ color: '#333' }}>•</span>
              <span style={{ fontSize: 11, color: '#666' }}>
                {node.connections.length} connections
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '16px 20px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}>
          <StatCard 
            label="Tokens" 
            value={`~${node.tokens.toLocaleString()}`}
            color="#00ffff"
          />
          <StatCard 
            label="Overlap" 
            value={`${overlapScore}%`}
            color={overlapScore > 50 ? '#ff6464' : '#64ff64'}
          />
          <StatCard 
            label="Size" 
            value={node.size > 0.6 ? 'Heavy' : node.size > 0.3 ? 'Medium' : 'Light'}
            color="#ff00ff"
          />
        </div>

        {/* Recommendation */}
        <div style={{
          background: recStyle.bg,
          border: `1px solid ${recStyle.border}40`,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}>
          <div style={{ 
            fontSize: 11, 
            color: recStyle.border, 
            marginBottom: 4,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {recStyle.icon} Recommendation
          </div>
          <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>
            {recommendation.message}
          </div>
        </div>

        {/* Similar Skills */}
        {connectedNodes.length > 0 && (
          <div>
            <h3 style={{
              fontSize: 11,
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
              fontWeight: 600,
            }}>
              🔗 Similar Skills
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {connectedNodes.slice(0, 4).map(({ node: connNode, weight }) => (
                <div
                  key={connNode.id}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 10,
                    padding: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{
                    width: 4,
                    borderRadius: 2,
                    background: connNode.color,
                    boxShadow: `0 0 10px ${connNode.color}60`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}>
                      <span style={{ 
                        fontSize: 13, 
                        color: '#fff', 
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {connNode.name}
                      </span>
                      <span style={{ 
                        fontSize: 12, 
                        color: weight > 0.7 ? '#ff6464' : weight > 0.5 ? '#ffaa00' : '#00ffff',
                        fontWeight: 700,
                        marginLeft: 8,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}>
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: '#888',
                      lineHeight: 1.4,
                    }}>
                      {explainSimilarity(node, connNode, weight)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
