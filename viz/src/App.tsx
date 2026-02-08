import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
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
import { useWindowSize } from './hooks/useWindowSize';
import { useTranslation } from './i18n/useTranslation';
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';

// Get grade info from health score
function getGradeInfo(score: number, t: ReturnType<typeof useTranslation>['t']) {
  if (score >= 80) return { text: t.header.grade.excellent, color: '#10b981' };
  if (score >= 65) return { text: t.header.grade.good, color: '#22c55e' };
  if (score >= 50) return { text: t.header.grade.average, color: '#f59e0b' };
  return { text: t.header.grade.poor, color: '#ef4444' };
}

// ═══════════════════════════════════════════════════════════
// Header Stat Component (Improved with labels)
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
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: '10px',
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
      background: `${color}10`,
      border: `1px solid ${color}25`,
      borderRadius: '12px',
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
      background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.95) 30%)',
      zIndex: 200,
    }}>
      <button
        onClick={() => onToggle(activePanel === 'categories' ? 'none' : 'categories')}
        style={{
          flex: 1,
          maxWidth: '140px',
          padding: '12px 16px',
          background: activePanel === 'categories' 
            ? 'rgba(0,255,255,0.2)' 
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${activePanel === 'categories' ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          color: activePanel === 'categories' ? '#00ffff' : '#888',
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
          background: activePanel === 'recommendations' 
            ? 'rgba(255,0,255,0.2)' 
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${activePanel === 'recommendations' ? 'rgba(255,0,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          color: activePanel === 'recommendations' ? '#ff00ff' : '#888',
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
      background: '#050508',
      overflow: 'hidden',
    }}>
      {/* 3D Canvas - Responsive Height */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: isMobile ? '60px' : 0,
      }}>
        <Canvas
          camera={{ position: [0, 0, isMobile ? 30 : 25], fov: isMobile ? 70 : 60 }}
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: 'high-performance',
          }}
          style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}
          dpr={[1, isMobile ? 1.5 : 2]}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[15, 15, 15]} intensity={0.8} color="#00ffff" />
            <pointLight position={[-15, -15, -15]} intensity={0.4} color="#ff00ff" />
            <pointLight position={[0, 0, 20]} intensity={0.3} color="#ffffff" />
            
            {/* Star Background */}
            <Stars 
              radius={150} 
              depth={80} 
              count={isMobile ? 4000 : 8000} 
              factor={5} 
              saturation={0.2} 
              fade 
              speed={0.5}
            />
            
            {/* Ambient Particles - Reduced on mobile */}
            <ParticleField count={isMobile ? 150 : 300} color="#00ffff" size={0.02} speed={0.1} radius={25} />
            {!isMobile && <ParticleField count={200} color="#ff00ff" size={0.015} speed={0.15} radius={20} />}
            
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
              autoRotateSpeed={0.3}
              maxDistance={isMobile ? 60 : 50}
              minDistance={isMobile ? 10 : 5}
              dampingFactor={0.05}
              enableDamping
              target={[center.x, center.y, center.z]}
              touches={{
                ONE: 1, // ROTATE
                TWO: 512, // DOLLY_PAN
              }}
            />
            
            {/* Post-processing Effects - Reduced on mobile */}
            <EffectComposer>
              <Bloom 
                luminanceThreshold={0.1}
                luminanceSmoothing={0.9}
                intensity={isMobile ? 1.5 : 2}
                mipmapBlur
              />
              {!isMobile && (
                <ChromaticAberration
                  blendFunction={BlendFunction.NORMAL}
                  offset={[0.0003, 0.0003]}
                />
              )}
              <Vignette
                offset={0.3}
                darkness={isMobile ? 0.5 : 0.7}
                blendFunction={BlendFunction.NORMAL}
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          HEADER - Responsive & Improved
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0) 100%)',
        padding: isMobile ? '12px' : '16px 24px',
        zIndex: 100,
      }}>
        {/* Top Row: Logo + Language + Report */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '12px' : '16px',
        }}>
          {/* Left: Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '14px',
          }}>
            <div style={{
              width: isMobile ? '36px' : '44px',
              height: isMobile ? '36px' : '44px',
              borderRadius: isMobile ? '10px' : '12px',
              background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '18px' : '22px',
              boxShadow: '0 0 30px rgba(0,255,255,0.2)',
            }}>
              ⚔️
            </div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '18px' : '24px', 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #ffff00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                SkillRespec
              </h1>
              {!isMobile && (
                <p style={{ 
                  fontSize: '11px', 
                  color: '#555', 
                  marginTop: '2px',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {t.header.subtitle}
                </p>
              )}
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
              <>
                <button
                  onClick={() => setShowReport(true)}
                  style={{
                    padding: isTablet ? '6px 12px' : '8px 16px',
                    background: 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.25) 0%, rgba(255,0,255,0.25) 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📊 {t.header.report}
                </button>
                
                <button style={{
                  padding: isTablet ? '6px 12px' : '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  📤 {t.header.export}
                </button>
              </>
            )}
            
            {isMobile && (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📊
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '8px' : '16px',
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
            color="#00ffff"
            compact={isMobile}
          />
          <HeaderStat 
            icon="🔗" 
            value={data.edges.length}
            label={t.header.connections}
            color="#ff00ff"
            compact={isMobile}
          />
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          LEFT PANEL - Categories (Desktop & Tablet only)
      ═══════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <CategoryLegend 
          clusters={data.clusters}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          compact={isTablet}
        />
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL - Recommendations (Desktop only)
      ═══════════════════════════════════════════════════════════ */}
      {isDesktop && <RecommendationsPanel />}
      
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
          background: 'rgba(10, 10, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          maxHeight: '50vh',
          overflowY: 'auto',
          zIndex: 150,
          animation: 'slideUp 0.3s ease-out',
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
          background: 'rgba(10, 10, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          maxHeight: '60vh',
          overflowY: 'auto',
          zIndex: 150,
          animation: 'slideUp 0.3s ease-out',
        }}>
          <RecommendationsPanel position="mobile" />
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
      ═══════════════════════════════════════════════════════════ */}
      {isMobile && (
        <MobileNavToggle 
          activePanel={mobilePanel} 
          onToggle={setMobilePanel} 
        />
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          INFO PANEL - Node Details (Floating, responsive)
      ═══════════════════════════════════════════════════════════ */}
      <InfoPanel 
        node={selectedNode || hoveredNode}
        allNodes={data.nodes}
        edges={data.edges}
        metrics={data.metrics}
        onClose={() => setSelectedNode(null)}
        mobile={isMobile}
      />
      
      {/* ═══════════════════════════════════════════════════════════
          DIAGNOSTIC REPORT MODAL
      ═══════════════════════════════════════════════════════════ */}
      <DiagnosticReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        data={data}
        healthScore={healthScore}
      />
      
      {/* ═══════════════════════════════════════════════════════════
          FOOTER - Instructions (Desktop/Tablet only)
      ═══════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: isTablet ? '16px' : '24px',
          padding: '10px 20px',
          background: 'rgba(10, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { icon: '🖱️', label: t.footer.rotate },
            { icon: '🔍', label: t.footer.zoom },
            { icon: '👆', label: t.footer.click },
          ].map(({ icon, label }) => (
            <div key={label} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
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

      {/* Powered by badge - Desktop only */}
      {isDesktop && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          fontSize: '10px',
          color: '#333',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {t.footer.powered} <span style={{ color: '#555' }}>Three.js + React</span>
        </div>
      )}
      
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
