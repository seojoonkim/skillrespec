// ═══════════════════════════════════════════════════════════
// AI Recommendations Component - Rule-based Skill Suggestions
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { theme } from '../styles/theme';
import {
  generateRecommendations,
  analyzeCategories,
  getRecommendationIcon,
  getPriorityColor,
  type SkillRecommendation,
  type CategoryAnalysis,
} from '../lib/recommendationEngine';
import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Toast Component
// ═══════════════════════════════════════════════════════════
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(20px)'}`,
      padding: '10px 20px',
      background: theme.colors.bgElevated,
      border: `1px solid ${theme.colors.accent}`,
      borderRadius: theme.radius.full,
      color: theme.colors.textPrimary,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.mono,
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'all 0.2s ease',
      pointerEvents: 'none',
      boxShadow: `0 4px 20px ${theme.colors.accentGlow}`,
    }}>
      ✓ {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Category Status Badge
// ═══════════════════════════════════════════════════════════
function CategoryBadge({ analysis }: { analysis: CategoryAnalysis }) {
  const statusColors = {
    strong: theme.colors.success,
    adequate: theme.colors.textSecondary,
    weak: theme.colors.warning,
    missing: theme.colors.error,
  };
  
  const color = statusColors[analysis.status];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.sm,
      marginBottom: '6px',
    }}>
      <span style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        textTransform: 'capitalize',
      }}>
        {analysis.category}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.mono,
        }}>
          {analysis.count}
        </span>
        <span style={{
          fontSize: '9px',
          padding: '2px 6px',
          background: color + '20',
          color: color,
          borderRadius: theme.radius.sm,
          textTransform: 'uppercase',
          fontWeight: theme.fontWeight.medium,
        }}>
          {analysis.status}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Recommendation Card
// ═══════════════════════════════════════════════════════════
interface RecommendationCardProps {
  recommendation: SkillRecommendation;
  onInstall: (id: string) => void;
}

function RecommendationCard({ recommendation, onInstall }: RecommendationCardProps) {
  const priorityColor = getPriorityColor(recommendation.priority);
  const icon = getRecommendationIcon(recommendation.type);
  
  return (
    <div style={{
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      padding: '14px',
      marginBottom: '10px',
      borderLeft: `3px solid ${priorityColor}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
            }}>
              {recommendation.name}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'capitalize',
            }}>
              {recommendation.category}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '9px',
            padding: '2px 6px',
            background: priorityColor + '20',
            color: priorityColor,
            borderRadius: theme.radius.sm,
            textTransform: 'uppercase',
            fontWeight: theme.fontWeight.medium,
          }}>
            {recommendation.priority}
          </span>
          <span style={{
            fontSize: '10px',
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.mono,
          }}>
            {recommendation.confidence}%
          </span>
        </div>
      </div>
      
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        lineHeight: 1.5,
        marginBottom: '10px',
      }}>
        {recommendation.reason}
      </div>
      
      <button
        onClick={() => onInstall(recommendation.id)}
        style={{
          width: '100%',
          padding: '8px',
          background: 'transparent',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.sm,
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.xs,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontFamily: theme.fonts.mono,
          transition: theme.transitions.fast,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.colors.accent;
          e.currentTarget.style.color = theme.colors.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.color = theme.colors.textSecondary;
        }}
      >
        ⬇️ clawhub install {recommendation.id}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main AI Recommendations Panel
// ═══════════════════════════════════════════════════════════
interface AIRecommendationsProps {
  nodes: SkillNode[];
  embedded?: boolean;
}

export default function AIRecommendations({ nodes, embedded = false }: AIRecommendationsProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  
  const recommendations = useMemo(() => generateRecommendations(nodes), [nodes]);
  const categoryAnalysis = useMemo(() => analyzeCategories(nodes), [nodes]);
  
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);
  
  const handleInstall = (skillId: string) => {
    navigator.clipboard.writeText(`clawhub install ${skillId}`);
    showToast(`Copied: clawhub install ${skillId}`);
  };
  
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const otherRecommendations = recommendations.filter(r => r.priority !== 'high');

  const containerStyle: React.CSSProperties = {
    background: embedded ? 'transparent' : theme.colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgTertiary,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🤖 AI Recommendations
          </h2>
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            background: theme.colors.bgSecondary,
            padding: '3px 8px',
            borderRadius: theme.radius.full,
          }}>
            {recommendations.length} suggestions
          </span>
        </div>
        <p style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          margin: '6px 0 0',
        }}>
          Based on your current skill profile
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Category Analysis Toggle */}
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          style={{
            width: '100%',
            padding: '12px',
            background: theme.colors.bgTertiary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            fontFamily: theme.fonts.sans,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> Category Analysis
          </span>
          <span style={{
            transform: showAnalysis ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: theme.transitions.fast,
          }}>
            ▼
          </span>
        </button>
        
        {showAnalysis && (
          <div style={{ marginBottom: '16px' }}>
            {categoryAnalysis.map(analysis => (
              <CategoryBadge key={analysis.category} analysis={analysis} />
            ))}
          </div>
        )}

        {/* High Priority Section */}
        {highPriority.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.error,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>⚡</span> High Priority
            </div>
            {highPriority.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onInstall={handleInstall}
              />
            ))}
          </div>
        )}

        {/* Other Recommendations */}
        {otherRecommendations.length > 0 && (
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>💡</span> Suggestions
            </div>
            {otherRecommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onInstall={handleInstall}
              />
            ))}
          </div>
        )}

        {recommendations.length === 0 && (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            color: theme.colors.textMuted,
          }}>
            <span style={{ fontSize: '32px' }}>✨</span>
            <div style={{ marginTop: '12px', fontSize: theme.fontSize.sm }}>
              Your skill profile is well-balanced!
            </div>
            <div style={{ marginTop: '4px', fontSize: theme.fontSize.xs }}>
              No recommendations at this time.
            </div>
          </div>
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
