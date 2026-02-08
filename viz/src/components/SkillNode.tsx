import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
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
  
  // Use category colors from theme
  const color = theme.categoryColors[skill.category] || '#666666';
  const size = getNodeSize(skill.estimatedTokens);
  const scale = isHovered || isSelected ? 1.3 : localHover ? 1.15 : 1;
  const emissiveIntensity = isHovered || isSelected ? 0.5 : localHover ? 0.3 : 0.15;

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
      
      // Gentle pulse when selected
      if (isSelected) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
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
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.2}
        />
      </Sphere>
      
      {/* Glow ring for selected/hovered nodes */}
      {(isSelected || isHovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * scale * 1.2, size * scale * 1.4, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
