import type { Skill } from '../data/skills';
import { CATEGORY_COLORS, SOURCE_COLORS } from '../data/skills';

interface SkillPanelProps {
  skill: Skill | null;
  onClose: () => void;
}

export function SkillPanel({ skill, onClose }: SkillPanelProps) {
  if (!skill) return null;

  const categoryColor = CATEGORY_COLORS[skill.category] || '#888';
  const sourceColor = SOURCE_COLORS[skill.source] || '#888';

  const sourceEmoji = {
    openclaw: '🦞',
    local: '💻',
    github: '🐙',
  }[skill.source];

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: '340px',
        background: 'rgba(10, 10, 30, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        border: `2px solid ${categoryColor}40`,
        boxShadow: `0 0 40px ${categoryColor}20`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          color: '#666',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        ✕
      </button>

      {/* Header */}
      <h2
        style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          color: categoryColor,
          textShadow: `0 0 20px ${categoryColor}40`,
        }}
      >
        {skill.name}
      </h2>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: categoryColor + '30',
            color: categoryColor,
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {skill.category}
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: sourceColor + '30',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {sourceEmoji} {skill.source}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          margin: '0 0 16px 0',
          color: '#aaa',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {skill.description || 'No description available'}
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            Token Cost
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            ~{skill.estimatedTokens.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            Dependencies
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            {skill.dependencies.length || 0}
          </div>
        </div>
      </div>

      {/* Dependencies list */}
      {skill.dependencies.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Dependencies:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skill.dependencies.map((dep) => (
              <span
                key={dep}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {skill.conflicts.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: '#f44', marginBottom: '8px' }}>
            ⚠️ Conflicts with:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skill.conflicts.map((conflict) => (
              <span
                key={conflict}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 68, 68, 0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#f88',
                }}
              >
                {conflict}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
