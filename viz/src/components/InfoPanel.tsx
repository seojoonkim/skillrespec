// ═══════════════════════════════════════════════════════════
// Info Panel - Skill details with glass morphism
// ═══════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { theme, glass } from '../styles/theme';
import ReviewsSection from './ReviewsSection';
import type { SkillNode, SkillEdge, VizMetrics } from '../types';

interface InfoPanelProps {
  node: SkillNode | null;
  allNodes: SkillNode[];
  edges: SkillEdge[];
  metrics?: VizMetrics;
  onClose: () => void;
  mobile?: boolean;
}

function StatItem({ label, value, color, subtext }: { 
  label: string; 
  value: string; 
  color?: string;
  subtext?: string;
}) {
  return (
    <div className="text-center">
      <div 
        className="text-xl font-bold font-mono tracking-tight"
        style={{ color: color || theme.colors.textPrimary }}
      >
        {value}
      </div>
      <div 
        className="text-2xs uppercase tracking-widest mt-1 font-medium"
        style={{ color: theme.colors.textMuted }}
      >
        {label}
      </div>
      {subtext && (
        <div 
          className="text-2xs mt-0.5"
          style={{ color: theme.colors.textSubtle }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

function SimilarSkillChip({ name, similarity, color }: { 
  name: string; 
  similarity: number; 
  color: string;
}) {
  const isHigh = similarity > 70;
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-100"
      style={{
        background: theme.colors.bgTertiary,
        border: `1px solid ${isHigh ? theme.colors.warningMuted : theme.colors.border}`,
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span 
        className="max-w-28 truncate"
        style={{ color: theme.colors.textSecondary }}
      >
        {name}
      </span>
      <span 
        className="font-semibold font-mono"
        style={{ color: isHigh ? theme.colors.warning : theme.colors.textMuted }}
      >
        {similarity}%
      </span>
    </div>
  );
}

export default function InfoPanel({ node, allNodes, edges, onClose, mobile = false }: InfoPanelProps) {
  const [showReviews, setShowReviews] = useState(false);
  
  const { connectedNodes, overlapScore } = useMemo(() => {
    if (!node) return { connectedNodes: [], overlapScore: 0 };
    
    const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    
    const connected = connectedEdges.map(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      return {
        node: allNodes.find(n => n.id === otherId)!,
        weight: e.weight,
      };
    }).filter(c => c.node).sort((a, b) => b.weight - a.weight);
    
    const avgWeight = connected.length > 0
      ? connected.reduce((sum, c) => sum + c.weight, 0) / connected.length
      : 0;
    
    return {
      connectedNodes: connected,
      overlapScore: Math.round(avgWeight * 100),
    };
  }, [node, allNodes, edges]);

  // Empty state
  if (!node) {
    return (
      <div 
        className="flex items-center justify-center gap-3"
        style={{
          height: mobile ? '100px' : '120px',
          ...glass,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.sans,
        }}
      >
        <span className="text-xl opacity-50">◎</span>
        <span className="text-sm opacity-60">Click a skill node to view details</span>
      </div>
    );
  }

  const nodeColor = node.color || theme.categoryColors[node.category] || theme.colors.accent;

  return (
    <div 
      className="relative flex animate-fade-in"
      style={{
        minHeight: mobile ? '100px' : '120px',
        ...glass,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        fontFamily: theme.fonts.sans,
        padding: '8px 0',
      }}
    >
      {/* Accent glow at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${nodeColor}80, transparent 90%)`,
        }}
      />

      {/* Left: Skill Name & Category */}
      <div 
        className="flex flex-col justify-center shrink-0"
        style={{
          width: mobile ? '140px' : '220px',
          padding: mobile ? '16px 20px' : '20px 24px',
          borderRight: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{
              background: nodeColor,
              boxShadow: `0 0 12px ${nodeColor}`,
            }}
          />
          <h2 
            className="text-base font-semibold tracking-tight leading-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            {node.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span 
            className="text-2xs uppercase tracking-wider font-medium"
            style={{ color: theme.colors.textMuted }}
          >
            {node.category}
          </span>
        </div>
      </div>

      {/* Center: Stats */}
      <div 
        className="flex-1 flex items-center justify-center p-5"
        style={{ gap: mobile ? '32px' : '56px' }}
      >
        <StatItem 
          label="Tokens" 
          value={`~${node.tokens.toLocaleString()}`} 
          color={theme.colors.accent} 
        />
        <StatItem 
          label="Overlap" 
          value={`${overlapScore}%`} 
          color={overlapScore > 50 ? theme.colors.warning : theme.colors.textPrimary}
          subtext={overlapScore > 70 ? 'High redundancy' : overlapScore > 40 ? 'Moderate' : 'Unique'}
        />
        <StatItem 
          label="Links" 
          value={String(connectedNodes.length)} 
          subtext={connectedNodes.length === 0 ? 'Isolated' : connectedNodes.length > 5 ? 'Hub skill' : 'Connected'}
        />
      </div>

      {/* Right: Similar Skills */}
      {!mobile && connectedNodes.length > 0 && (
        <div 
          className="flex flex-col justify-center"
          style={{
            minWidth: '280px',
            maxWidth: '400px',
            padding: '12px 20px',
            borderLeft: `1px solid ${theme.colors.border}`,
          }}
        >
          <div 
            className="text-2xs uppercase tracking-widest mb-3 font-semibold"
            style={{ color: theme.colors.textMuted }}
          >
            Similar Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {connectedNodes.slice(0, 3).map(({ node: n, weight }) => (
              <SimilarSkillChip
                key={n.id}
                name={n.name}
                similarity={Math.round(weight * 100)}
                color={theme.categoryColors[n.category] || theme.colors.textMuted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top buttons */}
      <div className="absolute top-3 right-4 flex gap-2">
        {/* Reviews toggle */}
        {!mobile && (
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all duration-100"
            style={{
              background: showReviews ? theme.colors.bgSurface : theme.colors.bgTertiary,
              border: `1px solid ${showReviews ? theme.colors.borderHover : theme.colors.border}`,
              color: showReviews ? theme.colors.textPrimary : theme.colors.textMuted,
              fontFamily: theme.fonts.sans,
            }}
          >
            <span>⭐</span>
            Reviews
          </button>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-100 hover:border-dark-600 hover:text-white"
          style={{
            background: theme.colors.bgTertiary,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textMuted,
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Reviews Section - Expandable */}
      {showReviews && !mobile && (
        <div 
          className="absolute bottom-full left-0 right-0 max-h-72 overflow-auto rounded-t-xl animate-slide-down"
          style={{
            ...glass,
            borderBottom: 'none',
            borderRadius: `${theme.radius.xl} ${theme.radius.xl} 0 0`,
            padding: '16px',
          }}
        >
          <ReviewsSection
            skillId={node.id}
            skillName={node.name}
            compact
          />
        </div>
      )}
    </div>
  );
}
