import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SkillNodes from '../components/SkillNodes';
import ConnectionLines from '../components/ConnectionLines';
import InfoPanel from '../components/InfoPanel';
import CategoryLegend from '../components/CategoryLegend';
import LoadingScreen from '../components/LoadingScreen';
import ReportView from '../components/ReportView';
import { useWindowSize } from '../hooks/useWindowSize';
import { theme } from '../styles/theme';
import { decodeResultFromUrl, encodeResultForUrl } from '../lib/analyzer';
import type { AnalysisResult } from '../lib/analyzer';
import type { VizData, SkillNode } from '../types';
import type { Recommendations } from '../data/recommendations';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type ViewMode = '3d' | 'report';

interface ResultsPageProps {
  onNavigate: (path: string) => void;
}

// ═══════════════════════════════════════════════════════════
// View Toggle Component
// ═══════════════════════════════════════════════════════════

function ViewToggle({ 
  mode, 
  onChange 
}: { 
  mode: ViewMode; 
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.full,
      padding: '3px',
      border: `1px solid ${theme.colors.border}`,
    }}>
      <button
        onClick={() => onChange('3d')}
        style={{
          padding: '7px 14px',
          background: mode === '3d' 
            ? `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`
            : 'transparent',
          border: 'none',
          borderRadius: theme.radius.full,
          color: mode === '3d' ? theme.colors.bgPrimary : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: theme.transitions.fast,
          fontFamily: theme.fonts.sans,
        }}
      >
        <span style={{ fontSize: '12px' }}>🌐</span>
        Graph
      </button>
      <button
        onClick={() => onChange('report')}
        style={{
          padding: '7px 14px',
          background: mode === 'report'
            ? `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`
            : 'transparent',
          border: 'none',
          borderRadius: theme.radius.full,
          color: mode === 'report' ? theme.colors.bgPrimary : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: theme.transitions.fast,
          fontFamily: theme.fonts.sans,
        }}
      >
        <span style={{ fontSize: '12px' }}>📋</span>
        Report
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Mobile Nav Toggle
// ═══════════════════════════════════════════════════════════

function MobileNavToggle({ 
  activePanel, 
  onToggle 
}: { 
  activePanel: 'none' | 'categories' | 'recommendations';
  onToggle: (panel: 'none' | 'categories' | 'recommendations') => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      gap: '10px',
      padding: '12px 16px',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: theme.colors.bgPrimary,
      borderTop: `1px solid ${theme.colors.border}`,
      zIndex: 200,
    }}>
      {[
        { id: 'categories', label: 'Categories', icon: '📁' },
        { id: 'recommendations', label: 'Recommend', icon: '🎯' },
      ].map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onToggle(activePanel === id ? 'none' : id as 'categories' | 'recommendations')}
          style={{
            flex: 1,
            padding: '12px',
            background: activePanel === id ? theme.colors.bgElevated : 'transparent',
            border: `1px solid ${activePanel === id ? theme.colors.borderHover : theme.colors.border}`,
            borderRadius: theme.radius.lg,
            color: activePanel === id ? theme.colors.textPrimary : theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: theme.transitions.fast,
            fontFamily: theme.fonts.sans,
          }}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Recommendations Panel (inline version for results)
// ═══════════════════════════════════════════════════════════

function ResultsRecommendationsPanel({ 
  recommendations,
  embedded,
  position,
}: { 
  recommendations: Recommendations;
  embedded?: boolean;
  position?: 'mobile';
}) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'update' | 'security'>('diagnosis');

  const tabs = [
    { id: 'diagnosis', label: 'Diagnosis', count: recommendations.diagnosis.length },
    { id: 'update', label: 'Updates', count: recommendations.update.length },
    { id: 'security', label: 'Security', count: recommendations.security.length },
  ] as const;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: embedded ? '16px' : '24px',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.textPrimary,
          margin: 0,
          marginBottom: '4px',
        }}>
          Recommendations
        </h2>
        <p style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          margin: 0,
        }}>
          Based on your skill analysis
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        background: theme.colors.bgTertiary,
        borderRadius: theme.radius.md,
        padding: '4px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab.id ? theme.colors.bgSecondary : 'transparent',
              border: 'none',
              borderRadius: theme.radius.sm,
              color: activeTab === tab.id ? theme.colors.textPrimary : theme.colors.textMuted,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: theme.fonts.sans,
              transition: theme.transitions.fast,
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? theme.colors.accent : theme.colors.bgElevated,
                color: activeTab === tab.id ? theme.colors.bgPrimary : theme.colors.textMuted,
                padding: '2px 6px',
                borderRadius: theme.radius.full,
                fontSize: '10px',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
        {activeTab === 'diagnosis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.diagnosis.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.radius.md,
                  borderLeft: `3px solid ${
                    item.type === 'success' ? theme.colors.success :
                    item.type === 'warning' ? theme.colors.warning :
                    theme.colors.error
                  }`,
                }}
              >
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textPrimary,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: '4px',
                }}>
                  {item.type === 'success' ? '✓' : item.type === 'warning' ? '⚠' : '✗'} {item.text}
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  {item.detail}
                </div>
              </div>
            ))}
            {recommendations.diagnosis.length === 0 && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: theme.colors.textMuted,
                fontSize: theme.fontSize.sm,
              }}>
                No issues found 🎉
              </div>
            )}
          </div>
        )}

        {activeTab === 'update' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.update.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.radius.md,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontWeight: theme.fontWeight.semibold,
                  }}>
                    {item.id}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.warning,
                    background: theme.colors.warningGlow,
                    padding: '2px 6px',
                    borderRadius: theme.radius.sm,
                  }}>
                    {item.from} → {item.to}
                  </span>
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  {item.reason}
                </div>
              </div>
            ))}
            {recommendations.update.length === 0 && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: theme.colors.success,
                fontSize: theme.fontSize.sm,
              }}>
                All skills up to date! ✓
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.security.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.radius.md,
                  borderLeft: `3px solid ${
                    item.risk === 'critical' ? theme.colors.error :
                    item.risk === 'high' ? '#fb923c' :
                    theme.colors.warning
                  }`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontWeight: theme.fontWeight.semibold,
                  }}>
                    {item.id}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: item.risk === 'critical' ? theme.colors.error : '#fb923c',
                    background: item.risk === 'critical' ? theme.colors.errorGlow : 'rgba(251, 146, 60, 0.2)',
                    padding: '2px 6px',
                    borderRadius: theme.radius.sm,
                    textTransform: 'uppercase',
                    fontWeight: theme.fontWeight.bold,
                  }}>
                    {item.risk}
                  </span>
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  marginBottom: '4px',
                }}>
                  {item.reason}
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.accent,
                }}>
                  → {item.action}
                </div>
              </div>
            ))}
            {recommendations.security.length === 0 && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: theme.colors.success,
                fontSize: theme.fontSize.sm,
              }}>
                No security issues! 🛡️
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Results Page
// ═══════════════════════════════════════════════════════════

export default function ResultsPage({ onNavigate }: ResultsPageProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'categories' | 'recommendations'>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [copied, setCopied] = useState(false);

  const { isMobile, isTablet, isDesktop } = useWindowSize();

  // Load result from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError('No analysis data found. Please analyze your skills first.');
      setLoading(false);
      return;
    }

    const decoded = decodeResultFromUrl(hash);
    if (decoded) {
      setResult(decoded);
    } else {
      setError('Failed to decode analysis data. The link may be corrupted.');
    }
    setLoading(false);
  }, []);

  const data = result?.data;
  const recommendations = result?.recommendations;

  const center = useMemo(() => {
    if (!data || !data.nodes.length) return { x: 0, y: 0, z: 0 };
    const sum = data.nodes.reduce(
      (acc, n) => ({ x: acc.x + n.x, y: acc.y + n.y, z: acc.z + n.z }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: sum.x / data.nodes.length,
      y: sum.y / data.nodes.length,
      z: sum.z / data.nodes.length,
    };
  }, [data]);

  const healthScore = result?.summary?.healthScore || 0;

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  useEffect(() => {
    if (isDesktop) setMobilePanel('none');
  }, [isDesktop]);

  if (loading) return <LoadingScreen />;
  if (error || !data || !recommendations) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bgPrimary,
        fontFamily: theme.fonts.sans,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h1 style={{
            fontSize: theme.fontSize.xl,
            color: theme.colors.textPrimary,
            marginBottom: '8px',
          }}>
            {error || 'Something went wrong'}
          </h1>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            marginBottom: '24px',
          }}>
            Try analyzing your skills again.
          </p>
          <button
            onClick={() => onNavigate('/analyze')}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
              border: 'none',
              borderRadius: theme.radius.lg,
              color: theme.colors.bgPrimary,
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            → Go to Analyzer
          </button>
        </div>
      </div>
    );
  }

  const filteredNodes = selectedCategory
    ? data.nodes.filter(n => n.category === selectedCategory)
    : data.nodes;

  const filteredEdges = selectedCategory
    ? data.edges.filter(e => {
        const sourceNode = data.nodes.find(n => n.id === e.source);
        const targetNode = data.nodes.find(n => n.id === e.target);
        return sourceNode?.category === selectedCategory || targetNode?.category === selectedCategory;
      })
    : data.edges;

  const dateStr = result?.createdAt 
    ? new Date(result.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      background: theme.colors.bgPrimary,
      overflow: 'hidden',
      fontFamily: theme.fonts.sans,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        height: isMobile ? '48px' : '52px',
        padding: '0 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
      }}>
        {/* Back + Logo */}
        <button
          onClick={() => onNavigate('/analyze')}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            fontSize: theme.fontSize.sm,
            fontFamily: theme.fonts.sans,
          }}
        >
          ←
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ 
            fontSize: '20px',
            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))',
          }}>⚔️</span>
          <span style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.textPrimary,
            letterSpacing: '-0.02em',
          }}>
            SkillRespec
          </span>
        </div>

        <div style={{
          width: '1px',
          height: '20px',
          background: theme.colors.border,
        }} />

        <div style={{ flex: 1 }} />

        <ViewToggle mode={viewMode} onChange={setViewMode} />

        <div style={{ flex: 1 }} />

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            padding: '7px 14px',
            background: copied ? theme.colors.success : theme.colors.bgTertiary,
            border: `1px solid ${copied ? theme.colors.success : theme.colors.border}`,
            borderRadius: theme.radius.full,
            color: copied ? theme.colors.bgPrimary : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: theme.transitions.fast,
            fontFamily: theme.fonts.sans,
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Share'}
        </button>

        {/* Stats */}
        <span style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ 
            color: theme.colors.textSecondary,
            fontWeight: theme.fontWeight.medium,
          }}>
            {result?.summary?.totalSkills || 0} skills
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{dateStr}</span>
        </span>
      </header>

      {/* Main Content */}
      {viewMode === '3d' ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: isDesktop 
              ? '220px 1fr 340px' 
              : isTablet 
                ? '200px 1fr 300px' 
                : '1fr',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            {/* Left: Categories */}
            {!isMobile && (
              <div style={{
                background: theme.colors.bgSecondary,
                borderRight: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <CategoryLegend 
                  clusters={data.clusters}
                  selectedCategory={selectedCategory}
                  onSelect={setSelectedCategory}
                  compact={isTablet}
                  embedded
                  healthScore={healthScore}
                  nodes={data.nodes}
                  edges={data.edges}
                />
              </div>
            )}
            
            {/* Center: 3D Canvas */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: isMobile ? '56px' : 0,
            }}>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
                <Canvas
                  camera={{ position: [0, 0, isMobile ? 30 : 25], fov: isMobile ? 70 : 60 }}
                  gl={{ antialias: true, alpha: false }}
                  style={{ background: theme.colors.bgPrimary }}
                  dpr={[1, 2]}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={0.3} />
                    <pointLight position={[-10, -10, -10]} intensity={0.2} color="#22d3ee" />
                    
                    <Stars 
                      radius={100} 
                      depth={50} 
                      count={isMobile ? 1000 : 2500} 
                      factor={2.5} 
                      saturation={0} 
                      fade 
                      speed={0.2}
                    />
                    
                    <SkillNodes 
                      nodes={filteredNodes}
                      selectedNode={selectedNode}
                      hoveredNode={hoveredNode}
                      onSelect={setSelectedNode}
                      onHover={setHoveredNode}
                    />
                    
                    <ConnectionLines 
                      edges={filteredEdges}
                      nodes={data.nodes}
                      selectedNode={selectedNode}
                      hoveredNode={hoveredNode}
                    />
                    
                    <OrbitControls 
                      enablePan={!isMobile}
                      enableZoom
                      enableRotate
                      autoRotate={!selectedNode && !hoveredNode}
                      autoRotateSpeed={0.15}
                      maxDistance={isMobile ? 60 : 50}
                      minDistance={isMobile ? 10 : 5}
                      dampingFactor={0.05}
                      enableDamping
                      target={[center.x, center.y, center.z]}
                    />
                  </Suspense>
                </Canvas>
                
                {!isMobile && (
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '20px',
                    padding: '8px 16px',
                    background: 'rgba(5, 5, 5, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: theme.radius.full,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                  }}>
                    <span>Drag to rotate</span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span>Scroll to zoom</span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span>Click for details</span>
                  </div>
                )}
              </div>
              
              {!isMobile && (
                <InfoPanel 
                  node={selectedNode || hoveredNode}
                  allNodes={data.nodes}
                  edges={data.edges}
                  metrics={data.metrics}
                  onClose={() => setSelectedNode(null)}
                  mobile={isMobile}
                />
              )}
            </div>
            
            {/* Right: Recommendations */}
            {(isDesktop || isTablet) && (
              <div style={{
                background: theme.colors.bgSecondary,
                borderLeft: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <ResultsRecommendationsPanel recommendations={recommendations} embedded />
              </div>
            )}
          </div>
          
          {/* Mobile panels */}
          {isMobile && (selectedNode || hoveredNode) && (
            <div style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              zIndex: 100,
            }}>
              <InfoPanel 
                node={selectedNode || hoveredNode}
                allNodes={data.nodes}
                edges={data.edges}
                metrics={data.metrics}
                onClose={() => setSelectedNode(null)}
                mobile={isMobile}
              />
            </div>
          )}
          
          {isMobile && mobilePanel === 'categories' && (
            <div style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              background: theme.colors.bgSecondary,
              borderTop: `1px solid ${theme.colors.border}`,
              maxHeight: '50vh',
              overflowY: 'auto',
              zIndex: 150,
              borderRadius: `${theme.radius.xl} ${theme.radius.xl} 0 0`,
            }}>
              <CategoryLegend 
                clusters={data.clusters}
                selectedCategory={selectedCategory}
                onSelect={(cat) => {
                  setSelectedCategory(cat);
                  setMobilePanel('none');
                }}
                mobile
              />
            </div>
          )}
          
          {isMobile && mobilePanel === 'recommendations' && (
            <div style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              background: theme.colors.bgSecondary,
              borderTop: `1px solid ${theme.colors.border}`,
              maxHeight: '60vh',
              overflowY: 'auto',
              zIndex: 150,
              borderRadius: `${theme.radius.xl} ${theme.radius.xl} 0 0`,
            }}>
              <ResultsRecommendationsPanel recommendations={recommendations} position="mobile" />
            </div>
          )}
          
          {isMobile && (
            <MobileNavToggle 
              activePanel={mobilePanel} 
              onToggle={setMobilePanel} 
            />
          )}
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: theme.colors.bgPrimary,
        }}>
          <ReportView data={data} healthScore={healthScore} />
        </div>
      )}
    </div>
  );
}
