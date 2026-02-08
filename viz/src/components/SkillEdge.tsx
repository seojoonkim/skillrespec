import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface SkillEdgeProps {
  start: [number, number, number];
  end: [number, number, number];
  strength: number; // 0-1
  highlighted: boolean;
}

export function SkillEdge({ start, end, strength, highlighted }: SkillEdgeProps) {
  const color = highlighted ? '#ffffff' : `rgba(255, 255, 255, ${strength * 0.5})`;
  const lineWidth = highlighted ? 2 : 1;

  // Create a curved line between points
  const points = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 1, // Slight upward curve
      (start[2] + end[2]) / 2,
    ];

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );

    return curve.getPoints(20).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={highlighted ? 0.8 : strength * 0.3}
    />
  );
}
