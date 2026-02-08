import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';
import type { VizData, SkillNode, VulnerabilityLevel } from '../types';
import { getUpdateType, hasUpdate, formatVersion, getUpdateColor, type UpdateType } from '../utils/version';

interface ReportViewProps {
  data: VizData;
  healthScore?: number;
}

type SortKey = 'name' | 'category' | 'tokens' | 'connections' | 'usage' | 'recommendation';
type SortOrder = 'asc' | 'desc';
type UsageLevel = 'high' | 'medium' | 'low' | 'unused';
type RecommendationType = 'keep' | 'update' | 'remove' | 'essential';

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ═══════════════════════════════════════════════════════════
// Extended Skill Analysis
// ═══════════════════════════════════════════════════════════

interface ExtendedSkillInfo {
  node: SkillNode;
  usage: UsageLevel;
  usageScore: number;
  overlap: { hasOverlap: boolean; overlapWith: string[]; reason: string };
  recommendation: RecommendationType;
  recommendationReason: string;
  tokenEfficiency: number; // connections per 1000 tokens
  removeReason?: string;
  updateType?: UpdateType;  // Type of version update available
}

function analyzeSkillUsage(node: SkillNode, allNodes: SkillNode[]): { level: UsageLevel; score: number } {
  // Simulate usage based on connections and category importance
  const connectionScore = Math.min(node.connections.length / 5, 1) * 40;
  const sizeScore = (node.size / 2) * 30;
  const categoryBonus = ['security', 'development'].includes(node.category) ? 20 : 
                        ['productivity', 'utility'].includes(node.category) ? 15 : 10;
  
  const score = connectionScore + sizeScore + categoryBonus;
  
  if (score >= 70) return { level: 'high', score };
  if (score >= 45) return { level: 'medium', score };
  if (score >= 20) return { level: 'low', score };
  return { level: 'unused', score };
}

function findOverlaps(node: SkillNode, allNodes: SkillNode[], similarities: { skill1: string; skill2: string; similarity: number }[]): { hasOverlap: boolean; overlapWith: string[]; reason: string } {
  const overlaps: string[] = [];
  
  // Check cosine similarities
  for (const sim of similarities) {
    if (sim.similarity > 0.7) {
      if (sim.skill1 === node.id) overlaps.push(sim.skill2);
      if (sim.skill2 === node.id) overlaps.push(sim.skill1);
    }
  }
  
  // Check for similar names (e.g., skill-v1 vs skill-v2)
  const baseName = node.id.toLowerCase().replace(/[-_]?(v\d+|pro|max|skill|enhanced|lite)$/gi, '');
  for (const other of allNodes) {
    if (other.id === node.id) continue;
    const otherBase = other.id.toLowerCase().replace(/[-_]?(v\d+|pro|max|skill|enhanced|lite)$/gi, '');
    if (baseName === otherBase && !overlaps.includes(other.id)) {
      overlaps.push(other.id);
    }
  }
  
  if (overlaps.length === 0) {
    return { hasOverlap: false, overlapWith: [], reason: '' };
  }
  
  return {
    hasOverlap: true,
    overlapWith: overlaps,
    reason: overlaps.length === 1 
      ? `Similar to ${overlaps[0]}` 
      : `Overlaps with ${overlaps.length} skills`,
  };
}

function getRecommendation(
  node: SkillNode, 
  usage: UsageLevel, 
  overlap: { hasOverlap: boolean; overlapWith: string[] },
  allNodes: SkillNode[]
): { type: RecommendationType; reason: string; removeReason?: string; updateType?: UpdateType } {
  // Check for version updates first
  const updateType = getUpdateType(node.version || '', node.latestVersion || '');
  const needsUpdate = hasUpdate(node.version, node.latestVersion);
  
  // Essential skills - but still show if update available
  const essentialPatterns = ['security', 'guard', 'protect', 'auth'];
  const isEssential = node.category === 'security' || 
    essentialPatterns.some(p => node.id.toLowerCase().includes(p));
  
  // If update is available, prioritize showing it
  if (needsUpdate) {
    const versionStr = `${formatVersion(node.version || '')} → ${formatVersion(node.latestVersion || '')}`;
    let reason = '';
    switch (updateType) {
      case 'major':
        reason = `Major update available: ${versionStr}`;
        break;
      case 'minor':
        reason = `Minor update available: ${versionStr}`;
        break;
      case 'patch':
        reason = `Patch update available: ${versionStr}`;
        break;
    }
    return { type: 'update', reason, updateType };
  }
  
  if (isEssential) {
    return { type: 'essential', reason: 'Core security/protection skill' };
  }
  
  // Remove recommendations
  if (usage === 'unused' && overlap.hasOverlap) {
    return { 
      type: 'remove', 
      reason: 'Unused and redundant',
      removeReason: `Duplicate of ${overlap.overlapWith[0]}`,
    };
  }
  
  if (usage === 'unused' && node.tokens > 3000) {
    return { 
      type: 'remove', 
      reason: 'High token cost, no usage',
      removeReason: 'Consuming tokens without value',
    };
  }
  
  if (overlap.hasOverlap && usage === 'low') {
    // Find if there's a better version
    const overlapNode = allNodes.find(n => n.id === overlap.overlapWith[0]);
    if (overlapNode && overlapNode.tokens < node.tokens) {
      return { 
        type: 'remove', 
        reason: 'Lighter alternative exists',
        removeReason: `${overlapNode.name} is more efficient`,
      };
    }
  }
  
  // Keep
  return { type: 'keep', reason: usage === 'high' ? 'Actively used' : 'Working as expected' };
}

function analyzeAllSkills(data: VizData): ExtendedSkillInfo[] {
  const { nodes, metrics } = data;
  const similarities = metrics.cosineSimilarities || [];
  
  return nodes.map(node => {
    const { level: usage, score: usageScore } = analyzeSkillUsage(node, nodes);
    const overlap = findOverlaps(node, nodes, similarities);
    const rec = getRecommendation(node, usage, overlap, nodes);
    const tokenEfficiency = node.tokens > 0 ? (node.connections.length / (node.tokens / 1000)) : 0;
    
    return {
      node,
      usage,
      usageScore,
      overlap,
      recommendation: rec.type,
      recommendationReason: rec.reason,
      tokenEfficiency: Math.round(tokenEfficiency * 100) / 100,
      removeReason: rec.removeReason,
      updateType: rec.updateType,
    };
  });
}

// ═══════════════════════════════════════════════════════════
// Health Score Breakdown
// ═══════════════════════════════════════════════════════════

interface HealthBreakdown {
  balance: { score: number; label: string; description: string };
  coverage: { score: number; label: string; description: string };
  efficiency: { score: number; label: string; description: string };
  redundancy: { score: number; label: string; description: string };
  overall: number;
}

function calculateHealthBreakdown(data: VizData, extendedSkills: ExtendedSkillInfo[]): HealthBreakdown {
  const { nodes, clusters, metrics } = data;
  
  // Balance: How evenly distributed across categories
  const categoryCount = clusters.length;
  const idealPerCategory = nodes.length / categoryCount;
  const variance = clusters.reduce((sum, c) => {
    const diff = c.skills.length - idealPerCategory;
    return sum + (diff * diff);
  }, 0) / categoryCount;
  const balanceScore = Math.max(0, 100 - (variance * 3));
  
  // Coverage: Essential categories present
  const essentialCategories = ['security', 'productivity', 'utility'];
  const presentCategories = new Set(nodes.map(n => n.category));
  const coverageScore = (essentialCategories.filter(c => presentCategories.has(c)).length / essentialCategories.length) * 100;
  
  // Efficiency: Token usage vs connections
  const avgEfficiency = extendedSkills.reduce((sum, s) => sum + s.tokenEfficiency, 0) / extendedSkills.length;
  const efficiencyScore = Math.min(100, avgEfficiency * 25);
  
  // Redundancy: Low overlap is good
  const overlappingSkills = extendedSkills.filter(s => s.overlap.hasOverlap).length;
  const redundancyScore = Math.max(0, 100 - (overlappingSkills / nodes.length) * 150);
  
  const overall = Math.round((balanceScore * 0.25 + coverageScore * 0.3 + efficiencyScore * 0.25 + redundancyScore * 0.2));
  
  return {
    balance: {
      score: Math.round(balanceScore),
      label: 'Category Balance',
      description: balanceScore >= 70 ? 'Well distributed across categories' : 
                   balanceScore >= 40 ? 'Some category imbalance' : 'Heavy concentration in few categories',
    },
    coverage: {
      score: Math.round(coverageScore),
      label: 'Essential Coverage',
      description: coverageScore >= 80 ? 'All essential categories covered' :
                   coverageScore >= 50 ? 'Some essential categories missing' : 'Major gaps in essential categories',
    },
    efficiency: {
      score: Math.round(efficiencyScore),
      label: 'Token Efficiency',
      description: efficiencyScore >= 70 ? 'Good token-to-value ratio' :
                   efficiencyScore >= 40 ? 'Room for optimization' : 'High token usage, low connectivity',
    },
    redundancy: {
      score: Math.round(redundancyScore),
      label: 'Low Redundancy',
      description: redundancyScore >= 70 ? 'Minimal skill overlap' :
                   redundancyScore >= 40 ? 'Some redundant skills detected' : 'High skill redundancy',
    },
    overall,
  };
}

// ═══════════════════════════════════════════════════════════
// Suggested Skills (for missing categories)
// ═══════════════════════════════════════════════════════════

interface SuggestedSkill {
  name: string;
  id: string;
  category: string;
  reason: string;
  estimatedTokens: string;
}

// ═══════════════════════════════════════════════════════════
// Security Analysis
// ═══════════════════════════════════════════════════════════

interface SecurityOverview {
  overallScore: number;
  overallLevel: VulnerabilityLevel;
  highRiskCount: number;
  criticalCount: number;
  riskSkills: { node: SkillNode; reason: string }[];
  recommendations: string[];
}

function calculateSecurityOverview(nodes: SkillNode[]): SecurityOverview {
  const nodesWithVuln = nodes.filter(n => n.vulnerability);
  
  if (nodesWithVuln.length === 0) {
    return {
      overallScore: 0,
      overallLevel: 'low',
      highRiskCount: 0,
      criticalCount: 0,
      riskSkills: [],
      recommendations: ['No vulnerability data available'],
    };
  }
  
  // Calculate average score
  const totalScore = nodesWithVuln.reduce((sum, n) => sum + (n.vulnerability?.score || 0), 0);
  const overallScore = Math.round(totalScore / nodesWithVuln.length);
  
  // Determine overall level
  let overallLevel: VulnerabilityLevel;
  if (overallScore <= 25) overallLevel = 'low';
  else if (overallScore <= 50) overallLevel = 'medium';
  else if (overallScore <= 75) overallLevel = 'high';
  else overallLevel = 'critical';
  
  // Count high-risk skills
  const criticalCount = nodesWithVuln.filter(n => n.vulnerability?.level === 'critical').length;
  const highRiskCount = nodesWithVuln.filter(n => 
    n.vulnerability?.level === 'high' || n.vulnerability?.level === 'critical'
  ).length;
  
  // Get risk skills (high + critical)
  const riskSkills = nodesWithVuln
    .filter(n => n.vulnerability && (n.vulnerability.level === 'high' || n.vulnerability.level === 'critical'))
    .sort((a, b) => (b.vulnerability?.score || 0) - (a.vulnerability?.score || 0))
    .slice(0, 5)
    .map(node => {
      const v = node.vulnerability!;
      const reasons: string[] = [];
      if (v.permissions.includes('code-execution')) reasons.push('code execution');
      if (v.permissions.includes('filesystem')) reasons.push('file access');
      if (v.handlesSensitiveData) reasons.push('sensitive data');
      if (v.trustSource === 'community' || v.trustSource === 'unknown') reasons.push(v.trustSource + ' source');
      return {
        node,
        reason: reasons.join(' + ') || 'elevated risk',
      };
    });
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  const outdatedHighRisk = nodesWithVuln.filter(n => 
    n.vulnerability?.level === 'high' && n.version !== n.latestVersion
  );
  if (outdatedHighRisk.length > 0) {
    recommendations.push(`Update ${outdatedHighRisk.length} high-risk skill(s) with pending updates`);
  }
  
  const communitySkills = nodesWithVuln.filter(n => 
    n.vulnerability?.trustSource === 'community' || n.vulnerability?.trustSource === 'unknown'
  );
  if (communitySkills.length > 0) {
    recommendations.push(`Review ${communitySkills.length} community/unknown source skill(s)`);
  }
  
  const sensitiveSkills = nodesWithVuln.filter(n => 
    n.vulnerability?.handlesSensitiveData && n.vulnerability.level !== 'low'
  );
  if (sensitiveSkills.length > 0) {
    recommendations.push(`Audit ${sensitiveSkills.length} skill(s) handling sensitive data`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Security posture looks good! Keep skills updated.');
  }
  
  return {
    overallScore,
    overallLevel,
    highRiskCount,
    criticalCount,
    riskSkills,
    recommendations,
  };
}

const VULNERABILITY_COLORS: Record<VulnerabilityLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

function SecurityScoreRing({ score, level, size = 100 }: { score: number; level: VulnerabilityLevel; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = VULNERABILITY_COLORS[level];
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.bgTertiary}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '22px',
          fontWeight: theme.fontWeight.bold,
          color: color,
          fontFamily: theme.fonts.mono,
        }}>
          {score}
        </div>
        <div style={{
          fontSize: '9px',
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
        }}>
          risk
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Suggested Skills (for missing categories)
// ═══════════════════════════════════════════════════════════

function getSuggestedSkills(data: VizData): SuggestedSkill[] {
  const presentCategories = new Set(data.nodes.map(n => n.category));
  const suggestions: SuggestedSkill[] = [];
  
  const skillSuggestions: Record<string, SuggestedSkill[]> = {
    development: [
      { name: 'Docker Basics', id: 'docker-basics', category: 'development', reason: 'DevOps foundation', estimatedTokens: '~2.5k' },
      { name: 'Git Workflow', id: 'git-workflow', category: 'development', reason: 'Version control mastery', estimatedTokens: '~1.8k' },
    ],
    security: [
      { name: 'Prompt Guard', id: 'prompt-guard', category: 'security', reason: 'Essential injection protection', estimatedTokens: '~3.2k' },
      { name: 'API Security', id: 'api-security', category: 'security', reason: 'Secure API handling', estimatedTokens: '~2.1k' },
    ],
    productivity: [
      { name: 'Task Planner', id: 'task-planner', category: 'productivity', reason: 'Better task management', estimatedTokens: '~1.5k' },
      { name: 'Time Tracker', id: 'time-tracker', category: 'productivity', reason: 'Productivity insights', estimatedTokens: '~1.2k' },
    ],
    design: [
      { name: 'UI Components', id: 'ui-components', category: 'design', reason: 'Consistent UI patterns', estimatedTokens: '~2.8k' },
    ],
    communication: [
      { name: 'Email Templates', id: 'email-templates', category: 'communication', reason: 'Professional communication', estimatedTokens: '~1.4k' },
    ],
  };
  
  // Find weak or missing categories
  const allCategories = ['development', 'security', 'productivity', 'design', 'communication'];
  for (const cat of allCategories) {
    if (!presentCategories.has(cat)) {
      if (skillSuggestions[cat]) {
        suggestions.push(...skillSuggestions[cat]);
      }
    } else {
      // Check if category is weak (< 2 skills)
      const catSkillCount = data.nodes.filter(n => n.category === cat).length;
      if (catSkillCount < 2 && skillSuggestions[cat]) {
        suggestions.push(skillSuggestions[cat][0]);
      }
    }
  }
  
  return suggestions.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════

function HealthScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 70) return theme.colors.success;
    if (s >= 50) return theme.colors.warning;
    return theme.colors.error;
  };
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.bgTertiary}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: theme.fontWeight.bold,
          color: getColor(score),
          fontFamily: theme.fonts.mono,
        }}>
          {score}
        </div>
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          / 100
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, description }: { label: string; score: number; description: string }) {
  const getColor = (s: number) => {
    if (s >= 70) return theme.colors.success;
    if (s >= 50) return theme.colors.warning;
    return theme.colors.error;
  };
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          color: getColor(score),
          fontFamily: theme.fonts.mono,
        }}>
          {score}%
        </span>
      </div>
      <div style={{
        height: '6px',
        background: theme.colors.bgTertiary,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: getColor(score),
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: '2px',
      }}>
        {description}
      </div>
    </div>
  );
}

function CategoryChart({ data }: { data: VizData }) {
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / data.nodes.length) * 100),
        color: theme.categoryColors[name] || theme.colors.textMuted,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);
  
  const maxCount = Math.max(...categoryStats.map(c => c.count));
  
  return (
    <div>
      {categoryStats.map(cat => (
        <div key={cat.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}>
          <span style={{
            width: '90px',
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            textTransform: 'capitalize',
          }}>
            {cat.name}
          </span>
          <div style={{
            flex: 1,
            height: '20px',
            background: theme.colors.bgTertiary,
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              width: `${(cat.count / maxCount) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${cat.color}80, ${cat.color})`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
            }}>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: '#fff',
                fontWeight: theme.fontWeight.medium,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                {cat.count}
              </span>
            </div>
          </div>
          <span style={{
            width: '40px',
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            textAlign: 'right',
            fontFamily: theme.fonts.mono,
          }}>
            {cat.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

function QuickActionButton({ 
  icon, 
  label, 
  count, 
  color, 
  onClick 
}: { 
  icon: string; 
  label: string; 
  count: number; 
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: theme.colors.bgTertiary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.colors.bgHover;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme.colors.bgTertiary;
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.textPrimary,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          {count} {count === 1 ? 'skill' : 'skills'}
        </div>
      </div>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: `${color}20`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        fontFamily: theme.fonts.mono,
      }}>
        {count}
      </div>
    </button>
  );
}

function UsageBadge({ level }: { level: UsageLevel }) {
  const config = {
    high: { label: 'High', color: theme.colors.success, icon: '🔥' },
    medium: { label: 'Medium', color: theme.colors.info, icon: '📊' },
    low: { label: 'Low', color: theme.colors.warning, icon: '📉' },
    unused: { label: 'Unused', color: theme.colors.error, icon: '💤' },
  };
  
  const { label, color, icon } = config[level];
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      fontSize: theme.fontSize.xs,
      color: color,
      background: `${color}15`,
      borderRadius: theme.radius.sm,
    }}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

function RecommendationBadge({ 
  type, 
  removeReason, 
  updateType 
}: { 
  type: RecommendationType; 
  removeReason?: string;
  updateType?: UpdateType;
}) {
  // For update badges, use color based on update type
  if (type === 'update' && updateType) {
    const updateColor = getUpdateColor(updateType);
    return (
      <span
        title={updateColor.label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          fontSize: theme.fontSize.xs,
          color: updateColor.text,
          background: updateColor.bg,
          borderRadius: theme.radius.sm,
          cursor: 'help',
          fontWeight: updateType === 'major' ? theme.fontWeight.semibold : theme.fontWeight.normal,
        }}
      >
        <span>🔄</span>
        {updateColor.label}
      </span>
    );
  }
  
  const config = {
    keep: { label: 'Keep', color: theme.colors.success, icon: '✓' },
    update: { label: 'Update', color: theme.colors.warning, icon: '🔄' },
    remove: { label: 'Remove', color: theme.colors.error, icon: '🗑️' },
    essential: { label: 'Essential', color: theme.colors.accent, icon: '⭐' },
  };
  
  const { label, color, icon } = config[type];
  
  return (
    <span
      title={removeReason || ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        fontSize: theme.fontSize.xs,
        color: type === 'remove' ? '#fff' : color,
        background: type === 'remove' ? theme.colors.error : `${color}15`,
        borderRadius: theme.radius.sm,
        cursor: removeReason ? 'help' : 'default',
        fontWeight: type === 'remove' ? theme.fontWeight.semibold : theme.fontWeight.normal,
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

function ExpandedSkillDetails({ skill }: { skill: ExtendedSkillInfo }) {
  return (
    <tr>
      <td colSpan={8} style={{
        padding: '0',
        background: theme.colors.bgTertiary,
      }}>
        <div style={{
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {/* Token Efficiency */}
          <div style={{
            padding: '12px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Token Efficiency
            </div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: skill.tokenEfficiency > 1 ? theme.colors.success : theme.colors.warning,
              fontFamily: theme.fonts.mono,
            }}>
              {skill.tokenEfficiency} <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>conn/1k tokens</span>
            </div>
          </div>
          
          {/* Usage Score */}
          <div style={{
            padding: '12px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Usage Score
            </div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
            }}>
              {Math.round(skill.usageScore)} <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>/ 100</span>
            </div>
          </div>
          
          {/* Connections */}
          <div style={{
            padding: '12px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Connected To
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}>
              {skill.node.connections.length > 0 
                ? skill.node.connections.slice(0, 3).join(', ') + (skill.node.connections.length > 3 ? ` +${skill.node.connections.length - 3}` : '')
                : 'No connections'}
            </div>
          </div>
          
          {/* Recommendation Reason */}
          <div style={{
            padding: '12px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>
              Recommendation
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}>
              {skill.recommendationReason}
              {skill.removeReason && (
                <span style={{ color: theme.colors.error, display: 'block', marginTop: '4px' }}>
                  ⚠️ {skill.removeReason}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Report View Component
// ═══════════════════════════════════════════════════════════

export default function ReportView({ data, healthScore = 60 }: ReportViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('recommendation');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [filterRecommendation, setFilterRecommendation] = useState<RecommendationType | null>(null);

  // Analysis
  const extendedSkills = useMemo(() => analyzeAllSkills(data), [data]);
  const healthBreakdown = useMemo(() => calculateHealthBreakdown(data, extendedSkills), [data, extendedSkills]);
  const suggestedSkills = useMemo(() => getSuggestedSkills(data), [data]);
  const securityOverview = useMemo(() => calculateSecurityOverview(data.nodes), [data.nodes]);
  
  // Stats
  const removeCount = extendedSkills.filter(s => s.recommendation === 'remove').length;
  const updateCount = extendedSkills.filter(s => s.recommendation === 'update').length;
  const overlappingCount = extendedSkills.filter(s => s.overlap.hasOverlap).length;
  const unusedCount = extendedSkills.filter(s => s.usage === 'unused').length;

  const categories = useMemo(() => {
    const cats = [...new Set(data.nodes.map(n => n.category))];
    return cats.sort();
  }, [data.nodes]);

  const sortedSkills = useMemo(() => {
    let skills = [...extendedSkills];

    if (filterCategory) {
      skills = skills.filter(s => s.node.category === filterCategory);
    }
    
    if (filterRecommendation) {
      skills = skills.filter(s => s.recommendation === filterRecommendation);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      skills = skills.filter(s => 
        s.node.name.toLowerCase().includes(query) ||
        s.node.id.toLowerCase().includes(query)
      );
    }

    skills.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.node.name.localeCompare(b.node.name);
          break;
        case 'category':
          comparison = a.node.category.localeCompare(b.node.category);
          break;
        case 'tokens':
          comparison = a.node.tokens - b.node.tokens;
          break;
        case 'connections':
          comparison = a.node.connections.length - b.node.connections.length;
          break;
        case 'usage':
          const usageOrder = { high: 0, medium: 1, low: 2, unused: 3 };
          comparison = usageOrder[a.usage] - usageOrder[b.usage];
          break;
        case 'recommendation':
          const recOrder = { remove: 0, update: 1, keep: 2, essential: 3 };
          comparison = recOrder[a.recommendation] - recOrder[b.recommendation];
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return skills;
  }, [extendedSkills, sortKey, sortOrder, filterCategory, filterRecommendation, searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ label, sortKeyName, width }: { label: string; sortKeyName: SortKey; width?: string }) => (
    <th
      onClick={() => handleSort(sortKeyName)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        position: 'sticky',
        top: 0,
        width: width || 'auto',
      }}
    >
      {label}
      {sortKey === sortKeyName && (
        <span style={{ marginLeft: '4px', opacity: 0.6 }}>
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme.colors.bgPrimary,
      overflow: 'auto',
    }}>
      {/* ═══════════════════════════════════════════════════════════
          HEALTH SCORE BREAKDOWN (New!)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '24px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
      }}>
        <h2 style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          margin: 0,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>❤️</span> HEALTH SCORE BREAKDOWN
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '32px',
          alignItems: 'start',
        }}>
          {/* Score Ring */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <HealthScoreRing score={healthBreakdown.overall} />
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
            }}>
              Overall Score
            </span>
          </div>
          
          {/* Breakdown Bars */}
          <div>
            <BreakdownBar {...healthBreakdown.balance} />
            <BreakdownBar {...healthBreakdown.coverage} />
            <BreakdownBar {...healthBreakdown.efficiency} />
            <BreakdownBar {...healthBreakdown.redundancy} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECURITY OVERVIEW (New!)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '24px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: securityOverview.highRiskCount > 0 
          ? `linear-gradient(90deg, ${VULNERABILITY_COLORS[securityOverview.overallLevel]}08, transparent)`
          : undefined,
      }}>
        <h2 style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          margin: 0,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🔒</span> SECURITY OVERVIEW
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* Risk Score Ring */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <SecurityScoreRing 
              score={securityOverview.overallScore} 
              level={securityOverview.overallLevel} 
            />
            <span style={{
              fontSize: theme.fontSize.xs,
              color: VULNERABILITY_COLORS[securityOverview.overallLevel],
              textTransform: 'uppercase',
              fontWeight: theme.fontWeight.semibold,
            }}>
              {securityOverview.overallLevel} Risk
            </span>
          </div>
          
          {/* High Risk Skills */}
          <div>
            <h4 style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              margin: 0,
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}>
              🔓 High Risk Skills ({securityOverview.highRiskCount})
            </h4>
            {securityOverview.riskSkills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {securityOverview.riskSkills.map(({ node, reason }) => (
                  <div 
                    key={node.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: theme.colors.bgTertiary,
                      borderRadius: theme.radius.md,
                      borderLeft: `3px solid ${VULNERABILITY_COLORS[node.vulnerability?.level || 'medium']}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.colors.textPrimary,
                        fontFamily: theme.fonts.mono,
                      }}>
                        {node.name}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                      }}>
                        {reason}
                      </div>
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      fontFamily: theme.fonts.mono,
                      color: VULNERABILITY_COLORS[node.vulnerability?.level || 'medium'],
                      fontWeight: theme.fontWeight.semibold,
                    }}>
                      {node.vulnerability?.score}/100
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '16px',
                background: theme.colors.bgTertiary,
                borderRadius: theme.radius.md,
                color: theme.colors.success,
                fontSize: theme.fontSize.sm,
              }}>
                ✅ No high-risk skills detected
              </div>
            )}
          </div>
          
          {/* Recommendations */}
          <div>
            <h4 style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textMuted,
              margin: 0,
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}>
              💡 Security Recommendations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {securityOverview.recommendations.map((rec, i) => (
                <div 
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px 12px',
                    background: theme.colors.bgTertiary,
                    borderRadius: theme.radius.md,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  <span style={{ color: theme.colors.warning }}>→</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          QUICK ACTIONS + CATEGORY DISTRIBUTION
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '24px',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {/* Quick Actions */}
          <div>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>⚡</span> QUICK ACTIONS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <QuickActionButton 
                icon="🗑️" 
                label="Remove Recommended" 
                count={removeCount} 
                color={theme.colors.error}
                onClick={() => setFilterRecommendation(filterRecommendation === 'remove' ? null : 'remove')}
              />
              <QuickActionButton 
                icon="🔄" 
                label="Updates Available" 
                count={updateCount} 
                color={theme.colors.warning}
                onClick={() => setFilterRecommendation(filterRecommendation === 'update' ? null : 'update')}
              />
              <QuickActionButton 
                icon="📦" 
                label="Overlapping Skills" 
                count={overlappingCount} 
                color={theme.colors.info}
              />
              <QuickActionButton 
                icon="💤" 
                label="Unused Skills" 
                count={unusedCount} 
                color={theme.colors.textMuted}
              />
            </div>
          </div>
          
          {/* Category Distribution */}
          <div>
            <h3 style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>📊</span> CATEGORY DISTRIBUTION
            </h3>
            <CategoryChart data={data} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SUGGESTED SKILLS (New!)
      ═══════════════════════════════════════════════════════════ */}
      {suggestedSkills.length > 0 && (
        <section style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: `linear-gradient(90deg, ${theme.colors.accent}08, transparent)`,
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>💡</span> SUGGESTED SKILLS
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}>
            {suggestedSkills.map((skill, i) => (
              <div key={i} style={{
                padding: '16px',
                background: theme.colors.bgSecondary,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: theme.categoryColors[skill.category] || theme.colors.textMuted,
                  }} />
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                    color: theme.colors.textPrimary,
                  }}>
                    {skill.name}
                  </span>
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  marginBottom: '4px',
                }}>
                  {skill.reason}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.mono,
                  }}>
                    {skill.estimatedTokens}
                  </span>
                  <button style={{
                    padding: '4px 12px',
                    fontSize: theme.fontSize.xs,
                    background: theme.colors.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    cursor: 'pointer',
                    fontWeight: theme.fontWeight.medium,
                  }}>
                    + Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SKILL LIST (Enhanced!)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
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
            <span>📋</span> SKILL LIST
          </h2>
          
          {filterRecommendation && (
            <button
              onClick={() => setFilterRecommendation(null)}
              style={{
                padding: '4px 12px',
                fontSize: theme.fontSize.xs,
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
              }}
            >
              Clear filter: {filterRecommendation} ✕
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="🔍 Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 14px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              outline: 'none',
            }}
          />

          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            style={{
              padding: '10px 14px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{capitalize(cat)}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
          }}>
            {sortedSkills.length} of {extendedSkills.length} skills
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: theme.fonts.sans,
          }}>
            <thead>
              <tr>
                <SortHeader label="Skill" sortKeyName="name" />
                <SortHeader label="Category" sortKeyName="category" width="100px" />
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  background: theme.colors.bgSecondary,
                  position: 'sticky',
                  top: 0,
                  width: '140px',
                }}>
                  Version
                </th>
                <SortHeader label="Tokens" sortKeyName="tokens" width="90px" />
                <SortHeader label="Connections" sortKeyName="connections" width="100px" />
                <SortHeader label="Usage" sortKeyName="usage" width="100px" />
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  background: theme.colors.bgSecondary,
                  position: 'sticky',
                  top: 0,
                  width: '90px',
                }}>
                  Overlap
                </th>
                <SortHeader label="Action" sortKeyName="recommendation" width="130px" />
              </tr>
            </thead>
            <tbody>
              {sortedSkills.map((skill) => {
                const color = theme.categoryColors[skill.node.category] || theme.colors.textMuted;
                const isExpanded = expandedSkill === skill.node.id;
                
                return (
                  <>
                    <tr
                      key={skill.node.id}
                      onClick={() => setExpandedSkill(isExpanded ? null : skill.node.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : `1px solid ${theme.colors.border}`,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: isExpanded ? theme.colors.bgSecondary : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = theme.colors.bgSecondary;
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{
                            color: theme.colors.textMuted,
                            fontSize: '10px',
                            transition: 'transform 0.15s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}>
                            ▶
                          </span>
                          <div>
                            <div style={{
                              fontSize: theme.fontSize.sm,
                              fontWeight: theme.fontWeight.medium,
                              color: theme.colors.textPrimary,
                            }}>
                              {skill.node.name}
                            </div>
                            <div style={{
                              fontSize: theme.fontSize.xs,
                              color: theme.colors.textMuted,
                              fontFamily: theme.fonts.mono,
                            }}>
                              {skill.node.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.textSecondary,
                          textTransform: 'capitalize',
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: color,
                          }} />
                          {skill.node.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {skill.node.version ? (
                          <div style={{
                            fontSize: theme.fontSize.xs,
                            fontFamily: theme.fonts.mono,
                          }}>
                            <span style={{ color: theme.colors.textSecondary }}>
                              {formatVersion(skill.node.version)}
                            </span>
                            {skill.updateType && skill.updateType !== 'none' && (
                              <>
                                <span style={{ 
                                  color: theme.colors.textMuted,
                                  margin: '0 4px',
                                }}>→</span>
                                <span style={{ 
                                  color: getUpdateColor(skill.updateType).text,
                                  fontWeight: theme.fontWeight.semibold,
                                }}>
                                  {formatVersion(skill.node.latestVersion || '')}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.textMuted,
                          }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: theme.fontSize.sm,
                        fontFamily: theme.fonts.mono,
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}>
                        ~{skill.node.tokens.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        fontSize: theme.fontSize.sm,
                        fontFamily: theme.fonts.mono,
                        color: theme.colors.textSecondary,
                      }}>
                        {skill.node.connections.length}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <UsageBadge level={skill.usage} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {skill.overlap.hasOverlap ? (
                          <span
                            title={skill.overlap.reason}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              fontSize: theme.fontSize.xs,
                              color: theme.colors.warning,
                              background: `${theme.colors.warning}15`,
                              borderRadius: theme.radius.sm,
                              cursor: 'help',
                            }}
                          >
                            ⚠️ Yes
                          </span>
                        ) : (
                          <span style={{
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.textMuted,
                          }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <RecommendationBadge 
                          type={skill.recommendation} 
                          removeReason={skill.removeReason}
                          updateType={skill.updateType}
                        />
                      </td>
                    </tr>
                    {isExpanded && <ExpandedSkillDetails skill={skill} />}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
