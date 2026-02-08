import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  size?: number;
  color?: string;
  speed?: number;
  radius?: number;
}

export default function ParticleField({ 
  count = 500, 
  size = 0.015,
  color = '#00ffff',
  speed = 0.2,
  radius = 20,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Random position within sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = Math.pow(Math.random(), 0.5) * radius;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Random velocity
      velocities[i * 3] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }
    
    return { positions, velocities };
  }, [count, radius, speed]);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);
  
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      // Update position
      positions.setX(i, positions.getX(i) + velocities[i * 3] * delta);
      positions.setY(i, positions.getY(i) + velocities[i * 3 + 1] * delta);
      positions.setZ(i, positions.getZ(i) + velocities[i * 3 + 2] * delta);
      
      // Wrap around sphere
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + y * y + z * z);
      
      if (dist > radius) {
        const scale = -radius / dist * 0.9;
        positions.setX(i, x * scale);
        positions.setY(i, y * scale);
        positions.setZ(i, z * scale);
      }
    }
    
    positions.needsUpdate = true;
    
    // Rotate entire field slowly
    pointsRef.current.rotation.y += delta * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
