// ═══════════════════════════════════════════════════════════
// Health Score System - Comprehensive skill health evaluation
// ═══════════════════════════════════════════════════════════

import type { SkillNode, VulnerabilityLevel } from '../types';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SkillHealthScore {
  skillId: string;
  skillName: string;
  overallScore: number;      // 0-100
  grade: HealthGrade;
  components: {
    security: number;        // 40% weight
    freshness: number;       // 30% weight
    usage: number;           // 30% weight
  };
  breakdown: {
    vulnerabilityLevel: VulnerabilityLevel | 'none';
    isOutdated: boolean;
    majorVersionsBehind: number;
    connectionCount: number;
    hasPermissions: boolean;
  };
}

export interface DashboardHealth {
  averageScore: number;
  averageGrade: HealthGrade;
  gradeDistribution: Record<HealthGrade, number>;
  totalSkills: number;
  criticalCount: number;
  outdatedCount: number;
  topHealthy: SkillHealthScore[];
  bottomHealthy: SkillHealthScore[];
}

// ═══════════════════════════════════════════════════════════
// Grade Thresholds
// ═══════════════════════════════════════════════════════════

const GRADE_THRESHOLDS: Record<HealthGrade, number> = {
  'A': 90,
  'B': 75,
  'C': 60,
  'D': 40,
  'F': 0,
};

export function scoreToGrade(score: number): HealthGrade {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

export function gradeToColor(grade: HealthGrade): string {
  switch (grade) {
    case 'A': return '#34d399'; // Emerald
    case 'B': return '#60a5fa'; // Blue
    case 'C': return '#fbbf24'; // Amber
    case 'D': return '#fb923c'; // Orange
    case 'F': return '#f87171'; // Red
  }
}

// ═══════════════════════════════════════════════════════════
// Component Score Calculations
// ═══════════════════════════════════════════════════════════

/**
 * Security score (40% weight)
 * Based on vulnerability level and permissions
 */
function calculateSecurityScore(node: SkillNode): number {
  if (!node.vulnerability) return 100;

  const { level, permissions, handlesSensitiveData, trustSource } = node.vulnerability;
  let score = 100;

  // Vulnerability level penalty
  switch (level) {
    case 'critical': score -= 60; break;
    case 'high': score -= 40; break;
    case 'medium': score -= 20; break;
    case 'low': score -= 5; break;
  }

  // Permission count penalty (high-risk permissions)
  const riskyPerms = permissions.filter(p => 
    ['code-execution', 'filesystem', 'network'].includes(p)
  );
  score -= riskyPerms.length * 5;

  // Trust source bonus/penalty
  switch (trustSource) {
    case 'official': score += 10; break;
    case 'verified': score += 5; break;
    case 'community': break;
    case 'unknown': score -= 15; break;
  }

  // Sensitive data penalty
  if (handlesSensitiveData) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Freshness score (30% weight)
 * Based on version status
 */
function calculateFreshnessScore(node: SkillNode): {
  score: number;
  isOutdated: boolean;
  majorVersionsBehind: number;
} {
  if (!node.version || !node.latestVersion) {
    return { score: 80, isOutdated: false, majorVersionsBehind: 0 };
  }

  const [currMajor, currMinor, currPatch] = node.version.split('.').map(Number);
  const [latestMajor, latestMinor, latestPatch] = node.latestVersion.split('.').map(Number);

  const majorVersionsBehind = latestMajor - currMajor;
  const minorVersionsBehind = latestMinor - currMinor;
  const patchVersionsBehind = latestPatch - currPatch;

  let score = 100;
  const isOutdated = majorVersionsBehind > 0 || minorVersionsBehind > 0 || patchVersionsBehind > 0;

  if (majorVersionsBehind >= 2) {
    score = 20; // Very outdated
  } else if (majorVersionsBehind === 1) {
    score = 50; // Major version behind
  } else if (minorVersionsBehind >= 5) {
    score = 60;
  } else if (minorVersionsBehind >= 2) {
    score = 75;
  } else if (minorVersionsBehind === 1) {
    score = 85;
  } else if (patchVersionsBehind > 0) {
    score = 95;
  }

  return { score, isOutdated, majorVersionsBehind };
}

/**
 * Usage score (30% weight)
 * Based on connection count and centrality
 */
function calculateUsageScore(node: SkillNode, maxConnections: number): number {
  // Normalize connection count
  const connectionRatio = maxConnections > 0 
    ? node.connectionCount / maxConnections 
    : 0;

  // High connectivity = high usage = good health indicator
  // But we use a curve to not penalize less-connected skills too much
  const baseScore = 50 + (connectionRatio * 50);

  return Math.min(100, baseScore);
}

// ═══════════════════════════════════════════════════════════
// Main Scoring Functions
// ═══════════════════════════════════════════════════════════

/**
 * Calculate health score for a single skill
 */
export function calculateSkillHealthScore(
  node: SkillNode, 
  maxConnections: number
): SkillHealthScore {
  const security = calculateSecurityScore(node);
  const { score: freshness, isOutdated, majorVersionsBehind } = calculateFreshnessScore(node);
  const usage = calculateUsageScore(node, maxConnections);

  // Weighted average: 40% security + 30% freshness + 30% usage
  const overallScore = Math.round(
    (security * 0.4) + (freshness * 0.3) + (usage * 0.3)
  );

  return {
    skillId: node.id,
    skillName: node.name,
    overallScore,
    grade: scoreToGrade(overallScore),
    components: {
      security,
      freshness,
      usage,
    },
    breakdown: {
      vulnerabilityLevel: node.vulnerability?.level || 'none',
      isOutdated,
      majorVersionsBehind,
      connectionCount: node.connectionCount,
      hasPermissions: (node.vulnerability?.permissions.length || 0) > 0,
    },
  };
}

/**
 * Calculate health scores for all skills and dashboard summary
 */
export function calculateDashboardHealth(nodes: SkillNode[]): DashboardHealth {
  if (nodes.length === 0) {
    return {
      averageScore: 0,
      averageGrade: 'F',
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      totalSkills: 0,
      criticalCount: 0,
      outdatedCount: 0,
      topHealthy: [],
      bottomHealthy: [],
    };
  }

  const maxConnections = Math.max(...nodes.map(n => n.connectionCount), 1);
  const scores = nodes.map(node => calculateSkillHealthScore(node, maxConnections));

  // Calculate averages
  const totalScore = scores.reduce((sum, s) => sum + s.overallScore, 0);
  const averageScore = Math.round(totalScore / scores.length);

  // Grade distribution
  const gradeDistribution: Record<HealthGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const score of scores) {
    gradeDistribution[score.grade]++;
  }

  // Critical and outdated counts
  const criticalCount = scores.filter(s => 
    s.breakdown.vulnerabilityLevel === 'critical' || 
    s.breakdown.vulnerabilityLevel === 'high'
  ).length;
  const outdatedCount = scores.filter(s => s.breakdown.isOutdated).length;

  // Sort for top/bottom
  const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
  const topHealthy = sorted.slice(0, 5);
  const bottomHealthy = sorted.slice(-5).reverse();

  return {
    averageScore,
    averageGrade: scoreToGrade(averageScore),
    gradeDistribution,
    totalSkills: nodes.length,
    criticalCount,
    outdatedCount,
    topHealthy,
    bottomHealthy,
  };
}

// ═══════════════════════════════════════════════════════════
// Health Score Badge Component Data
// ═══════════════════════════════════════════════════════════

export function getHealthBadgeStyle(grade: HealthGrade): {
  background: string;
  color: string;
  glow: string;
} {
  const color = gradeToColor(grade);
  return {
    background: color,
    color: grade === 'C' || grade === 'D' ? '#000' : '#fff',
    glow: `0 0 12px ${color}40`,
  };
}
