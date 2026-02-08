// ═══════════════════════════════════════════════════════════
// Tool Nodes - 3D visualization of tool dependencies
// ═══════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { ToolNode } from '../lib/toolDependencies';
import { getToolColor } from '../lib/toolDependencies';

interface ToolNodesProps {
  tools: ToolNode[];
  showLabels?: boolean;
  opacity?: number;
}

// Individual tool node (smaller diamond shape)
function ToolNodeMesh({ 
  tool, 
  showLabels,
  opacity = 0.8 
}: { 
  tool: ToolNode; 
  showLabels?: boolean;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = getToolColor(tool.category);
  
  // Subtle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  // Size based on usage count (more skills use this tool = bigger)
  const size = 0.15 + (tool.usageCount * 0.03);

  return (
    <group position={[tool.x, tool.y, tool.z]}>
      {/* Diamond shape (rotated octahedron) */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Label */}
      {showLabels && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, size + 0.3, 0]}
            fontSize={0.2}
            color={color}
            anchorX="center"
            anchorY="bottom"
            fontWeight={500}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {tool.name}
          </Text>
          <Text
            position={[0, size + 0.1, 0]}
            fontSize={0.12}
            color="#888888"
            anchorX="center"
            anchorY="bottom"
          >
            {tool.usageCount} skill{tool.usageCount !== 1 ? 's' : ''}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export default function ToolNodes({ tools, showLabels = true, opacity = 0.8 }: ToolNodesProps) {
  return (
    <group>
      {tools.map((tool) => (
        <ToolNodeMesh 
          key={tool.id} 
          tool={tool} 
          showLabels={showLabels}
          opacity={opacity}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// Tool Connection Lines - Lines from skills to tools
// ═══════════════════════════════════════════════════════════

interface ToolConnectionLinesProps {
  edges: Array<{ source: string; target: string; weight: number }>;
  skillNodes: Array<{ id: string; x: number; y: number; z: number }>;
  toolNodes: ToolNode[];
  opacity?: number;
}

export function ToolConnectionLines({ 
  edges, 
  skillNodes, 
  toolNodes,
  opacity = 0.3 
}: ToolConnectionLinesProps) {
  const skillMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>();
    for (const node of skillNodes) {
      map.set(node.id, { x: node.x, y: node.y, z: node.z });
    }
    return map;
  }, [skillNodes]);

  const toolMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>();
    for (const tool of toolNodes) {
      map.set(tool.id, { x: tool.x, y: tool.y, z: tool.z });
    }
    return map;
  }, [toolNodes]);

  const lines = useMemo(() => {
    const lineData: Array<{
      points: THREE.Vector3[];
      color: string;
    }> = [];

    for (const edge of edges) {
      const skill = skillMap.get(edge.source);
      const tool = toolMap.get(edge.target);

      if (skill && tool) {
        const toolId = edge.target.replace('tool:', '');
        const color = getToolColor(
          toolNodes.find(t => t.id === edge.target)?.category || 'other'
        );

        lineData.push({
          points: [
            new THREE.Vector3(skill.x, skill.y, skill.z),
            new THREE.Vector3(tool.x, tool.y, tool.z),
          ],
          color,
        });
      }
    }

    return lineData;
  }, [edges, skillMap, toolMap, toolNodes]);

  return (
    <group>
      {lines.map((line, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                line.points[0].x, line.points[0].y, line.points[0].z,
                line.points[1].x, line.points[1].y, line.points[1].z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={line.color} 
            transparent 
            opacity={opacity}
            linewidth={1}
          />
        </line>
      ))}
    </group>
  );
}
