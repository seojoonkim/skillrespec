import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import SkillNodes from './components/SkillNodes';
import ConnectionLines from './components/ConnectionLines';
import ParticleField from './components/ParticleField';
import InfoPanel from './components/InfoPanel';
import CategoryLegend from './components/CategoryLegend';
import RecommendationsPanel from './components/RecommendationsPanel';
import LoadingScreen from './components/LoadingScreen';
import LanguageSelector from './components/LanguageSelector';
import DiagnosticReportModal from './components/DiagnosticReportModal';
import ViewModeTabs, { type ViewMode } from './components/ViewModeTabs';
import ReportView from './components/ReportView';
import { useWindowSize } from './hooks/useWindowSize';
import { useTranslation } from './i18n/useTranslation';
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';

// ═══════════════════════════════════════════════════════════
// Header Stat Component - Clean, flat design
// ═══════════════════════════════════════════════════════════
function HeaderStat({ 
  icon, 
  value, 
  label, 
  color,
  subLabel,
  compact = false,
}: { 
  icon: string; 
  value: string | number; 
  label: string; 
  color: string;
  subLabel?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 12px',
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '8px',
        minWidth: '56px',
      }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: color,
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {value}
        </span>
        <span style={{
          fontSize: '9px',
          color: '#666',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 18px',
      background: '#141414',
      border: '1px solid #262626',
      borderRadius: '10px',
      minWidth: '90px',
    }}>
      <span style={{ fontSize: '18px', marginBottom: '2px' }}>{icon}</span>
      <div style={{
        fontSize: '22px',
        fontWeight: 800,
        color: color,
        fontFamily: '"JetBrains Mono", monospace',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '11px',
        color: '#888',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 500,
      }}>
        {label}
      </div>
      {subLabel && (
        <div style={{
          fontSize: '10px',
          color: color,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          marginTop: '-2px',
        }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

// Get grade info from health score
function getGradeInfo(score: number, t: ReturnType<typeof useTranslation>['t']) {
  if (score >= 80) return { text: t.header.grade.excellent, color: '#10b981' };
  if (score >= 65) return { text: t.header.grade.good, color: '#22c55e' };
  if (score >= 50) return { text: t.header.grade.average, color: '#f59e0b' };
  return { text: t.header.grade.poor, color: '#ef4444' };
}

// ═══════════════════════════════════════════════════════════
// Mobile Bottom Nav Toggle
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
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.98) 30%)',
      zIndex: 200,
    }}>
      <button
        onClick={() => onToggle(activePanel === 'categories' ? 'none' : 'categories')}
        style={{
          flex: 1,
          maxWidth: '140px',
          padding: '12px 16px',
          background: activePanel === 'categories' ? '#1a2e1a' : '#141414',
          border: `1px solid ${activePanel === 'categories' ? '#10b981' : '#262626'}`,
          borderRadius: '10px',
          color: activePanel === 'categories' ? '#10b981' : '#888',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        🏷️ {t.mobile.categories}
      </button>
      <button
        onClick={() => onToggle(activePanel === 'recommendations' ? 'none' : 'recommendations')}
        style={{
          flex: 1,
          maxWidth: '140px',
          padding: '12px 16px',
          background: activePanel === 'recommendations' ? '#1a2e1a' : '#141414',
          border: `1px solid ${activePanel === 'recommendations' ? '#10b981' : '#262626'}`,
          borderRadius: '10px',
          color: activePanel === 'recommendations' ? '#10b981' : '#888',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        🎯 {t.mobile.recommend}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main App Component
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
  const { t } = useTranslation();

  // Calculate center of mass for camera target
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

  // Calculate health score
  const healthScore = useMemo(() => {
    if (!data) return 0;
    const balance = data.metrics?.categoryBalance || 0.5;
    const depth = data.metrics?.avgDepth || 1;
    return Math.round((balance * 40 + Math.min(depth / 3, 1) * 30 + 30) * 10) / 10;
  }, [data]);
  
  const gradeInfo = useMemo(() => getGradeInfo(healthScore, t), [healthScore, t]);

  // Current datetime for report header
  const currentDateTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

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

  // Close mobile panel when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setMobilePanel('none');
    }
  }, [isDesktop]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!data) {
    return <LoadingScreen error="Failed to load skill data" />;
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

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      background: '#0a0a0a',
      overflow: 'hidden',
    }}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER - 보고서 스타일 (Clean, flat design)
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: '#0a0a0a',
        borderBottom: '1px solid #262626',
        zIndex: 900,
      }}>
        {/* Title Bar */}
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 24px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: Logo + Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '14px',
          }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '10px',
              background: '#141414',
              border: '1px solid #262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '16px' : '20px',
            }}>
              📊
            </div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '16px' : '20px', 
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                {t.diagnosis.title.replace('📊 ', '')}
              </h1>
              <p style={{ 
                fontSize: '11px', 
                color: '#666', 
                marginTop: '2px',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                {t.diagnosis.target}: Simon · {currentDateTime}
              </p>
            </div>
          </div>

          {/* Right: Language + Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '10px',
          }}>
            <LanguageSelector compact={isMobile} />
            
            {!isMobile && (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  padding: '8px 14px',
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.color = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#141414';
                  e.currentTarget.style.borderColor = '#262626';
                  e.currentTarget.style.color = '#888';
                }}
              >
                📄 {t.header.report}
              </button>
            )}
            
            {isMobile && (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  padding: '8px',
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                📄
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{
          padding: isMobile ? '12px 16px' : '14px 24px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '8px' : '14px',
        }}>
          <HeaderStat 
            icon="🏥" 
            value={`${healthScore}%`}
            label={t.header.healthScore}
            subLabel={gradeInfo.text}
            color={gradeInfo.color}
            compact={isMobile}
          />
          <HeaderStat 
            icon="📦" 
            value={data.nodes.length}
            label={t.header.skills}
            color="#10b981"
            compact={isMobile}
          />
          <HeaderStat 
            icon="🔗" 
            value={data.edges.length}
            label={t.header.connections}
            color="#10b981"
            compact={isMobile}
          />
        </div>

        {/* View Mode Tabs */}
        <div style={{
          padding: isMobile ? '10px 16px' : '12px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <ViewModeTabs
            activeMode={viewMode}
            onModeChange={setViewMode}
            compact={isMobile}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '175px' : '210px',
        left: 0,
        right: 0,
        bottom: isMobile ? '60px' : 0,
      }}>
        {viewMode === '3d' ? (
          <>
            {/* 3D Canvas */}
            <Canvas
              camera={{ position: [0, 0, isMobile ? 30 : 25], fov: isMobile ? 70 : 60 }}
              gl={{ 
                antialias: true, 
                alpha: false,
                powerPreference: 'high-performance',
              }}
              style={{ background: '#0a0a0a' }}
              dpr={[1, isMobile ? 1.5 : 2]}
            >
              <Suspense fallback={null}>
                {/* Lighting - Simplified */}
                <ambientLight intensity={0.4} />
                <pointLight position={[15, 15, 15]} intensity={0.6} color="#ffffff" />
                <pointLight position={[-15, -15, -15]} intensity={0.3} color="#ffffff" />
                
                {/* Star Background - Subtle */}
                <Stars 
                  radius={150} 
                  depth={80} 
                  count={isMobile ? 2000 : 4000} 
                  factor={4} 
                  saturation={0} 
                  fade 
                  speed={0.3}
                />
                
                {/* Ambient Particles - Reduced */}
                <ParticleField count={isMobile ? 80 : 150} color="#10b981" size={0.015} speed={0.08} radius={25} />
                
                {/* Skill Nodes */}
                <SkillNodes 
                  nodes={filteredNodes}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  onSelect={setSelectedNode}
                  onHover={setHoveredNode}
                />
                
                {/* Connection Lines */}
                <ConnectionLines 
                  edges={filteredEdges}
                  nodes={data.nodes}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                />
                
                {/* Controls */}
                <OrbitControls 
                  enablePan={!isMobile}
                  enableZoom={true}
                  enableRotate={true}
                  autoRotate={!selectedNode && !hoveredNode}
                  autoRotateSpeed={0.2}
                  maxDistance={isMobile ? 60 : 50}
                  minDistance={isMobile ? 10 : 5}
                  dampingFactor={0.05}
                  enableDamping
                  target={[center.x, center.y, center.z]}
                  touches={{
                    ONE: 1,
                    TWO: 512,
                  }}
                />
                
                {/* Post-processing - Minimal */}
                <EffectComposer>
                  <Bloom 
                    luminanceThreshold={0.3}
                    luminanceSmoothing={0.9}
                    intensity={isMobile ? 0.3 : 0.5}
                    mipmapBlur
                  />
                  <Vignette
                    offset={0.3}
                    darkness={0.4}
                    blendFunction={BlendFunction.NORMAL}
                  />
                </EffectComposer>
              </Suspense>
            </Canvas>

            {/* ═══════════════════════════════════════════════════════════
                LEFT PANEL - Categories (Desktop & Tablet only)
            ═══════════════════════════════════════════════════════════ */}
            {!isMobile && (
              <div style={{ zIndex: 910 }}>
                <CategoryLegend 
                  clusters={data.clusters}
                  selectedCategory={selectedCategory}
                  onSelect={setSelectedCategory}
                  compact={isTablet}
                />
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                RIGHT PANEL - Recommendations (Desktop only)
            ═══════════════════════════════════════════════════════════ */}
            {isDesktop && (
              <div style={{ zIndex: 910 }}>
                <RecommendationsPanel />
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                BOTTOM PANEL - Recommendations (Tablet)
            ═══════════════════════════════════════════════════════════ */}
            {isTablet && <RecommendationsPanel position="bottom" />}
            
            {/* ═══════════════════════════════════════════════════════════
                MOBILE PANELS - Slide-up sheets
            ═══════════════════════════════════════════════════════════ */}
            {isMobile && mobilePanel === 'categories' && (
              <div style={{
                position: 'fixed',
                bottom: '60px',
                left: 0,
                right: 0,
                background: '#0a0a0a',
                borderRadius: '16px 16px 0 0',
                border: '1px solid #262626',
                borderBottom: 'none',
                maxHeight: '50vh',
                overflowY: 'auto',
                zIndex: 920,
                animation: 'slideUp 0.2s ease-out',
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
                bottom: '60px',
                left: 0,
                right: 0,
                background: '#0a0a0a',
                borderRadius: '16px 16px 0 0',
                border: '1px solid #262626',
                borderBottom: 'none',
                maxHeight: '60vh',
                overflowY: 'auto',
                zIndex: 920,
                animation: 'slideUp 0.2s ease-out',
              }}>
                <RecommendationsPanel position="mobile" />
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                MOBILE BOTTOM NAVIGATION (3D View only)
            ═══════════════════════════════════════════════════════════ */}
            {isMobile && (
              <MobileNavToggle 
                activePanel={mobilePanel} 
                onToggle={setMobilePanel} 
              />
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                INFO PANEL - Node Details
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ zIndex: 930 }}>
              <InfoPanel 
                node={selectedNode || hoveredNode}
                allNodes={data.nodes}
                edges={data.edges}
                metrics={data.metrics}
                onClose={() => setSelectedNode(null)}
                mobile={isMobile}
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════
                FOOTER - Instructions (Desktop/Tablet only)
            ═══════════════════════════════════════════════════════════ */}
            {!isMobile && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: isTablet ? '16px' : '24px',
                padding: '8px 16px',
                background: '#141414',
                borderRadius: '8px',
                border: '1px solid #262626',
                zIndex: 50,
              }}>
                {[
                  { icon: '🖱️', label: t.footer.rotate },
                  { icon: '🔍', label: t.footer.zoom },
                  { icon: '👆', label: t.footer.click },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '11px',
                    color: '#666',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════
              REPORT VIEW
          ═══════════════════════════════════════════════════════════ */
          <ReportView
            data={data}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectSkill={setSelectedNode}
            isMobile={isMobile}
          />
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          DIAGNOSTIC REPORT MODAL
      ═══════════════════════════════════════════════════════════ */}
      <DiagnosticReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        data={data}
        healthScore={healthScore}
      />
      
      {/* Global animations */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
