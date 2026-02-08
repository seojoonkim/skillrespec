import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { theme } from '../styles/theme';
import type { Skill } from '../data/skills';
import { getNodeSize } from '../data/skills';

interface SkillNodeProps {
  skill: Skill;
  position: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (skill: Skill) => void;
}

export function SkillNode({ 
  skill, 
  position, 
  isHovered, 
  isSelected,
  onHover, 
  onClick 
}: SkillNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  
  // Use muted category colors
  const color = theme.categoryColors[skill.category] || '#666666';
  const size = getNodeSize(skill.estimatedTokens);
  const scale = isHovered || isSelected ? 1.3 : localHover ? 1.15 : 1;

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size * scale, 24, 24]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setLocalHover(true);
          onHover(skill.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setLocalHover(false);
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(skill);
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 0.3 : 0.1}
          roughness={0.6}
          metalness={0.3}
        />
      </Sphere>

      {/* Label - minimal style */}
      {(localHover || isHovered || isSelected) && (
        <Html
          position={[
            position[0] > 3 ? -1.2 : position[0] < -3 ? 1.2 : 0,
            size * scale + 0.4,
            0
          ]}
          center
          zIndexRange={[0, 50]}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              padding: '8px 12px',
              borderRadius: theme.radius.md,
              fontSize: '13px',
              fontFamily: theme.fonts.sans,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: '2px' }}>
              {skill.name}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: theme.colors.textMuted,
              display: 'flex',
              gap: '8px',
            }}>
              <span style={{ textTransform: 'capitalize' }}>{skill.category}</span>
              <span>·</span>
              <span style={{ fontFamily: theme.fonts.mono }}>~{skill.estimatedTokens}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
