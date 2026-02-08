import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SkillNodes from './components/SkillNodes';
import ConnectionLines from './components/ConnectionLines';
import InfoPanel from './components/InfoPanel';
import CategoryLegend from './components/CategoryLegend';
import RecommendationsPanel from './components/RecommendationsPanel';
import LoadingScreen from './components/LoadingScreen';
import LanguageSelector from './components/LanguageSelector';
import DiagnosticReportModal from './components/DiagnosticReportModal';
import ReportView from './components/ReportView';
import { useWindowSize } from './hooks/useWindowSize';
import { useTranslation } from './i18n/useTranslation';
import { theme } from './styles/theme';
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';

// ═══════════════════════════════════════════════════════════
// View Mode Types
// ═══════════════════════════════════════════════════════════
type ViewMode = '3d' | 'report';

// ═══════════════════════════════════════════════════════════
// Stat Card Component
// ═══════════════════════════════════════════════════════════
function StatCard({ 
  value, 
  label, 
  sublabel,
  accent = false,
}: { 
  value: string | number; 
  label: string; 
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 24px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      minWidth: '100px',
    }}>
      <span style={{
        fontSize: '32px',
        fontWeight: theme.fontWeight.bold,
        color: accent ? theme.colors.accent : theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          fontSize: theme.fontSize.xs,
          color: accent ? theme.colors.accent : theme.colors.textSecondary,
          marginTop: '2px',
        }}>
          {sublabel}
        </span>
      )}
    </div>
  );
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
      borderRadius: theme.radius.md,
      padding: '4px',
    }}>
      <button
        onClick={() => onChange('3d')}
        style={{
          padding: '8px 16px',
          background: mode === '3d' ? theme.colors.bgSecondary : 'transparent',
          border: mode === '3d' ? `1px solid ${theme.colors.border}` : '1px solid transparent',
          borderRadius: theme.radius.sm,
          color: mode === '3d' ? theme.colors.textPrimary : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
        }}
      >
        🌐 3D View
      </button>
      <button
        onClick={() => onChange('report')}
        style={{
          padding: '8px 16px',
          background: mode === 'report' ? theme.colors.bgSecondary : 'transparent',
          border: mode === 'report' ? `1px solid ${theme.colors.border}` : '1px solid transparent',
          borderRadius: theme.radius.sm,
          color: mode === 'report' ? theme.colors.textPrimary : theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
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
  const { t } = useTranslation();
  
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
          {id === 'categories' ? t.mobile.categories : t.mobile.recommend}
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
  const [showReport, setShowReport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  
  const { isMobile, isTablet, isDesktop } = useWindowSize();
  const { t, language } = useTranslation();

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

  const gradeInfo = useMemo(() => {
    if (healthScore >= 80) return { text: t.header.grade.excellent, color: theme.colors.success };
    if (healthScore >= 65) return { text: t.header.grade.good, color: theme.colors.success };
    if (healthScore >= 50) return { text: t.header.grade.average, color: theme.colors.warning };
    return { text: t.header.grade.poor, color: theme.colors.error };
  }, [healthScore, t]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/viz-data.json');
        if (response.ok) {
          const json = await response.json();
          setData(json);
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
  const dateStr = now.toLocaleDateString(
    language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );

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
          REPORT HEADER
      ═══════════════════════════════════════════════════════════ */}
      <header style={{
        padding: isMobile ? '16px' : '24px 32px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
      }}>
        {/* Title & Actions Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <h1 style={{
                fontSize: isMobile ? theme.fontSize.lg : theme.fontSize.xl,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: 0,
              }}>
                {t.diagnosis.title.replace('📊 ', '')}
              </h1>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isMobile ? '8px' : '24px',
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
            }}>
              <span>{t.diagnosis.target}: <span style={{ color: theme.colors.textSecondary }}>Simon (seojoonkim)</span></span>
              <span>{t.diagnosis.dateTime}: <span style={{ color: theme.colors.textSecondary }}>{dateStr}</span></span>
            </div>
          </div>
          
          {/* Actions */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowReport(true)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📄 {t.header.report}
              </button>
              <LanguageSelector />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '16px',
          flexWrap: 'wrap',
        }}>
          <StatCard 
            value={healthScore} 
            label={t.header.healthScore}
            sublabel={gradeInfo.text}
            accent 
          />
          <StatCard 
            value={data.nodes.length} 
            label={t.header.skills}
          />
          <StatCard 
            value={data.edges.length} 
            label={t.header.connections}
          />
          <StatCard 
            value={data.clusters.length} 
            label={t.diagnosis.categories}
          />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          VIEW MODE TABS
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
        
        {isMobile && (
          <LanguageSelector compact />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {viewMode === '3d' ? (
          <>
            {/* 3D Canvas */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: isMobile ? '56px' : 0,
            }}>
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
            </div>
            
            {/* Panels */}
            {!isMobile && (
              <CategoryLegend 
                clusters={data.clusters}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                compact={isTablet}
              />
            )}
            
            {isDesktop && <RecommendationsPanel />}
            {isTablet && <RecommendationsPanel position="bottom" />}
            
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
            
            {/* Info Panel */}
            <InfoPanel 
              node={selectedNode || hoveredNode}
              allNodes={data.nodes}
              edges={data.edges}
              metrics={data.metrics}
              onClose={() => setSelectedNode(null)}
              mobile={isMobile}
            />
            
            {/* Footer */}
            {!isMobile && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
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
          </>
        ) : (
          /* Report View */
          <ReportView data={data} />
        )}
      </div>
      
      {/* Report Modal */}
      <DiagnosticReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        data={data}
        healthScore={healthScore}
      />
    </div>
  );
}
