import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SkillNodes from './components/SkillNodes';
import ConnectionLines from './components/ConnectionLines';
import InfoPanel from './components/InfoPanel';
import CategoryLegend from './components/CategoryLegend';
import RecommendationsPanel from './components/RecommendationsPanel';
import LoadingScreen from './components/LoadingScreen';
import ReportView from './components/ReportView';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import SearchBar from './components/SearchBar';
import ToolNodes, { ToolConnectionLines } from './components/ToolNodes';
import HealthDashboard from './components/HealthDashboard';
import { useWindowSize } from './hooks/useWindowSize';
import { theme } from './styles/theme';
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';
import { buildToolGraph } from './lib/toolDependencies';
import { filterSkillNodes } from './lib/search';
import { calculateDashboardHealth } from './lib/healthScore';

// ═══════════════════════════════════════════════════════════
// Router - Simple hash-based routing
// ═══════════════════════════════════════════════════════════

type Route = '/' | '/analyze' | '/results';

function useRouter(): [Route, (path: string) => void] {
  const getRoute = (): Route => {
    const hash = window.location.hash;
    if (hash.startsWith('#/analyze')) return '/analyze';
    if (hash.startsWith('#/results')) return '/results';
    // Check for encoded result data in hash (legacy format)
    if (hash.length > 10 && !hash.includes('/')) return '/results';
    return '/';
  };

  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path.startsWith('/results#')) {
      // Special case: results with data
      window.location.hash = path.slice(1); // Remove leading /
    } else if (path === '/') {
      window.location.hash = '';
      setRoute('/');
    } else {
      window.location.hash = path;
    }
  }, []);

  return [route, navigate];
}

// ═══════════════════════════════════════════════════════════
// View Mode Types
// ═══════════════════════════════════════════════════════════
type ViewMode = '3d' | 'report';

// ═══════════════════════════════════════════════════════════
// View Toggle Component - Modern pill style
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
// Demo Page (Home)
// ═══════════════════════════════════════════════════════════
function DemoPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [data, setData] = useState<VizData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'categories' | 'recommendations'>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'categories' | 'health'>('categories');
  
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

  // Calculate health using new health score system
  const healthData = useMemo(() => {
    if (!data) return { averageScore: 0, averageGrade: 'F' as const };
    return calculateDashboardHealth(data.nodes);
  }, [data]);

  const healthScore = healthData.averageScore;

  // Build tool dependency graph
  const toolGraph = useMemo(() => {
    if (!data) return { toolNodes: [], toolEdges: [] };
    return buildToolGraph(data.nodes);
  }, [data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/viz-data.json');
        if (response.ok) {
          const json = await response.json();
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

  // Filter by category first
  let filteredNodes = selectedCategory
    ? data.nodes.filter(n => n.category === selectedCategory)
    : data.nodes;
  
  // Then filter by search query
  if (searchQuery.trim()) {
    filteredNodes = filterSkillNodes(filteredNodes, searchQuery);
  }

  const filteredEdges = selectedCategory || searchQuery
    ? data.edges.filter(e => {
        const sourceNode = filteredNodes.find(n => n.id === e.source);
        const targetNode = filteredNodes.find(n => n.id === e.target);
        return sourceNode !== undefined || targetNode !== undefined;
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
        {/* Logo + Title */}
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

        {/* Separator */}
        <div style={{
          width: '1px',
          height: '20px',
          background: theme.colors.border,
        }} />

        {/* Analyze Button */}
        <button
          onClick={() => onNavigate('/analyze')}
          style={{
            padding: '7px 14px',
            background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
            border: 'none',
            borderRadius: theme.radius.full,
            color: theme.colors.bgPrimary,
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
          🔍 Analyze Your Skills
        </button>

        {/* Search Bar */}
        {!isMobile && (
          <SearchBar
            onSearch={setSearchQuery}
            onSelectSkill={(id) => {
              const node = data.nodes.find(n => n.id === id);
              if (node) setSelectedNode(node);
            }}
            placeholder="Search skills..."
          />
        )}

        {/* Tools Toggle */}
        {!isMobile && (
          <button
            onClick={() => setShowTools(!showTools)}
            style={{
              padding: '7px 12px',
              background: showTools ? theme.colors.bgElevated : 'transparent',
              border: `1px solid ${showTools ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.radius.full,
              color: showTools ? theme.colors.accent : theme.colors.textMuted,
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
            🔧 Tools
          </button>
        )}

        {/* Spacer (left) */}
        <div style={{ flex: 1 }} />

        {/* View Mode Toggle (CENTERED) */}
        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {/* Spacer (right) */}
        <div style={{ flex: 1 }} />

        {/* Target + Date (right side) */}
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
            Demo
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
          {/* Main 3-column area */}
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
            {/* LEFT COLUMN: Categories / Health */}
            {!isMobile && (
              <div style={{
                background: theme.colors.bgSecondary,
                borderRight: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Tab Switcher */}
                <div style={{
                  display: 'flex',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  background: theme.colors.bgTertiary,
                }}>
                  <button
                    onClick={() => setLeftPanelTab('categories')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: leftPanelTab === 'categories' ? theme.colors.bgSecondary : 'transparent',
                      border: 'none',
                      borderBottom: leftPanelTab === 'categories' ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                      color: leftPanelTab === 'categories' ? theme.colors.textPrimary : theme.colors.textMuted,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.medium,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontFamily: theme.fonts.sans,
                    }}
                  >
                    📁 Categories
                  </button>
                  <button
                    onClick={() => setLeftPanelTab('health')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: leftPanelTab === 'health' ? theme.colors.bgSecondary : 'transparent',
                      border: 'none',
                      borderBottom: leftPanelTab === 'health' ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                      color: leftPanelTab === 'health' ? theme.colors.textPrimary : theme.colors.textMuted,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.medium,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontFamily: theme.fonts.sans,
                    }}
                  >
                    💊 Health
                  </button>
                </div>
                
                {/* Tab Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {leftPanelTab === 'categories' ? (
                    <CategoryLegend 
                      clusters={data.clusters}
                      selectedCategory={selectedCategory}
                      onSelect={setSelectedCategory}
                      compact={isTablet}
                      embedded
                      healthScore={healthScore}
                      nodes={data.nodes}
                      edges={data.edges}
                      onSelectNode={setSelectedNode}
                      selectedNode={selectedNode}
                    />
                  ) : (
                    <div style={{ padding: '12px' }}>
                      <HealthDashboard nodes={data.nodes} />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* CENTER COLUMN: 3D Canvas + Info Panel */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: isMobile ? '56px' : 0,
            }}>
              {/* 3D Canvas Area */}
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
                    
                    {/* Tool Dependency Nodes */}
                    {showTools && (
                      <>
                        <ToolNodes 
                          tools={toolGraph.toolNodes}
                          showLabels={true}
                          opacity={0.8}
                        />
                        <ToolConnectionLines
                          edges={toolGraph.toolEdges}
                          skillNodes={filteredNodes}
                          toolNodes={toolGraph.toolNodes}
                          opacity={0.25}
                        />
                      </>
                    )}
                    
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
                
                {/* Footer hint */}
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
              
              {/* Info Panel - Inside center column */}
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
        /* REPORT MODE */
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

// ═══════════════════════════════════════════════════════════
// Main App with Router
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [route, navigate] = useRouter();

  switch (route) {
    case '/analyze':
      return <AnalyzePage onNavigate={navigate} />;
    case '/results':
      return <ResultsPage onNavigate={navigate} />;
    default:
      return <DemoPage onNavigate={navigate} />;
  }
}
