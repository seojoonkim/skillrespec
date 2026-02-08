import { useState } from 'react';
import type { SkillCluster } from '../types';

interface CategoryLegendProps {
  clusters: SkillCluster[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  productivity: '⚡',
  development: '💻',
  media: '🎬',
  communication: '💬',
  design: '🎨',
  marketing: '📢',
  security: '🔒',
  utility: '🔧',
};

export default function CategoryLegend({ clusters, selectedCategory, onSelect }: CategoryLegendProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  
  const totalSkills = clusters.reduce((sum, c) => sum + c.skills.length, 0);
  const sortedClusters = [...clusters].sort((a, b) => b.skills.length - a.skills.length);

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 20,
      background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>🏷️</span>
        <span style={{ 
          fontSize: 12, 
          color: '#888', 
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 600,
        }}>
          Categories
        </span>
        <span style={{ 
          marginLeft: 'auto',
          fontSize: 11,
          color: '#555',
        }}>
          {totalSkills} skills
        </span>
      </div>

      <div style={{ padding: '8px 8px' }}>
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          onMouseEnter={() => setIsHovered('all')}
          onMouseLeave={() => setIsHovered(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 12px',
            background: selectedCategory === null 
              ? 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)'
              : isHovered === 'all' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'transparent',
            border: selectedCategory === null 
              ? '1px solid rgba(0,255,255,0.3)' 
              : '1px solid transparent',
            borderRadius: 10,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 13,
            textAlign: 'left',
            marginBottom: 4,
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            boxShadow: selectedCategory === null ? '0 0 15px rgba(0,255,255,0.5)' : 'none',
          }}>
            ✨
          </span>
          <span style={{ fontWeight: 500 }}>All Categories</span>
          <span style={{ 
            marginLeft: 'auto', 
            color: '#666',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {totalSkills}
          </span>
        </button>

        {/* Category buttons */}
        {sortedClusters.map(cluster => {
          const isSelected = selectedCategory === cluster.category;
          const percentage = Math.round((cluster.skills.length / totalSkills) * 100);
          
          return (
            <button
              key={cluster.id}
              onClick={() => onSelect(isSelected ? null : cluster.category)}
              onMouseEnter={() => setIsHovered(cluster.id)}
              onMouseLeave={() => setIsHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                background: isSelected 
                  ? `linear-gradient(135deg, ${cluster.color}20 0%, transparent 100%)`
                  : isHovered === cluster.id 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'transparent',
                border: isSelected 
                  ? `1px solid ${cluster.color}40` 
                  : '1px solid transparent',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#fff',
                fontSize: 13,
                textAlign: 'left',
                marginBottom: 2,
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Progress bar background */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${percentage}%`,
                background: `${cluster.color}10`,
                transition: 'width 0.3s',
              }} />
              
              <span style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: `${cluster.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                position: 'relative',
                boxShadow: isSelected ? `0 0 15px ${cluster.color}60` : 'none',
              }}>
                {CATEGORY_ICONS[cluster.category] || '📦'}
              </span>
              
              <div style={{ 
                flex: 1, 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
              }}>
                <span style={{ 
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}>
                  {cluster.name}
                </span>
                <div style={{
                  height: 2,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: cluster.color,
                    borderRadius: 1,
                    boxShadow: `0 0 8px ${cluster.color}`,
                  }} />
                </div>
              </div>
              
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                position: 'relative',
              }}>
                <span style={{ 
                  color: cluster.color,
                  fontSize: 14,
                  fontWeight: 700,
                  textShadow: `0 0 10px ${cluster.color}50`,
                }}>
                  {cluster.skills.length}
                </span>
                <span style={{ 
                  fontSize: 10, 
                  color: '#555',
                }}>
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
