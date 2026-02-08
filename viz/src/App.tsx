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
import MarketplacePanel from './components/MarketplacePanel';
import PresetPanel from './components/PresetPanel';
import LintPanel from './components/LintPanel';
import TeamPanel from './components/TeamPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import AIRecommendations from './components/AIRecommendations';
import HistoryPanel from './components/HistoryPanel';
import UpdatesPanel from './components/UpdatesPanel';
import CreatePanel from './components/CreatePanel';
import { useWindowSize } from './hooks/useWindowSize';
import { theme, glass, glassElevated } from './styles/theme';
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
      window.location.hash = path.slice(1);
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
// View Toggle Component - Modern pill style with glass effect
// ═══════════════════════════════════════════════════════════
function ViewToggle({ 
  mode, 
  onChange 
}: { 
  mode: ViewMode; 
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div 
      className="flex p-1 rounded-full animate-fade-in"
      style={{
        background: theme.colors.bgTertiary,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {[
        { id: '3d' as ViewMode, icon: '◈', label: 'Graph' },
        { id: 'report' as ViewMode, icon: '☰', label: 'Report' },
      ].map(({ id, icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-2"
          style={{
            background: mode === id 
              ? `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`
              : 'transparent',
            color: mode === id ? theme.colors.bgPrimary : theme.colors.textMuted,
            fontFamily: theme.fonts.sans,
            boxShadow: mode === id ? theme.shadows.glowSm : 'none',
          }}
        >
          <span className="text-xs opacity-80">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab Button Component
// ═══════════════════════════════════════════════════════════
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  showLabel = true,
  title,
}: { 
  active: boolean;
  onClick: () => void;
  icon: string;
  label?: string;
  showLabel?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all duration-150 relative"
      style={{
        background: active ? theme.colors.bgSecondary : 'transparent',
        color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        fontFamily: theme.fonts.sans,
        fontSize: theme.fontSize.sm,
        fontWeight: active ? theme.fontWeight.medium : theme.fontWeight.normal,
      }}
    >
      <span className="text-sm">{icon}</span>
      {showLabel && label && <span className="hidden lg:inline">{label}</span>}
      {active && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
          style={{
            width: '24px',
            background: theme.colors.accent,
            boxShadow: theme.shadows.glowSm,
          }}
        />
      )}
    </button>
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
    <div 
      className="fixed bottom-0 left-0 right-0 flex gap-2 p-3 safe-bottom z-50"
      style={{
        ...glassElevated,
        borderTop: `1px solid ${theme.colors.border}`,
        borderRadius: 0,
      }}
    >
      {[
        { id: 'categories', label: 'Categories', icon: '◫' },
        { id: 'recommendations', label: 'Recommend', icon: '◉' },
      ].map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onToggle(activePanel === id ? 'none' : id as 'categories' | 'recommendations')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-150"
          style={{
            background: activePanel === id ? theme.colors.bgSurface : 'transparent',
            border: `1px solid ${activePanel === id ? theme.colors.borderHover : theme.colors.border}`,
            color: activePanel === id ? theme.colors.textPrimary : theme.colors.textMuted,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
          }}
        >
          <span className="text-base">{icon}</span>
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
  const [leftPanelTab, setLeftPanelTab] = useState<'categories' | 'health' | 'history'>('categories');
  const [rightPanelTab, setRightPanelTab] = useState<'recommend' | 'ai' | 'marketplace' | 'presets' | 'lint' | 'team' | 'analytics' | 'updates' | 'create'>('recommend');
  
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

  const healthData = useMemo(() => {
    if (!data) return { averageScore: 0, averageGrade: 'F' as const };
    return calculateDashboardHealth(data.nodes);
  }, [data]);

  const healthScore = healthData.averageScore;

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

  let filteredNodes = selectedCategory
    ? data.nodes.filter(n => n.category === selectedCategory)
    : data.nodes;
  
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
    <div 
      className="w-screen h-screen relative overflow-hidden flex flex-col"
      style={{
        background: theme.colors.bgPrimary,
        fontFamily: theme.fonts.sans,
      }}
    >
      {/* ═══════════════════════════════════════════════════════
          HEADER - Glass morphism with refined layout
      ═══════════════════════════════════════════════════════ */}
      <header 
        className="flex items-center gap-4 px-4 shrink-0 animate-slide-down"
        style={{
          height: isMobile ? '52px' : '56px',
          ...glass,
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
        }}
      >
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{
              background: theme.colors.accentMuted,
              boxShadow: theme.shadows.glowSm,
            }}
          >
            ⚔️
          </div>
          <span 
            className="text-base font-semibold tracking-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            SkillRespec
          </span>
        </div>

        {/* Separator */}
        <div 
          className="w-px h-5"
          style={{ background: theme.colors.border }}
        />

        {/* Analyze Button */}
        <button
          onClick={() => onNavigate('/analyze')}
          className="px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-150 hover:shadow-glow"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
            color: theme.colors.bgPrimary,
            fontFamily: theme.fonts.sans,
            boxShadow: theme.shadows.glowSm,
          }}
        >
          <span className="text-xs">◎</span>
          Analyze Your Skills
        </button>

        {/* Search Bar */}
        {!isMobile && (
          <div className="flex-1 max-w-sm">
            <SearchBar
              onSearch={setSearchQuery}
              onSelectSkill={(id) => {
                const node = data.nodes.find(n => n.id === id);
                if (node) setSelectedNode(node);
              }}
              placeholder="Search skills..."
            />
          </div>
        )}

        {/* Tools Toggle */}
        {!isMobile && (
          <button
            onClick={() => setShowTools(!showTools)}
            className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-150"
            style={{
              background: showTools ? theme.colors.bgSurface : 'transparent',
              border: `1px solid ${showTools ? theme.colors.accent : theme.colors.border}`,
              color: showTools ? theme.colors.accent : theme.colors.textMuted,
              fontFamily: theme.fonts.sans,
            }}
          >
            <span className="text-xs">⚙</span>
            Tools
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Mode Toggle */}
        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Target + Date */}
        <div 
          className="flex items-center gap-2 text-sm"
          style={{ color: theme.colors.textMuted }}
        >
          <span 
            className="font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Demo
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="font-mono text-xs" style={{ color: theme.colors.textTertiary }}>
            {dateStr}
          </span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════ */}
      {viewMode === '3d' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div 
            className="flex-1 grid overflow-hidden min-h-0"
            style={{
              gridTemplateColumns: isDesktop 
                ? '240px 1fr 360px' 
                : isTablet 
                  ? '220px 1fr 320px' 
                  : '1fr',
            }}
          >
            {/* ═══════════════════════════════════════════════════
                LEFT COLUMN: Categories / Health / History
            ═══════════════════════════════════════════════════ */}
            {!isMobile && (
              <div 
                className="overflow-hidden flex flex-col animate-slide-right"
                style={{
                  background: theme.colors.bgSecondary,
                  borderRight: `1px solid ${theme.colors.border}`,
                }}
              >
                {/* Tab Switcher */}
                <div 
                  className="flex shrink-0"
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    background: theme.colors.bgTertiary,
                  }}
                >
                  <TabButton
                    active={leftPanelTab === 'categories'}
                    onClick={() => setLeftPanelTab('categories')}
                    icon="◫"
                    label="Categories"
                  />
                  <TabButton
                    active={leftPanelTab === 'health'}
                    onClick={() => setLeftPanelTab('health')}
                    icon="◉"
                    label="Health"
                  />
                  <TabButton
                    active={leftPanelTab === 'history'}
                    onClick={() => setLeftPanelTab('history')}
                    icon="◷"
                    label="History"
                  />
                </div>
                
                {/* Tab Content */}
                <div className="flex-1 overflow-auto">
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
                  ) : leftPanelTab === 'health' ? (
                    <div className="p-3">
                      <HealthDashboard nodes={data.nodes} />
                    </div>
                  ) : (
                    <HistoryPanel currentSkills={data.nodes} embedded />
                  )}
                </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════
                CENTER COLUMN: 3D Canvas + Info Panel
            ═══════════════════════════════════════════════════ */}
            <div 
              className="relative overflow-hidden flex flex-col"
              style={{ paddingBottom: isMobile ? '60px' : 0 }}
            >
              {/* 3D Canvas Area */}
              <div className="flex-1 relative overflow-hidden min-h-0">
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
                  <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 px-4 py-2 rounded-full text-xs"
                    style={{
                      ...glass,
                      color: theme.colors.textMuted,
                    }}
                  >
                    <span>Drag to rotate</span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span>Scroll to zoom</span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span>Click for details</span>
                  </div>
                )}
              </div>
              
              {/* Info Panel */}
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
            
            {/* ═══════════════════════════════════════════════════
                RIGHT COLUMN: Multi-tab panel
            ═══════════════════════════════════════════════════ */}
            {(isDesktop || isTablet) && (
              <div 
                className="overflow-hidden flex flex-col animate-slide-left"
                style={{
                  background: theme.colors.bgSecondary,
                  borderLeft: `1px solid ${theme.colors.border}`,
                }}
              >
                {/* Tab Switcher - Scrollable icons */}
                <div 
                  className="flex shrink-0 overflow-x-auto"
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    background: theme.colors.bgTertiary,
                  }}
                >
                  {[
                    { id: 'recommend', icon: '◎', title: 'Recommendations' },
                    { id: 'ai', icon: '⬡', title: 'AI Recommendations' },
                    { id: 'marketplace', icon: '◈', title: 'Marketplace' },
                    { id: 'presets', icon: '≡', title: 'Presets' },
                    { id: 'lint', icon: '⊙', title: 'Lint' },
                    { id: 'team', icon: '◔', title: 'Team Sync' },
                    { id: 'analytics', icon: '▤', title: 'Analytics' },
                    { id: 'updates', icon: '↻', title: 'Updates' },
                    { id: 'create', icon: '✚', title: 'Create Skill' },
                  ].map(({ id, icon, title }) => (
                    <TabButton
                      key={id}
                      active={rightPanelTab === id}
                      onClick={() => setRightPanelTab(id as typeof rightPanelTab)}
                      icon={icon}
                      title={title}
                      showLabel={false}
                    />
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {rightPanelTab === 'recommend' && <RecommendationsPanel embedded />}
                  {rightPanelTab === 'ai' && <AIRecommendations nodes={data.nodes} embedded />}
                  {rightPanelTab === 'marketplace' && <MarketplacePanel installedSkills={data.nodes} embedded />}
                  {rightPanelTab === 'presets' && <PresetPanel activeSkills={data.nodes} embedded />}
                  {rightPanelTab === 'lint' && <LintPanel skills={data.nodes} selectedSkill={selectedNode} embedded />}
                  {rightPanelTab === 'team' && <TeamPanel activeSkills={data.nodes} embedded />}
                  {rightPanelTab === 'analytics' && <AnalyticsPanel nodes={data.nodes} embedded />}
                  {rightPanelTab === 'updates' && <UpdatesPanel skills={data.nodes} embedded />}
                  {rightPanelTab === 'create' && <CreatePanel embedded />}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile: Info panel above nav */}
          {isMobile && (selectedNode || hoveredNode) && (
            <div className="fixed bottom-16 left-0 right-0 z-40">
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
            <div 
              className="fixed bottom-16 left-0 right-0 max-h-[50vh] overflow-y-auto z-40 animate-slide-up"
              style={{
                ...glassElevated,
                borderRadius: `${theme.radius.xl} ${theme.radius.xl} 0 0`,
              }}
            >
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
            <div 
              className="fixed bottom-16 left-0 right-0 max-h-[60vh] overflow-y-auto z-40 animate-slide-up"
              style={{
                ...glassElevated,
                borderRadius: `${theme.radius.xl} ${theme.radius.xl} 0 0`,
              }}
            >
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
        <div 
          className="flex-1 overflow-auto"
          style={{ background: theme.colors.bgPrimary }}
        >
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
