/**
 * Skill Catalog - Query the unified skill catalog
 */

import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

export interface CatalogSkill {
  id: string;
  name: string;
  description: string;
  source: 'openclaw' | 'local' | 'github';
  path: string;
  size: number;
  estimatedTokens: number;
  category: string;
  dependencies: string[];
  conflicts: string[];
}

export interface SkillCatalog {
  version: string;
  generated: string;
  totalSkills: number;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  skills: CatalogSkill[];
}

const DEFAULT_CATALOG_PATH = join(homedir(), 'clawd', 'compound', 'skill-catalog.json');

export async function loadCatalog(catalogPath?: string): Promise<SkillCatalog> {
  const path = catalogPath || DEFAULT_CATALOG_PATH;
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
}

export interface CatalogQueryOptions {
  category?: string;
  source?: string;
  search?: string;
  limit?: number;
  sortBy?: 'name' | 'tokens' | 'size';
  json?: boolean;
}

export function querySkills(catalog: SkillCatalog, options: CatalogQueryOptions = {}): CatalogSkill[] {
  let skills = [...catalog.skills];

  // Filter by category
  if (options.category) {
    skills = skills.filter(s => s.category === options.category);
  }

  // Filter by source
  if (options.source) {
    skills = skills.filter(s => s.source === options.source);
  }

  // Search in name and description
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    skills = skills.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  if (options.sortBy) {
    skills.sort((a, b) => {
      switch (options.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'tokens': return b.estimatedTokens - a.estimatedTokens;
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });
  }

  // Limit
  if (options.limit) {
    skills = skills.slice(0, options.limit);
  }

  return skills;
}

export function formatCatalogStats(catalog: SkillCatalog): string {
  const lines = [
    '📚 Skill Catalog Overview',
    `   Version: ${catalog.version}`,
    `   Generated: ${new Date(catalog.generated).toLocaleString()}`,
    '',
    `📦 Total Skills: ${catalog.totalSkills}`,
    '',
    '📁 By Source:',
  ];

  for (const [source, count] of Object.entries(catalog.bySource)) {
    const emoji = source === 'openclaw' ? '🦞' : source === 'local' ? '💻' : '🐙';
    lines.push(`   ${emoji} ${source}: ${count}`);
  }

  lines.push('');
  lines.push('🏷️ By Category:');

  const categoryEmojis: Record<string, string> = {
    productivity: '⚡',
    development: '💻',
    media: '🎬',
    communication: '💬',
    design: '🎨',
    marketing: '📢',
    security: '🔒',
    utility: '🔧',
  };

  for (const [category, count] of Object.entries(catalog.byCategory)) {
    const emoji = categoryEmojis[category] || '📦';
    lines.push(`   ${emoji} ${category}: ${count}`);
  }

  return lines.join('\n');
}

export function formatSkillList(skills: CatalogSkill[], options: { verbose?: boolean } = {}): string {
  if (skills.length === 0) {
    return '  (no skills found)';
  }

  const lines: string[] = [];

  for (const skill of skills) {
    const sourceEmoji = skill.source === 'openclaw' ? '🦞' : skill.source === 'local' ? '💻' : '🐙';
    
    if (options.verbose) {
      lines.push(`${sourceEmoji} ${skill.name} [${skill.category}]`);
      lines.push(`   ${skill.description || '(no description)'}`);
      lines.push(`   📊 Tokens: ~${skill.estimatedTokens} | Size: ${skill.size}`);
      lines.push('');
    } else {
      const desc = skill.description?.slice(0, 60) || '';
      const truncated = desc.length >= 60 ? desc + '...' : desc;
      lines.push(`  ${sourceEmoji} ${skill.name.padEnd(25)} ${truncated}`);
    }
  }

  return lines.join('\n');
}

export function getTokenBudgetStats(catalog: SkillCatalog): {
  totalTokens: number;
  heaviest: CatalogSkill[];
  lightest: CatalogSkill[];
  avgTokens: number;
} {
  const totalTokens = catalog.skills.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const avgTokens = Math.round(totalTokens / catalog.totalSkills);

  const sorted = [...catalog.skills].sort((a, b) => b.estimatedTokens - a.estimatedTokens);

  return {
    totalTokens,
    heaviest: sorted.slice(0, 5),
    lightest: sorted.slice(-5).reverse(),
    avgTokens,
  };
}

export function formatTokenBudget(catalog: SkillCatalog): string {
  const stats = getTokenBudgetStats(catalog);

  const lines = [
    '💰 Token Budget Analysis',
    '',
    `   Total Context Cost: ~${stats.totalTokens.toLocaleString()} tokens`,
    `   Average per Skill: ~${stats.avgTokens} tokens`,
    '',
    '🏋️ Heaviest Skills (token hogs):',
  ];

  for (const skill of stats.heaviest) {
    lines.push(`   ${skill.name}: ~${skill.estimatedTokens.toLocaleString()} tokens`);
  }

  lines.push('');
  lines.push('🪶 Lightest Skills (efficient):');

  for (const skill of stats.lightest) {
    lines.push(`   ${skill.name}: ~${skill.estimatedTokens.toLocaleString()} tokens`);
  }

  return lines.join('\n');
}
