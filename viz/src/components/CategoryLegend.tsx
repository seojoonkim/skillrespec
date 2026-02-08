import { theme } from '../styles/theme';
import type { SkillCluster } from '../types';

interface CategoryLegendProps {
  clusters: SkillCluster[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  compact?: boolean;
  mobile?: boolean;
  embedded?: boolean;
}

export default function CategoryLegend({ 
  clusters, 
  selectedCategory, 
  onSelect,
  compact = false,
  mobile = false,
  embedded = false,
}: CategoryLegendProps) {
  const totalSkills = clusters.reduce((sum, c) => sum + c.skills.length, 0);
  const sortedClusters = [...clusters].sort((a, b) => b.skills.length - a.skills.length);

  // Mobile layout
  if (mobile) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            Categories
          </h2>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.mono,
          }}>
            {totalSkills} total
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {/* All */}
          <button
            onClick={() => onSelect(null)}
            style={{
              padding: '8px 12px',
              background: selectedCategory === null ? theme.colors.bgTertiary : 'transparent',
              border: `1px solid ${selectedCategory === null ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            All ({totalSkills})
          </button>

          {sortedClusters.map(cluster => {
            const isSelected = selectedCategory === cluster.category;
            const color = theme.categoryColors[cluster.category] || theme.colors.textMuted;
            
            return (
              <button
                key={cluster.id}
                onClick={() => onSelect(isSelected ? null : cluster.category)}
                style={{
                  padding: '8px 12px',
                  background: isSelected ? theme.colors.bgTertiary : 'transparent',
                  border: `1px solid ${isSelected ? color : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  color: isSelected ? color : theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: color,
                }} />
                {cluster.name}
                <span style={{ color: theme.colors.textMuted }}>
                  {cluster.skills.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop/Tablet
  const panelWidth = compact ? 180 : 200;

  // Embedded mode: fill parent container
  const containerStyle: React.CSSProperties = embedded
    ? {
        width: '100%',
        height: '100%',
        minWidth: '160px',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        position: 'absolute',
        top: '80px',
        left: '20px',
        width: panelWidth,
        minWidth: '160px',
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ 
          fontSize: theme.fontSize.sm, 
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
        }}>
          Categories
        </span>
        <span style={{ 
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.mono,
        }}>
          {totalSkills}
        </span>
      </div>

      <div style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
        {/* All filter */}
        <button
          onClick={() => onSelect(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 12px',
            background: selectedCategory === null ? theme.colors.bgTertiary : 'transparent',
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            color: selectedCategory === null ? theme.colors.accent : theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            textAlign: 'left',
            marginBottom: '4px',
            transition: 'background 0.15s ease',
          }}
        >
          <span>All</span>
          <span style={{ 
            fontFamily: theme.fonts.mono,
            fontSize: theme.fontSize.xs,
          }}>
            {totalSkills}
          </span>
        </button>

        {/* Category items */}
        {sortedClusters.map(cluster => {
          const isSelected = selectedCategory === cluster.category;
          const color = theme.categoryColors[cluster.category] || theme.colors.textMuted;
          const percentage = Math.round((cluster.skills.length / totalSkills) * 100);
          
          return (
            <button
              key={cluster.id}
              onClick={() => onSelect(isSelected ? null : cluster.category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: isSelected ? theme.colors.bgTertiary : 'transparent',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                textAlign: 'left',
                marginBottom: '2px',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Color dot */}
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }} />
              
              {/* Name */}
              <span style={{ 
                flex: 1,
                fontWeight: isSelected ? theme.fontWeight.medium : theme.fontWeight.normal,
                color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
                textTransform: 'capitalize',
                wordBreak: 'break-word',
                lineHeight: 1.3,
              }}>
                {cluster.name}
              </span>
              
              {/* Count & percentage */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.xs,
              }}>
                <span style={{ color: isSelected ? color : theme.colors.textMuted }}>
                  {cluster.skills.length}
                </span>
                <span style={{ color: theme.colors.textMuted }}>
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
