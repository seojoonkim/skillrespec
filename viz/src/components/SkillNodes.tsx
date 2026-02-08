import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SkillNode } from '../types';

interface SkillNodesProps {
  nodes: SkillNode[];
  selectedNode: SkillNode | null;
  hoveredNode: SkillNode | null;
  onSelect: (node: SkillNode | null) => void;
  onHover: (node: SkillNode | null) => void;
}

function SkillNodeMesh({ 
  node, 
  isSelected, 
  isHovered,
  isConnected,
  onSelect,
  onHover,
}: { 
  node: SkillNode;
  isSelected: boolean;
  isHovered: boolean;
  isConnected: boolean;
  onSelect: (node: SkillNode) => void;
  onHover: (node: SkillNode | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  const baseSize = node.size * 0.4;
  const scale = isSelected ? 1.8 : isHovered ? 1.4 : isConnected ? 1.2 : 1;
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Floating animation
    meshRef.current.position.y = node.y + Math.sin(time * 0.5 + node.x) * 0.1;
    
    // Pulse when active
    if (isSelected || isHovered) {
      const pulse = 1 + Math.sin(time * 4) * 0.08;
      meshRef.current.scale.setScalar(baseSize * scale * pulse);
    } else {
      meshRef.current.scale.setScalar(baseSize * scale);
    }
    
    // Glow pulse
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(time * 2) * 0.2;
      glowRef.current.scale.setScalar(baseSize * scale * 2 * glowPulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 
        (isSelected ? 0.4 : isHovered ? 0.3 : 0.15) * (0.8 + Math.sin(time * 3) * 0.2);
    }
    
    // Ring rotation
    if (ringRef.current && (isSelected || isHovered)) {
      ringRef.current.rotation.z = time * 2;
      ringRef.current.rotation.x = Math.sin(time) * 0.3;
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer glow sphere */}
      <Sphere ref={glowRef} args={[1, 16, 16]}>
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </Sphere>
      
      {/* Selection ring */}
      {(isSelected || isHovered) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[baseSize * scale * 1.5, 0.02, 16, 32]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Main sphere */}
      <Sphere
        ref={meshRef}
        args={[1, 32, 32]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : isConnected ? 0.4 : 0.2}
          roughness={0.2}
          metalness={0.8}
          envMapIntensity={1}
        />
      </Sphere>
      
      {/* Inner core glow */}
      <Sphere args={[baseSize * 0.3, 16, 16]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </Sphere>

      {/* Label on hover/select */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, baseSize * scale + 0.6, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '8px 14px',
            borderRadius: 8,
            border: `2px solid ${node.color}`,
            boxShadow: `0 0 30px ${node.color}60, inset 0 0 20px ${node.color}20`,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff',
              textShadow: `0 0 10px ${node.color}`,
            }}>
              {node.name}
            </div>
            <div style={{ 
              fontSize: 11, 
              color: node.color,
              marginTop: 2,
              display: 'flex',
              gap: 8,
            }}>
              <span>{node.category}</span>
              <span>•</span>
              <span>~{node.tokens.toLocaleString()} tokens</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function SkillNodes({ nodes, selectedNode, hoveredNode, onSelect, onHover }: SkillNodesProps) {
  const connectedIds = useMemo(() => {
    const active = selectedNode || hoveredNode;
    if (!active) return new Set<string>();
    return new Set(active.connections);
  }, [selectedNode, hoveredNode]);

  return (
    <group>
      {nodes.map((node) => (
        <SkillNodeMesh
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          isHovered={hoveredNode?.id === node.id}
          isConnected={connectedIds.has(node.id)}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
