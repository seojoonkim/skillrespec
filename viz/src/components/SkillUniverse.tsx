import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { SkillNode } from './SkillNode';
import { SkillEdge } from './SkillEdge';
import type { Skill, SkillCatalog } from '../data/skills';
import { generatePositions, findSimilarSkills, CATEGORY_COLORS } from '../data/skills';

interface SkillUniverseProps {
  catalog: SkillCatalog;
  onSkillSelect: (skill: Skill | null) => void;
  selectedSkill: Skill | null;
}

function Scene({ catalog, onSkillSelect, selectedSkill }: SkillUniverseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positions = useMemo(
    () => generatePositions(catalog.skills),
    [catalog.skills]
  );

  const edges = useMemo(
    () => findSimilarSkills(catalog.skills),
    [catalog.skills]
  );

  const highlightedEdges = useMemo(() => {
    if (!hoveredId && !selectedSkill) return new Set<string>();
    const targetId = hoveredId || selectedSkill?.id;
    return new Set(
      edges
        .filter(([a, b]) => a === targetId || b === targetId)
        .map(([a, b]) => `${a}-${b}`)
    );
  }, [edges, hoveredId, selectedSkill]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={60} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        autoRotate
        autoRotateSpeed={0.3}
      />

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#4488ff" />

      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Skill nodes */}
      {catalog.skills.map((skill) => {
        const pos = positions.get(skill.id);
        if (!pos) return null;

        return (
          <SkillNode
            key={skill.id}
            skill={skill}
            position={pos}
            isHovered={hoveredId === skill.id}
            isSelected={selectedSkill?.id === skill.id}
            onHover={setHoveredId}
            onClick={onSkillSelect}
          />
        );
      })}

      {/* Similarity edges */}
      {edges.map(([idA, idB, strength]) => {
        const posA = positions.get(idA);
        const posB = positions.get(idB);
        if (!posA || !posB) return null;

        const edgeKey = `${idA}-${idB}`;
        const isHighlighted = highlightedEdges.has(edgeKey);

        return (
          <SkillEdge
            key={edgeKey}
            start={posA}
            end={posB}
            strength={strength}
            highlighted={isHighlighted}
          />
        );
      })}

      {/* Category legend spheres */}
      {Object.entries(CATEGORY_COLORS).map(([category, color], index) => (
        <group key={category} position={[-35, 15 - index * 3, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function SkillUniverse({ catalog, onSkillSelect, selectedSkill }: SkillUniverseProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        style={{ background: '#0a0a1a' }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Scene
          catalog={catalog}
          onSkillSelect={onSkillSelect}
          selectedSkill={selectedSkill}
        />
      </Canvas>

      {/* Legend overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '16px',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>🌌 Skill Universe</h3>
        <p style={{ margin: '0 0 12px 0', color: '#aaa', fontSize: '12px' }}>
          {catalog.totalSkills} skills visualized
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
              <span>{category}</span>
              <span style={{ color: '#666', marginLeft: 'auto' }}>
                {catalog.byCategory[category] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 16px',
          borderRadius: '8px',
          color: '#888',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        🖱️ Drag to rotate • Scroll to zoom • Click skill for details
      </div>
    </div>
  );
}
