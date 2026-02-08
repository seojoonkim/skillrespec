import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SkillNode, HealthStatus, VulnerabilityLevel } from '../types';

interface SkillNodesProps {
  nodes: SkillNode[];
  selectedNode: SkillNode | null;
  hoveredNode: SkillNode | null;
  onSelect: (node: SkillNode | null) => void;
  onHover: (node: SkillNode | null) => void;
}

// Health-based visual properties
const HEALTH_CONFIG: Record<HealthStatus, {
  emissiveColor: string;
  baseIntensity: number;
  pulseSpeed: number;
  pulseAmount: number;
  glowOpacity: number;
  opacity: number;
}> = {
  shouldRemove: {
    emissiveColor: '#ff3333',
    baseIntensity: 0.6,
    pulseSpeed: 4,
    pulseAmount: 0.3,
    glowOpacity: 0.5,
    opacity: 1,
  },
  needsUpdate: {
    emissiveColor: '#ffa500',
    baseIntensity: 0.4,
    pulseSpeed: 2,
    pulseAmount: 0.15,
    glowOpacity: 0.35,
    opacity: 1,
  },
  unused: {
    emissiveColor: '#666666',
    baseIntensity: 0.1,
    pulseSpeed: 0,
    pulseAmount: 0,
    glowOpacity: 0.1,
    opacity: 0.4,
  },
  healthy: {
    emissiveColor: '', // Use node.color
    baseIntensity: 0.2,
    pulseSpeed: 0,
    pulseAmount: 0,
    glowOpacity: 0.15,
    opacity: 1,
  },
};

// Vulnerability-based visual properties
const VULNERABILITY_CONFIG: Record<VulnerabilityLevel, {
  ringColor: string;
  ringOpacity: number;
  pulseSpeed: number;
  showWarning: boolean;
  icon: string;
}> = {
  low: {
    ringColor: '#22c55e',  // Green
    ringOpacity: 0,
    pulseSpeed: 0,
    showWarning: false,
    icon: '🟢',
  },
  medium: {
    ringColor: '#eab308',  // Yellow
    ringOpacity: 0.25,
    pulseSpeed: 1,
    showWarning: false,
    icon: '🟡',
  },
  high: {
    ringColor: '#f97316',  // Orange
    ringOpacity: 0.4,
    pulseSpeed: 2,
    showWarning: true,
    icon: '🟠',
  },
  critical: {
    ringColor: '#ef4444',  // Red
    ringOpacity: 0.5,
    pulseSpeed: 3,
    showWarning: true,
    icon: '🔴',
  },
};

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
  const vulnRingRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const baseSize = node.size * 0.4;
  const scale = isSelected ? 1.8 : isHovered ? 1.4 : isConnected ? 1.2 : 1;
  
  // Get health-based config (fallback to healthy if undefined)
  const healthConfig = HEALTH_CONFIG[node.health || 'healthy'] || HEALTH_CONFIG.healthy;
  const emissiveColor = healthConfig.emissiveColor || node.color;
  
  // Get vulnerability config
  const vulnLevel = node.vulnerability?.level || 'low';
  const vulnConfig = VULNERABILITY_CONFIG[vulnLevel];
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Floating animation
    meshRef.current.position.y = node.y + Math.sin(time * 0.5 + node.x) * 0.1;
    
    // Health-based pulse animation
    const healthPulse = healthConfig.pulseSpeed > 0 
      ? 1 + Math.sin(time * healthConfig.pulseSpeed) * healthConfig.pulseAmount
      : 1;
    
    // Pulse when active or health issue
    if (isSelected || isHovered) {
      const activePulse = 1 + Math.sin(time * 4) * 0.08;
      meshRef.current.scale.setScalar(baseSize * scale * activePulse * healthPulse);
    } else {
      meshRef.current.scale.setScalar(baseSize * scale * healthPulse);
    }
    
    // Update emissive intensity based on health pulse
    if (materialRef.current) {
      const baseEmissive = isSelected ? 0.8 : isHovered ? 0.5 : isConnected ? 0.4 : healthConfig.baseIntensity;
      const pulseIntensity = healthConfig.pulseSpeed > 0 
        ? baseEmissive * (0.7 + Math.sin(time * healthConfig.pulseSpeed) * 0.3)
        : baseEmissive;
      materialRef.current.emissiveIntensity = pulseIntensity;
    }
    
    // Glow pulse with health awareness
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(time * 2) * 0.2;
      glowRef.current.scale.setScalar(baseSize * scale * 2 * glowPulse * healthPulse);
      const baseGlowOpacity = isSelected ? 0.4 : isHovered ? 0.3 : healthConfig.glowOpacity;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 
        baseGlowOpacity * (0.8 + Math.sin(time * 3) * 0.2);
    }
    
    // Ring rotation
    if (ringRef.current && (isSelected || isHovered)) {
      ringRef.current.rotation.z = time * 2;
      ringRef.current.rotation.x = Math.sin(time) * 0.3;
    }
    
    // Vulnerability ring animation
    if (vulnRingRef.current && vulnConfig.pulseSpeed > 0) {
      const vulnPulse = 0.5 + Math.sin(time * vulnConfig.pulseSpeed) * 0.5;
      (vulnRingRef.current.material as THREE.MeshBasicMaterial).opacity = vulnConfig.ringOpacity * vulnPulse;
      vulnRingRef.current.rotation.z = time * 0.5;
    }
  });

  // Health indicator colors for glow
  const glowColor = node.health === 'shouldRemove' ? '#ff3333' 
    : node.health === 'needsUpdate' ? '#ffa500' 
    : node.color;
  
  // Ring color matches health status
  const ringColor = node.health === 'shouldRemove' ? '#ff5555'
    : node.health === 'needsUpdate' ? '#ffbb33'
    : node.color;
  
  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer glow sphere - health-aware */}
      <Sphere ref={glowRef} args={[1, 16, 16]}>
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={healthConfig.glowOpacity}
          depthWrite={false}
        />
      </Sphere>
      
      {/* Health warning ring for problem nodes */}
      {(node.health === 'shouldRemove' || node.health === 'needsUpdate') && !isSelected && !isHovered && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.3, baseSize * 1.5, 32]} />
          <meshBasicMaterial 
            color={glowColor} 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Vulnerability warning ring (outer) */}
      {vulnConfig.ringOpacity > 0 && !isSelected && !isHovered && (
        <mesh ref={vulnRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.6, baseSize * 1.8, 6]} />
          <meshBasicMaterial 
            color={vulnConfig.ringColor} 
            transparent 
            opacity={vulnConfig.ringOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Selection ring */}
      {(isSelected || isHovered) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[baseSize * scale * 1.5, 0.02, 16, 32]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.8} />
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
          ref={materialRef}
          color={node.health === 'unused' ? '#444444' : node.color}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : isConnected ? 0.4 : healthConfig.baseIntensity}
          roughness={0.2}
          metalness={0.8}
          envMapIntensity={1}
          transparent={healthConfig.opacity < 1}
          opacity={healthConfig.opacity}
        />
      </Sphere>
      
      {/* Inner core glow - dimmer for unhealthy nodes */}
      <Sphere args={[baseSize * 0.3, 16, 16]}>
        <meshBasicMaterial 
          color={node.health === 'shouldRemove' ? '#ff6666' : '#ffffff'} 
          transparent 
          opacity={node.health === 'unused' ? 0.2 : 0.6} 
        />
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
            border: `2px solid ${ringColor}`,
            boxShadow: `0 0 30px ${ringColor}60, inset 0 0 20px ${ringColor}20`,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff',
              textShadow: `0 0 10px ${node.color}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              {node.health === 'shouldRemove' && <span style={{ color: '#ff5555' }}>⚠️</span>}
              {node.health === 'needsUpdate' && <span style={{ color: '#ffa500' }}>🔄</span>}
              {vulnConfig.showWarning && <span>🔓</span>}
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
              {node.connectionCount > 0 && (
                <>
                  <span>•</span>
                  <span>{node.connectionCount} connections</span>
                </>
              )}
            </div>
            {node.health === 'shouldRemove' && (
              <div style={{ fontSize: 10, color: '#ff5555', marginTop: 4 }}>
                ⚠️ Remove recommended
              </div>
            )}
            {node.health === 'needsUpdate' && node.version && node.latestVersion && (
              <div style={{ fontSize: 10, color: '#ffa500', marginTop: 4 }}>
                🔄 Update: {node.version} → {node.latestVersion}
              </div>
            )}
            {node.vulnerability && node.vulnerability.level !== 'low' && (
              <div style={{ 
                fontSize: 10, 
                color: vulnConfig.ringColor, 
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {vulnConfig.icon} Risk: {node.vulnerability.level.toUpperCase()} ({node.vulnerability.score}/100)
                {node.vulnerability.permissions.length > 0 && (
                  <span style={{ opacity: 0.8 }}>
                    • {node.vulnerability.permissions.join(', ')}
                  </span>
                )}
              </div>
            )}
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
