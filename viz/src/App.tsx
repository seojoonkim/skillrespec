import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SkillNodes from './components/SkillNodes';
import ConnectionLines from './components/ConnectionLines';
import InfoPanel from './components/InfoPanel';
import CategoryLegend from './components/CategoryLegend';
import RecommendationsPanel from './components/RecommendationsPanel';
import LoadingScreen from './components/LoadingScreen';
// DiagnosticReportModal removed - now inline in ReportView
import ReportView from './components/ReportView';
import { useWindowSize } from './hooks/useWindowSize';
import { theme } from './styles/theme';
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';

// ═══════════════════════════════════════════════════════════
// View Mode Types
// ═══════════════════════════════════════════════════════════
type ViewMode = '3d' | 'report';

// ═══════════════════════════════════════════════════════════
// View Toggle Component (for center column)
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
      background: '#1a1a1a',
      borderRadius: theme.radius.md,
      padding: '3px',
      border: `1px solid ${theme.colors.border}`,
    }}>
      <button
        onClick={() => onChange('3d')}
        style={{
          padding: '8px 16px',
          background: mode === '3d' ? theme.colors.accent : 'transparent',
          border: 'none',
          borderRadius: theme.radius.sm,
          color: mode === '3d' ? '#fff' : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
      >
        🌐 Graph
      </button>
      <button
        onClick={() => onChange('report')}
        style={{
          padding: '8px 16px',
          background: mode === 'report' ? theme.colors.accent : 'transparent',
          border: 'none',
          borderRadius: theme.radius.sm,
          color: mode === 'report' ? '#fff' : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
      >
        📋 Report
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Mobile Bottom Nav
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
      gap: '8px',
      padding: '12px 16px',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: theme.colors.bgPrimary,
      borderTop: `1px solid ${theme.colors.border}`,
      zIndex: 200,
    }}>
      {['categories', 'recommendations'].map((id) => (
        <button
          key={id}
          onClick={() => onToggle(activePanel === id ? 'none' : id as 'categories' | 'recommendations')}
          style={{
            flex: 1,
            padding: '12px',
            background: activePanel === id ? theme.colors.bgSecondary : 'transparent',
            border: `1px solid ${activePanel === id ? theme.colors.border : 'transparent'}`,
            borderRadius: theme.radius.md,
            color: activePanel === id ? theme.colors.textPrimary : theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
          }}
        >
          {id === 'categories' ? 'Categories' : 'Recommend'}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [data, setData] = useState<VizData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'categories' | 'recommendations'>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  
  const { isMobile, isTablet, isDesktop } = useWindowSize();

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

  const healthScore = useMemo(() => {
    if (!data) return 0;
    const balance = data.metrics?.categoryBalance || 0.5;
    const depth = data.metrics?.avgDepth || 1;
    return Math.round((balance * 40 + Math.min(depth / 3, 1) * 30 + 30) * 10) / 10;
  }, [data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/viz-data.json');
        if (response.ok) {
          const json = await response.json();
          // Normalize colors to use theme.categoryColors as single source of truth
          const normalizedData: VizData = {
            ...json,
            nodes: json.nodes.map((node: SkillNode) => ({
              ...node,
              color: theme.categoryColors[node.category] || node.color,
            })),
            clusters: json.clusters.map((cluster: { id: string; name: string; category: string; skills: string[]; centroid: { x: number; y: number; z: number }; density: number; color: string }) => ({
              ...cluster,
              color: theme.categoryColors[cluster.category] || cluster.color,
            })),
          };
          setData(normalizedData);
        } else {
          throw new Error('No data file');
        }
      } catch {
        setData(generateDemoData());
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isDesktop) setMobilePanel('none');
  }, [isDesktop]);

  if (loading) return <LoadingScreen />;
  if (!data) return <LoadingScreen error="Failed to load skill data" />;

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

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
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
      {/* ═══════════════════════════════════════════════════════════
          COMPACT HEADER (single line with integrated tabs)
      ═══════════════════════════════════════════════════════════ */}
      <header style={{
        height: isMobile ? '40px' : '44px',
        padding: '0 12px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        {/* Logo + Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '16px' }}>⚔️</span>
          <span style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.textPrimary,
            letterSpacing: '-0.01em',
          }}>
            SkillRespec
          </span>
        </div>

        {/* Target + Date */}
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          <span style={{ color: theme.colors.textSecondary }}>Simon</span>
          <span style={{ margin: '0 4px', opacity: 0.5 }}>·</span>
          {dateStr}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View Mode Toggle (integrated in header) */}
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA - Conditional Layout based on viewMode
      ═══════════════════════════════════════════════════════════ */}
      {viewMode === '3d' ? (
        /* 3D MODE: Grid layout with bottom panel */
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Main 3-column area */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: isDesktop 
              ? '200px 1fr 320px' 
              : isTablet 
                ? '180px 1fr 280px' 
                : '1fr',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            {/* LEFT COLUMN: Categories */}
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
                />
              </div>
            )}
            
            {/* CENTER COLUMN: 3D Canvas */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: isMobile ? '56px' : 0,
            }}>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Canvas
                  camera={{ position: [0, 0, isMobile ? 30 : 25], fov: isMobile ? 70 : 60 }}
                  gl={{ antialias: true, alpha: false }}
                  style={{ background: theme.colors.bgPrimary }}
                  dpr={[1, 2]}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} intensity={0.4} />
                    
                    <Stars 
                      radius={100} 
                      depth={50} 
                      count={isMobile ? 1000 : 2000} 
                      factor={2} 
                      saturation={0} 
                      fade 
                      speed={0.3}
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
                      autoRotateSpeed={0.2}
                      maxDistance={isMobile ? 60 : 50}
                      minDistance={isMobile ? 10 : 5}
                      dampingFactor={0.05}
                      enableDamping
                      target={[center.x, center.y, center.z]}
                    />
                  </Suspense>
                </Canvas>
                
                {/* Footer hint - now above the bottom panel */}
                {!isMobile && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '24px',
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                  }}>
                    <span>Drag to rotate</span>
                    <span>•</span>
                    <span>Scroll to zoom</span>
                    <span>•</span>
                    <span>Click for details</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* RIGHT COLUMN: Recommendations */}
            {(isDesktop || isTablet) && (
              <div style={{
                background: theme.colors.bgSecondary,
                borderLeft: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <RecommendationsPanel embedded />
              </div>
            )}
          </div>
          
          {/* BOTTOM PANEL: Skill Info (fixed height, full width) */}
          {!isMobile && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
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
          
          {/* Mobile: Info panel above nav */}
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
          
          {/* Mobile Panels */}
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
            }}>
              <RecommendationsPanel position="mobile" />
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
        /* REPORT MODE: Full width ReportView */
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
