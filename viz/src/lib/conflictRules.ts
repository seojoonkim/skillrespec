// ═══════════════════════════════════════════════════════════
// Smart Conflict Resolution - Detect and resolve skill conflicts
// ═══════════════════════════════════════════════════════════

import type { SkillNode } from '../types';
import { KNOWN_SKILLS } from '../data/knownSkills';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ConflictType = 
  | 'same_tool'        // Multiple skills using same external tool
  | 'config_clash'     // Conflicting configuration (e.g., formatters)
  | 'port_conflict'    // Same port usage
  | 'permission_overlap' // Overlapping high-risk permissions
  | 'resource_competition'; // Competing for same resources

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SkillConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  skills: string[]; // Skill IDs involved
  skillNames: string[]; // Human-readable names
  description: string;
  resolution: ConflictResolution[];
  impact: string;
}

export interface ConflictResolution {
  type: 'disable' | 'configure' | 'replace' | 'merge';
  skillId?: string;
  description: string;
  command?: string;
  automatic?: boolean; // Can be auto-resolved
}

export interface ConflictRule {
  id: string;
  name: string;
  description: string;
  check: (skills: SkillNode[]) => SkillConflict[];
}

// ═══════════════════════════════════════════════════════════
// Tool Categories for Conflict Detection
// ═══════════════════════════════════════════════════════════

const TOOL_GROUPS: Record<string, string[]> = {
  'github': ['github', 'gh', 'git-advanced'],
  'formatter': ['prettier', 'eslint', 'biome', 'rome'],
  'database': ['sql-query', 'postgres', 'mysql', 'mongodb'],
  'container': ['docker-basics', 'podman', 'kubernetes'],
  'notes': ['obsidian', 'notion', 'bear-notes', 'apple-notes'],
  'task': ['things', 'todoist', 'reminders', 'omnifocus'],
  'email': ['himalaya', 'mail', 'outlook'],
  'messaging': ['slack', 'discord', 'telegram', 'wacli'],
  'llm': ['gemini', 'oracle', 'openai', 'anthropic'],
  'search': ['web-search', 'brave-search', 'google'],
};

const PORT_USAGE: Record<string, number> = {
  'n8n-automation': 5678,
  'web-server': 3000,
  'dev-server': 3000,
  'api-server': 8080,
  'docker-basics': 2375,
};

const FORMATTER_CONFIGS: Record<string, string> = {
  'prettier': '.prettierrc',
  'eslint': '.eslintrc',
  'biome': 'biome.json',
};

// ═══════════════════════════════════════════════════════════
// Conflict Rules
// ═══════════════════════════════════════════════════════════

const conflictRules: ConflictRule[] = [
  // ───────────────────────────────────────────────────────────
  // Same Tool Conflict
  // ───────────────────────────────────────────────────────────
  {
    id: 'same_tool',
    name: 'Same Tool Usage',
    description: 'Multiple skills using the same external tool',
    check: (skills: SkillNode[]): SkillConflict[] => {
      const conflicts: SkillConflict[] = [];
      const skillIds = new Set(skills.map(s => s.id.toLowerCase()));

      for (const [toolName, relatedSkills] of Object.entries(TOOL_GROUPS)) {
        const matchingSkills = relatedSkills.filter(id => skillIds.has(id));
        
        if (matchingSkills.length > 1) {
          const skillNodes = matchingSkills.map(id => 
            skills.find(s => s.id.toLowerCase() === id)!
          );

          conflicts.push({
            id: `same_tool_${toolName}`,
            type: 'same_tool',
            severity: 'medium',
            skills: matchingSkills,
            skillNames: skillNodes.map(s => s.name),
            description: `Multiple skills access the same ${toolName} functionality`,
            impact: 'May cause duplicated operations or conflicting behaviors',
            resolution: [
              {
                type: 'disable',
                skillId: matchingSkills[1],
                description: `Disable "${skillNodes[1]?.name}" to avoid conflicts`,
                command: `clawdhub disable ${matchingSkills[1]}`,
              },
              {
                type: 'configure',
                description: 'Configure skills to use different ${toolName} instances',
              },
            ],
          });
        }
      }

      return conflicts;
    },
  },

  // ───────────────────────────────────────────────────────────
  // Config Clash
  // ───────────────────────────────────────────────────────────
  {
    id: 'config_clash',
    name: 'Configuration Clash',
    description: 'Skills with conflicting configuration requirements',
    check: (skills: SkillNode[]): SkillConflict[] => {
      const conflicts: SkillConflict[] = [];
      const skillIds = new Set(skills.map(s => s.id.toLowerCase()));
      const formatterSkills = Object.keys(FORMATTER_CONFIGS).filter(id => skillIds.has(id));

      if (formatterSkills.length > 1) {
        const skillNodes = formatterSkills.map(id =>
          skills.find(s => s.id.toLowerCase() === id)!
        );

        conflicts.push({
          id: 'formatter_clash',
          type: 'config_clash',
          severity: 'high',
          skills: formatterSkills,
          skillNames: skillNodes.map(s => s.name),
          description: 'Multiple code formatters may produce different outputs',
          impact: 'Inconsistent code formatting, potential format wars',
          resolution: [
            {
              type: 'disable',
              description: 'Keep only one formatter active',
            },
            {
              type: 'configure',
              description: 'Configure formatters to use compatible rules',
            },
            {
              type: 'replace',
              description: 'Use a unified tool like Biome that handles both',
            },
          ],
        });
      }

      return conflicts;
    },
  },

  // ───────────────────────────────────────────────────────────
  // Port Conflict
  // ───────────────────────────────────────────────────────────
  {
    id: 'port_conflict',
    name: 'Port Conflict',
    description: 'Skills attempting to use the same network port',
    check: (skills: SkillNode[]): SkillConflict[] => {
      const conflicts: SkillConflict[] = [];
      const skillIds = new Set(skills.map(s => s.id.toLowerCase()));
      const portMap = new Map<number, string[]>();

      for (const [skillId, port] of Object.entries(PORT_USAGE)) {
        if (skillIds.has(skillId)) {
          if (!portMap.has(port)) {
            portMap.set(port, []);
          }
          portMap.get(port)!.push(skillId);
        }
      }

      for (const [port, skillsOnPort] of portMap) {
        if (skillsOnPort.length > 1) {
          const skillNodes = skillsOnPort.map(id =>
            skills.find(s => s.id.toLowerCase() === id)!
          );

          conflicts.push({
            id: `port_${port}`,
            type: 'port_conflict',
            severity: 'critical',
            skills: skillsOnPort,
            skillNames: skillNodes.map(s => s.name),
            description: `Multiple skills trying to use port ${port}`,
            impact: 'Only one skill can bind to the port, others will fail',
            resolution: [
              {
                type: 'configure',
                description: `Configure one skill to use a different port`,
                automatic: false,
              },
              {
                type: 'disable',
                skillId: skillsOnPort[1],
                description: `Disable "${skillNodes[1]?.name}"`,
                command: `clawdhub disable ${skillsOnPort[1]}`,
              },
            ],
          });
        }
      }

      return conflicts;
    },
  },

  // ───────────────────────────────────────────────────────────
  // Permission Overlap
  // ───────────────────────────────────────────────────────────
  {
    id: 'permission_overlap',
    name: 'High-Risk Permission Overlap',
    description: 'Multiple skills with dangerous permission combinations',
    check: (skills: SkillNode[]): SkillConflict[] => {
      const conflicts: SkillConflict[] = [];
      const dangerousPerms = ['code-execution', 'filesystem'];
      
      // Find skills with dangerous permissions
      const dangerousSkills = skills.filter(skill => {
        const perms = skill.vulnerability?.permissions || [];
        return dangerousPerms.some(dp => perms.includes(dp));
      });

      // Check for skills that have BOTH code-execution and network
      const codeExecNetwork = skills.filter(skill => {
        const perms = skill.vulnerability?.permissions || [];
        return perms.includes('code-execution') && perms.includes('network');
      });

      if (codeExecNetwork.length > 1) {
        conflicts.push({
          id: 'code_exec_network_multiple',
          type: 'permission_overlap',
          severity: 'high',
          skills: codeExecNetwork.map(s => s.id),
          skillNames: codeExecNetwork.map(s => s.name),
          description: 'Multiple skills with code execution + network access',
          impact: 'Increased attack surface for remote code execution',
          resolution: [
            {
              type: 'disable',
              description: 'Disable unused skills with these permissions',
            },
            {
              type: 'configure',
              description: 'Apply strict sandboxing policies',
            },
          ],
        });
      }

      // Skills with filesystem access handling sensitive data
      const sensitiveFilesystem = skills.filter(skill => {
        const perms = skill.vulnerability?.permissions || [];
        return perms.includes('filesystem') && skill.vulnerability?.handlesSensitiveData;
      });

      if (sensitiveFilesystem.length > 2) {
        conflicts.push({
          id: 'sensitive_filesystem_multiple',
          type: 'permission_overlap',
          severity: 'medium',
          skills: sensitiveFilesystem.map(s => s.id),
          skillNames: sensitiveFilesystem.map(s => s.name),
          description: 'Multiple skills accessing filesystem with sensitive data',
          impact: 'Data exposure risk if any skill is compromised',
          resolution: [
            {
              type: 'configure',
              description: 'Limit filesystem access to specific directories',
            },
          ],
        });
      }

      return conflicts;
    },
  },

  // ───────────────────────────────────────────────────────────
  // Resource Competition
  // ───────────────────────────────────────────────────────────
  {
    id: 'resource_competition',
    name: 'Resource Competition',
    description: 'Skills competing for limited resources',
    check: (skills: SkillNode[]): SkillConflict[] => {
      const conflicts: SkillConflict[] = [];
      const skillIds = new Set(skills.map(s => s.id.toLowerCase()));

      // Multiple messaging apps competing for attention
      const messagingSkills = TOOL_GROUPS['messaging'].filter(id => skillIds.has(id));
      if (messagingSkills.length >= 3) {
        const skillNodes = messagingSkills.map(id =>
          skills.find(s => s.id.toLowerCase() === id)!
        );

        conflicts.push({
          id: 'messaging_overload',
          type: 'resource_competition',
          severity: 'low',
          skills: messagingSkills,
          skillNames: skillNodes.map(s => s.name),
          description: 'Many messaging platforms may fragment communication',
          impact: 'Attention split, potential message confusion',
          resolution: [
            {
              type: 'configure',
              description: 'Set up message routing rules to consolidate',
            },
            {
              type: 'disable',
              description: 'Disable less-used platforms',
            },
          ],
        });
      }

      // Multiple note-taking apps
      const noteSkills = TOOL_GROUPS['notes'].filter(id => skillIds.has(id));
      if (noteSkills.length >= 2) {
        const skillNodes = noteSkills.map(id =>
          skills.find(s => s.id.toLowerCase() === id)!
        );

        conflicts.push({
          id: 'notes_fragmentation',
          type: 'resource_competition',
          severity: 'low',
          skills: noteSkills,
          skillNames: skillNodes.map(s => s.name),
          description: 'Multiple note-taking apps may cause knowledge fragmentation',
          impact: 'Information scattered across platforms',
          resolution: [
            {
              type: 'configure',
              description: 'Choose one as primary, others for specific use cases',
            },
            {
              type: 'merge',
              description: 'Set up sync between note platforms',
            },
          ],
        });
      }

      return conflicts;
    },
  },
];

// ═══════════════════════════════════════════════════════════
// Main Detection Engine
// ═══════════════════════════════════════════════════════════

/**
 * Run all conflict detection rules
 */
export function detectConflicts(skills: SkillNode[]): SkillConflict[] {
  const allConflicts: SkillConflict[] = [];

  for (const rule of conflictRules) {
    try {
      const found = rule.check(skills);
      allConflicts.push(...found);
    } catch (err) {
      console.error(`Conflict rule "${rule.id}" failed:`, err);
    }
  }

  // Sort by severity
  const severityOrder: Record<ConflictSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return allConflicts.sort((a, b) => 
    severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Get conflict severity info
 */
export function getSeverityInfo(severity: ConflictSeverity): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  switch (severity) {
    case 'critical':
      return { 
        icon: '🚨', 
        label: 'Critical', 
        color: '#ef4444', 
        bgColor: 'rgba(239, 68, 68, 0.1)' 
      };
    case 'high':
      return { 
        icon: '⚠️', 
        label: 'High', 
        color: '#f97316', 
        bgColor: 'rgba(249, 115, 22, 0.1)' 
      };
    case 'medium':
      return { 
        icon: '⚡', 
        label: 'Medium', 
        color: '#fbbf24', 
        bgColor: 'rgba(251, 191, 36, 0.1)' 
      };
    case 'low':
      return { 
        icon: '💡', 
        label: 'Low', 
        color: '#60a5fa', 
        bgColor: 'rgba(96, 165, 250, 0.1)' 
      };
  }
}

/**
 * Get conflict type info
 */
export function getConflictTypeInfo(type: ConflictType): {
  icon: string;
  label: string;
} {
  switch (type) {
    case 'same_tool':
      return { icon: '🔧', label: 'Same Tool' };
    case 'config_clash':
      return { icon: '⚙️', label: 'Config Clash' };
    case 'port_conflict':
      return { icon: '🔌', label: 'Port Conflict' };
    case 'permission_overlap':
      return { icon: '🔐', label: 'Permission Overlap' };
    case 'resource_competition':
      return { icon: '📊', label: 'Resource Competition' };
  }
}

// ═══════════════════════════════════════════════════════════
// Safe Combinations
// ═══════════════════════════════════════════════════════════

export interface SafeCombination {
  name: string;
  skills: string[];
  description: string;
  category: string;
}

const SAFE_COMBINATIONS: SafeCombination[] = [
  {
    name: 'Secure Developer',
    skills: ['github', 'coding-agent', 'prompt-guard'],
    description: 'Safe code development with security protection',
    category: 'development',
  },
  {
    name: 'Productive Writer',
    skills: ['obsidian', 'whisper', 'copywriting'],
    description: 'Writing workflow without conflicts',
    category: 'productivity',
  },
  {
    name: 'Communication Hub',
    skills: ['slack', 'himalaya'],
    description: 'Business communication without overlap',
    category: 'communication',
  },
  {
    name: 'Media Creator',
    skills: ['canvas', 'peekaboo', 'tts'],
    description: 'Visual and audio content creation',
    category: 'media',
  },
  {
    name: 'Security Analyst',
    skills: ['prompt-guard', 'hivefence', 'healthcheck'],
    description: 'Comprehensive security stack',
    category: 'security',
  },
];

/**
 * Get safe skill combinations that won't conflict
 */
export function getSafeCombinations(currentSkills: SkillNode[]): SafeCombination[] {
  const currentIds = new Set(currentSkills.map(s => s.id.toLowerCase()));
  
  return SAFE_COMBINATIONS.filter(combo => {
    // Only suggest if at least one skill is installed
    return combo.skills.some(id => currentIds.has(id));
  });
}

/**
 * Check if a skill would conflict with existing skills
 */
export function wouldConflict(
  newSkillId: string, 
  existingSkills: SkillNode[]
): SkillConflict[] {
  // Create a temporary node for the new skill
  const knownSkill = KNOWN_SKILLS[newSkillId.toLowerCase()];
  const tempNode: SkillNode = {
    id: newSkillId,
    name: knownSkill?.name || newSkillId,
    category: knownSkill?.category || 'unknown',
    x: 0, y: 0, z: 0,
    tokens: knownSkill?.estimatedTokens || 0,
    color: '#888',
    size: 1,
    connections: [],
    health: 'healthy',
    connectionCount: 0,
    vulnerability: knownSkill ? {
      score: 50,
      level: 'low',
      permissions: knownSkill.permissions || [],
      trustSource: knownSkill.trustSource,
      handlesSensitiveData: knownSkill.handlesSensitiveData || false,
    } : undefined,
  };

  const allSkills = [...existingSkills, tempNode];
  const allConflicts = detectConflicts(allSkills);

  // Return only conflicts involving the new skill
  return allConflicts.filter(c => 
    c.skills.some(id => id.toLowerCase() === newSkillId.toLowerCase())
  );
}

export default {
  detectConflicts,
  getSeverityInfo,
  getConflictTypeInfo,
  getSafeCombinations,
  wouldConflict,
};
