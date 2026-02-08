import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { Skill } from '../data/skills';
import { CATEGORY_COLORS, getNodeSize } from '../data/skills';

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
  
  const color = CATEGORY_COLORS[skill.category] || '#888888';
  const size = getNodeSize(skill.estimatedTokens);
  const scale = isHovered || isSelected ? 1.5 : localHover ? 1.2 : 1;

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      
      // Pulse when hovered
      if (isHovered || localHover) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        meshRef.current.scale.setScalar(size * scale * pulse);
      }
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size * scale, 32, 32]}
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
          emissiveIntensity={isHovered || isSelected ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>

      {/* Label on hover */}
      {(localHover || isHovered || isSelected) && (
        <Html
          position={[0, size * scale + 0.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'system-ui, sans-serif',
              border: `2px solid ${color}`,
              boxShadow: `0 0 20px ${color}40`,
            }}
          >
            <strong>{skill.name}</strong>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
              {skill.category} • ~{skill.estimatedTokens} tokens
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
