import { useState } from 'react';
import type { SkillCluster } from '../types';

interface CategoryLegendProps {
  clusters: SkillCluster[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  compact?: boolean;
  mobile?: boolean;
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
  finance: '💰',
};

export default function CategoryLegend({ 
  clusters, 
  selectedCategory, 
  onSelect,
  compact = false,
  mobile = false,
}: CategoryLegendProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  
  const totalSkills = clusters.reduce((sum, c) => sum + c.skills.length, 0);
  const sortedClusters = [...clusters].sort((a, b) => b.skills.length - a.skills.length);

  // Mobile: Horizontal scroll list
  if (mobile) {
    return (
      <div style={{ padding: '0 12px 12px' }}>
        {/* Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '20px' }}>🏷️</span>
          <div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              Categories
            </h2>
            <p style={{
              fontSize: '11px',
              color: '#666',
              margin: 0,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {totalSkills} skills total
            </p>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* All Categories */}
          <button
            onClick={() => onSelect(null)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: selectedCategory === null 
                ? 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: selectedCategory === null 
                ? '1px solid rgba(0,255,255,0.4)' 
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}>
              ✨
            </span>
            <span style={{ 
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              All
            </span>
            <span style={{ 
              fontSize: '12px',
              color: '#888',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {totalSkills}
            </span>
          </button>

          {/* Category buttons */}
          {sortedClusters.map(cluster => {
            const isSelected = selectedCategory === cluster.category;
            
            return (
              <button
                key={cluster.id}
                onClick={() => onSelect(isSelected ? null : cluster.category)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: isSelected 
                    ? `${cluster.color}25`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected 
                    ? `1px solid ${cluster.color}60` 
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  background: `${cluster.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  {CATEGORY_ICONS[cluster.category] || '📦'}
                </span>
                <span style={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}>
                  {cluster.name}
                </span>
                <span style={{ 
                  fontSize: '12px',
                  color: cluster.color,
                  fontWeight: 600,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {cluster.skills.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact mode (tablet)
  const panelWidth = compact ? 180 : 200;
  const fontSize = compact ? 12 : 13;
  const padding = compact ? '8px 10px' : '10px 12px';

  return (
    <div style={{
      position: 'absolute',
      bottom: compact ? 100 : 80,
      left: 20,
      width: panelWidth,
      background: 'linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: compact ? 12 : 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      maxHeight: compact ? 'calc(100vh - 280px)' : 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: compact ? '10px 12px' : '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: compact ? 14 : 16 }}>🏷️</span>
        <span style={{ 
          fontSize: compact ? 11 : 12, 
          color: '#888', 
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          Categories
        </span>
        <span style={{ 
          marginLeft: 'auto',
          fontSize: compact ? 10 : 11,
          color: '#555',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {totalSkills} skills
        </span>
      </div>

      <div style={{ 
        padding: compact ? '6px 6px' : '8px 8px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          onMouseEnter={() => setIsHovered('all')}
          onMouseLeave={() => setIsHovered(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 8 : 10,
            width: '100%',
            padding,
            background: selectedCategory === null 
              ? 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(255,0,255,0.15) 100%)'
              : isHovered === 'all' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'transparent',
            border: selectedCategory === null 
              ? '1px solid rgba(0,255,255,0.3)' 
              : '1px solid transparent',
            borderRadius: compact ? 8 : 10,
            cursor: 'pointer',
            color: '#fff',
            fontSize,
            textAlign: 'left',
            marginBottom: 4,
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            width: compact ? 20 : 24,
            height: compact ? 20 : 24,
            borderRadius: compact ? 6 : 8,
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: compact ? 10 : 12,
            boxShadow: selectedCategory === null ? '0 0 15px rgba(0,255,255,0.5)' : 'none',
          }}>
            ✨
          </span>
          <span style={{ fontWeight: 500 }}>All Categories</span>
          <span style={{ 
            marginLeft: 'auto', 
            color: '#666',
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", monospace',
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
                gap: compact ? 8 : 10,
                width: '100%',
                padding,
                background: isSelected 
                  ? `linear-gradient(135deg, ${cluster.color}20 0%, transparent 100%)`
                  : isHovered === cluster.id 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'transparent',
                border: isSelected 
                  ? `1px solid ${cluster.color}40` 
                  : '1px solid transparent',
                borderRadius: compact ? 8 : 10,
                cursor: 'pointer',
                color: '#fff',
                fontSize,
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
                width: compact ? 20 : 24,
                height: compact ? 20 : 24,
                borderRadius: compact ? 6 : 8,
                background: `${cluster.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? 10 : 12,
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
                minWidth: 0,
              }}>
                <span style={{ 
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
                flexShrink: 0,
              }}>
                <span style={{ 
                  color: cluster.color,
                  fontSize: compact ? 12 : 14,
                  fontWeight: 700,
                  textShadow: `0 0 10px ${cluster.color}50`,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {cluster.skills.length}
                </span>
                <span style={{ 
                  fontSize: compact ? 9 : 10, 
                  color: '#555',
                  fontFamily: '"JetBrains Mono", monospace',
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
