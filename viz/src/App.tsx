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
import type { VizData, SkillNode } from './types';
import { generateDemoData } from './data/demoData';

// Header Stat Component
function HeaderStat({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: string; 
  value: string | number; 
  label: string; 
  color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: '10px',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: color,
          fontFamily: '"JetBrains Mono", monospace',
          lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '10px',
          color: '#666',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          marginTop: '2px',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<VizData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    }}>
      {/* 3D Canvas - Center */}
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)' }}
        dpr={[1, 2]}
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
            count={8000} 
            factor={5} 
            saturation={0.2} 
            fade 
            speed={0.5}
          />
          
          {/* Ambient Particles */}
          <ParticleField count={300} color="#00ffff" size={0.02} speed={0.1} radius={25} />
          <ParticleField count={200} color="#ff00ff" size={0.015} speed={0.15} radius={20} />
          
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
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={!selectedNode && !hoveredNode}
            autoRotateSpeed={0.3}
            maxDistance={50}
            minDistance={5}
            dampingFactor={0.05}
            enableDamping
            target={[center.x, center.y, center.z]}
          />
          
          {/* Post-processing Effects */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              intensity={2}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.0003, 0.0003]}
            />
            <Vignette
              offset={0.3}
              darkness={0.7}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* ═══════════════════════════════════════════════════════════
          HEADER - Top Bar with Logo + Key Metrics
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        background: 'linear-gradient(180deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
      }}>
        {/* Left: Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 0 30px rgba(0,255,255,0.2)',
          }}>
            ⚔️
          </div>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
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
            <p style={{ 
              fontSize: '11px', 
              color: '#555', 
              marginTop: '2px',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              AI Skill Tree Analyzer
            </p>
          </div>
        </div>

        {/* Center: Key Metrics */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <HeaderStat 
            icon="🎯" 
            value={`${healthScore}%`}
            label="Health Score" 
            color="#10b981" 
          />
          <HeaderStat 
            icon="📦" 
            value={data.nodes.length}
            label="Skills" 
            color="#00ffff" 
          />
          <HeaderStat 
            icon="🔗" 
            value={data.edges.length}
            label="Connections" 
            color="#ff00ff" 
          />
        </div>

        {/* Right: Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <button style={{
            padding: '8px 16px',
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
            📤 Export
          </button>
          <button style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            ⚡ Respec
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          LEFT PANEL - Categories Filter
      ═══════════════════════════════════════════════════════════ */}
      <CategoryLegend 
        clusters={data.clusters}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
      
      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL - Recommendations
      ═══════════════════════════════════════════════════════════ */}
      <RecommendationsPanel />
      
      {/* ═══════════════════════════════════════════════════════════
          INFO PANEL - Node Details (Floating)
      ═══════════════════════════════════════════════════════════ */}
      <InfoPanel 
        node={selectedNode || hoveredNode}
        allNodes={data.nodes}
        edges={data.edges}
        metrics={data.metrics}
        onClose={() => setSelectedNode(null)}
      />
      
      {/* ═══════════════════════════════════════════════════════════
          FOOTER - Instructions
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '24px',
        padding: '10px 20px',
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {[
          { icon: '🖱️', label: 'Drag to rotate' },
          { icon: '🔍', label: 'Scroll to zoom' },
          { icon: '👆', label: 'Click for details' },
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

      {/* Powered by badge */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: '10px',
        color: '#333',
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        Powered by <span style={{ color: '#555' }}>Three.js + React</span>
      </div>
    </div>
  );
}
