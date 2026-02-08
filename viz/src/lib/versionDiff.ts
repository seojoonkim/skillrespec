// ═══════════════════════════════════════════════════════════
// Version Diff & Comparison - Analyze skill version changes
// ═══════════════════════════════════════════════════════════

import type { SkillNode, TrustSource } from '../types';
import { KNOWN_SKILLS } from '../data/knownSkills';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ChangeType = 'added' | 'removed' | 'modified' | 'security';

export interface VersionChange {
  type: ChangeType;
  field: string;
  description: string;
  oldValue?: string | string[];
  newValue?: string | string[];
  severity: 'low' | 'medium' | 'high';
}

export interface VersionDiff {
  skillId: string;
  skillName: string;
  currentVersion: string;
  latestVersion: string;
  versionJump: 'patch' | 'minor' | 'major';
  changes: VersionChange[];
  securityChanges: VersionChange[];
  breakingChanges: boolean;
  recommendUpdate: boolean;
  impactScore: number; // 0-100
  changelog?: string;
}

export interface SkillUpdate {
  skillId: string;
  skillName: string;
  currentVersion: string;
  latestVersion: string;
  hasSecurityFix: boolean;
  hasCriticalBug: boolean;
  breakingChanges: boolean;
  newPermissions: string[];
  removedPermissions: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  releaseDate?: string;
}

// ═══════════════════════════════════════════════════════════
// Version Parsing
// ═══════════════════════════════════════════════════════════

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

function parseVersion(version: string): SemVer {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  return vA.patch - vB.patch;
}

function getVersionJump(current: string, latest: string): 'patch' | 'minor' | 'major' {
  const vCurrent = parseVersion(current);
  const vLatest = parseVersion(latest);

  if (vLatest.major > vCurrent.major) return 'major';
  if (vLatest.minor > vCurrent.minor) return 'minor';
  return 'patch';
}

// ═══════════════════════════════════════════════════════════
// Mock Changelog Data (would come from API in production)
// ═══════════════════════════════════════════════════════════

interface VersionInfo {
  version: string;
  releaseDate: string;
  changes: VersionChange[];
  permissions?: string[];
  breaking?: boolean;
}

const MOCK_VERSION_HISTORY: Record<string, VersionInfo[]> = {
  'github': [
    {
      version: '2.0.0',
      releaseDate: '2025-01-15',
      changes: [
        { type: 'added', field: 'feature', description: 'GitHub Actions workflow support', severity: 'low' },
        { type: 'modified', field: 'api', description: 'Updated to GitHub API v4 (GraphQL)', severity: 'medium' },
        { type: 'security', field: 'auth', description: 'Added fine-grained PAT support', severity: 'high' },
      ],
      permissions: ['network', 'code-execution'],
      breaking: true,
    },
    {
      version: '1.8.0',
      releaseDate: '2024-12-01',
      changes: [
        { type: 'added', field: 'feature', description: 'Code search API integration', severity: 'low' },
      ],
      permissions: ['network'],
    },
  ],
  'prompt-guard': [
    {
      version: '3.0.0',
      releaseDate: '2025-02-01',
      changes: [
        { type: 'added', field: 'feature', description: 'Real-time threat detection', severity: 'high' },
        { type: 'added', field: 'security', description: 'HiveFence integration', severity: 'high' },
        { type: 'modified', field: 'performance', description: '50% faster detection', severity: 'medium' },
      ],
      permissions: [],
      breaking: false,
    },
  ],
  'obsidian': [
    {
      version: '1.5.0',
      releaseDate: '2025-01-20',
      changes: [
        { type: 'added', field: 'feature', description: 'Canvas support', severity: 'low' },
        { type: 'security', field: 'auth', description: 'Vault encryption improvements', severity: 'high' },
        { type: 'removed', field: 'deprecated', description: 'Legacy sync protocol', severity: 'medium' },
      ],
      permissions: ['filesystem'],
    },
  ],
  'slack': [
    {
      version: '1.5.2',
      releaseDate: '2025-01-10',
      changes: [
        { type: 'security', field: 'fix', description: 'Fixed token exposure vulnerability', severity: 'high' },
        { type: 'modified', field: 'performance', description: 'Reduced memory usage', severity: 'low' },
      ],
      permissions: ['network'],
    },
  ],
  'discord': [
    {
      version: '2.3.0',
      releaseDate: '2025-01-25',
      changes: [
        { type: 'added', field: 'feature', description: 'Thread support', severity: 'low' },
        { type: 'added', field: 'feature', description: 'Forum channel support', severity: 'low' },
        { type: 'security', field: 'permission', description: 'New message.manage permission required', severity: 'medium', newValue: ['message.manage'] },
      ],
      permissions: ['network'],
    },
  ],
};

// ═══════════════════════════════════════════════════════════
// Diff Calculation
// ═══════════════════════════════════════════════════════════

/**
 * Calculate version diff for a skill
 */
export function calculateVersionDiff(skill: SkillNode): VersionDiff | null {
  if (!skill.version || !skill.latestVersion) return null;
  if (compareVersions(skill.version, skill.latestVersion) >= 0) return null;

  const knownSkill = KNOWN_SKILLS[skill.id.toLowerCase()];
  const versionHistory = MOCK_VERSION_HISTORY[skill.id.toLowerCase()] || [];
  
  // Collect all changes between current and latest version
  const allChanges: VersionChange[] = [];
  const securityChanges: VersionChange[] = [];
  let breakingChanges = false;

  for (const versionInfo of versionHistory) {
    if (compareVersions(versionInfo.version, skill.version) > 0 &&
        compareVersions(versionInfo.version, skill.latestVersion) <= 0) {
      allChanges.push(...versionInfo.changes);
      securityChanges.push(...versionInfo.changes.filter(c => c.type === 'security'));
      if (versionInfo.breaking) {
        breakingChanges = true;
      }
    }
  }

  // Calculate impact score
  let impactScore = 0;
  const versionJump = getVersionJump(skill.version, skill.latestVersion);
  
  // Base score from version jump
  if (versionJump === 'major') impactScore += 40;
  else if (versionJump === 'minor') impactScore += 20;
  else impactScore += 10;

  // Add from changes
  for (const change of allChanges) {
    if (change.severity === 'high') impactScore += 15;
    else if (change.severity === 'medium') impactScore += 8;
    else impactScore += 3;
  }

  // Security changes are weighted more
  impactScore += securityChanges.length * 10;
  if (breakingChanges) impactScore += 20;

  impactScore = Math.min(100, impactScore);

  // Recommend update if security fixes or critical bugs
  const recommendUpdate = securityChanges.length > 0 || 
    versionJump === 'major' ||
    allChanges.some(c => c.severity === 'high');

  return {
    skillId: skill.id,
    skillName: skill.name,
    currentVersion: skill.version,
    latestVersion: skill.latestVersion,
    versionJump,
    changes: allChanges,
    securityChanges,
    breakingChanges,
    recommendUpdate,
    impactScore,
  };
}

/**
 * Get all available updates for installed skills
 */
export function getAvailableUpdates(skills: SkillNode[]): SkillUpdate[] {
  const updates: SkillUpdate[] = [];

  for (const skill of skills) {
    if (!skill.version || !skill.latestVersion) continue;
    if (compareVersions(skill.version, skill.latestVersion) >= 0) continue;

    const diff = calculateVersionDiff(skill);
    if (!diff) continue;

    const knownSkill = KNOWN_SKILLS[skill.id.toLowerCase()];
    const currentPerms = skill.vulnerability?.permissions || [];
    const latestPerms = knownSkill?.permissions || [];

    const newPermissions = latestPerms.filter(p => !currentPerms.includes(p));
    const removedPermissions = currentPerms.filter(p => !latestPerms.includes(p));

    // Determine impact level
    let impactLevel: SkillUpdate['impactLevel'] = 'low';
    if (diff.securityChanges.length > 0) impactLevel = 'critical';
    else if (diff.breakingChanges || newPermissions.length > 0) impactLevel = 'high';
    else if (diff.versionJump === 'major') impactLevel = 'high';
    else if (diff.versionJump === 'minor') impactLevel = 'medium';

    updates.push({
      skillId: skill.id,
      skillName: skill.name,
      currentVersion: skill.version,
      latestVersion: skill.latestVersion,
      hasSecurityFix: diff.securityChanges.length > 0,
      hasCriticalBug: diff.changes.some(c => c.severity === 'high' && c.type !== 'security'),
      breakingChanges: diff.breakingChanges,
      newPermissions,
      removedPermissions,
      impactLevel,
    });
  }

  // Sort by impact level
  const levelOrder: Record<SkillUpdate['impactLevel'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return updates.sort((a, b) => levelOrder[a.impactLevel] - levelOrder[b.impactLevel]);
}

// ═══════════════════════════════════════════════════════════
// Display Helpers
// ═══════════════════════════════════════════════════════════

/**
 * Get change type display info
 */
export function getChangeTypeInfo(type: ChangeType): {
  icon: string;
  label: string;
  color: string;
} {
  switch (type) {
    case 'added':
      return { icon: '+', label: 'Added', color: '#34d399' };
    case 'removed':
      return { icon: '-', label: 'Removed', color: '#f87171' };
    case 'modified':
      return { icon: '~', label: 'Modified', color: '#fbbf24' };
    case 'security':
      return { icon: '🔒', label: 'Security', color: '#a78bfa' };
  }
}

/**
 * Get version jump display info
 */
export function getVersionJumpInfo(jump: 'patch' | 'minor' | 'major'): {
  label: string;
  color: string;
  description: string;
} {
  switch (jump) {
    case 'patch':
      return {
        label: 'Patch',
        color: '#60a5fa',
        description: 'Bug fixes only',
      };
    case 'minor':
      return {
        label: 'Minor',
        color: '#fbbf24',
        description: 'New features, backward compatible',
      };
    case 'major':
      return {
        label: 'Major',
        color: '#f87171',
        description: 'May contain breaking changes',
      };
  }
}

/**
 * Get impact level display info
 */
export function getImpactLevelInfo(level: SkillUpdate['impactLevel']): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  switch (level) {
    case 'critical':
      return {
        icon: '🚨',
        label: 'Critical',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
      };
    case 'high':
      return {
        icon: '⚠️',
        label: 'High',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.1)',
      };
    case 'medium':
      return {
        icon: '📦',
        label: 'Medium',
        color: '#fbbf24',
        bgColor: 'rgba(251, 191, 36, 0.1)',
      };
    case 'low':
      return {
        icon: '✨',
        label: 'Low',
        color: '#34d399',
        bgColor: 'rgba(52, 211, 153, 0.1)',
      };
  }
}

/**
 * Generate update command
 */
export function getUpdateCommand(skillId: string, version?: string): string {
  if (version) {
    return `clawdhub update ${skillId}@${version}`;
  }
  return `clawdhub update ${skillId}`;
}

/**
 * Generate bulk update command
 */
export function getBulkUpdateCommand(skillIds: string[]): string {
  if (skillIds.length === 0) return '';
  if (skillIds.length === 1) return getUpdateCommand(skillIds[0]);
  return `clawdhub update ${skillIds.join(' ')}`;
}

/**
 * Analyze update impact (what might break)
 */
export function analyzeUpdateImpact(update: SkillUpdate, allSkills: SkillNode[]): {
  dependentSkills: string[];
  potentialIssues: string[];
  safeToUpdate: boolean;
} {
  const dependentSkills: string[] = [];
  const potentialIssues: string[] = [];

  // Find skills that depend on this one
  for (const skill of allSkills) {
    if (skill.connections.includes(update.skillId)) {
      dependentSkills.push(skill.name);
    }
  }

  // Check for potential issues
  if (update.breakingChanges) {
    potentialIssues.push('Contains breaking changes that may affect integrations');
  }

  if (update.newPermissions.length > 0) {
    potentialIssues.push(`Requests new permissions: ${update.newPermissions.join(', ')}`);
  }

  if (dependentSkills.length > 0) {
    potentialIssues.push(`${dependentSkills.length} skills depend on this`);
  }

  const safeToUpdate = !update.breakingChanges && 
    update.newPermissions.length === 0 && 
    dependentSkills.length === 0;

  return {
    dependentSkills,
    potentialIssues,
    safeToUpdate,
  };
}

export default {
  calculateVersionDiff,
  getAvailableUpdates,
  getChangeTypeInfo,
  getVersionJumpInfo,
  getImpactLevelInfo,
  getUpdateCommand,
  getBulkUpdateCommand,
  analyzeUpdateImpact,
};
