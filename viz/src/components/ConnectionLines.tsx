import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SkillNode, SkillEdge } from '../types';

interface ConnectionLinesProps {
  edges: SkillEdge[];
  nodes: SkillNode[];
  selectedNode: SkillNode | null;
  hoveredNode: SkillNode | null;
}

function AnimatedLine({ 
  start, 
  end, 
  color,
  weight,
  isHighlighted,
}: { 
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  weight: number;
  isHighlighted: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Create curved line points
  const { points, curve } = useMemo(() => {
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y += 0.5; // Slight arc
    
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(32);
    return { points, curve };
  }, [start, end]);
  
  // Particle positions along the curve
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(10 * 3);
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [curve]);
  
  useFrame((state) => {
    if (!particlesRef.current || !isHighlighted) return;
    
    const time = state.clock.elapsedTime;
    const positions = particlesRef.current.geometry.attributes.position;
    
    for (let i = 0; i < 10; i++) {
      const t = ((i / 10) + time * 0.3) % 1;
      const point = curve.getPoint(t);
      positions.setXYZ(i, point.x, point.y, point.z);
    }
    positions.needsUpdate = true;
  });
  
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <group>
      {/* Main line */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={isHighlighted ? color : '#ffffff'}
          transparent
          opacity={isHighlighted ? 0.8 : weight * 0.15}
          linewidth={isHighlighted ? 2 : 1}
        />
      </line>
      
      {/* Glow line */}
      {isHighlighted && (
        <line geometry={lineGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            linewidth={4}
          />
        </line>
      )}
      
      {/* Flowing particles */}
      {isHighlighted && (
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            color={color}
            size={0.08}
            transparent
            opacity={0.9}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

export default function ConnectionLines({ edges, nodes, selectedNode, hoveredNode }: ConnectionLinesProps) {
  const nodeMap = useMemo(() => {
    return new Map(nodes.map(n => [n.id, n]));
  }, [nodes]);
  
  const activeNode = selectedNode || hoveredNode;
  const activeConnections = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(
      edges
        .filter(e => e.source === activeNode.id || e.target === activeNode.id)
        .map(e => `${e.source}-${e.target}`)
    );
  }, [edges, activeNode]);

  // Only show edges connected to the active node
  const visibleEdges = useMemo(() => {
    if (!activeNode) return []; // No edges when nothing selected
    return edges.filter(e => e.source === activeNode.id || e.target === activeNode.id);
  }, [edges, activeNode]);

  return (
    <group>
      {visibleEdges.map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        
        const edgeKey = `${edge.source}-${edge.target}`;
        const color = activeNode?.id === edge.source ? source.color : target.color;
        
        return (
          <AnimatedLine
            key={edgeKey}
            start={new THREE.Vector3(source.x, source.y, source.z)}
            end={new THREE.Vector3(target.x, target.y, target.z)}
            color={color}
            weight={edge.weight}
            isHighlighted={true}
          />
        );
      })}
    </group>
  );
}
