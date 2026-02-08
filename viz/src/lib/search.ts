// ═══════════════════════════════════════════════════════════
// Fuzzy Search - Natural language skill search with Fuse.js
// ═══════════════════════════════════════════════════════════

import Fuse from 'fuse.js';
import type { SkillNode } from '../types';
import { KNOWN_SKILLS } from '../data/knownSkills';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SearchableSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  aliases: string[];
  permissions: string[];
}

export interface SearchResult {
  item: SearchableSkill;
  score: number;
  matches: Fuse.FuseResultMatch[];
}

// ═══════════════════════════════════════════════════════════
// Build Search Index
// ═══════════════════════════════════════════════════════════

function buildSearchableSkills(): SearchableSkill[] {
  return Object.entries(KNOWN_SKILLS).map(([id, skill]) => ({
    id,
    name: skill.name,
    category: skill.category,
    description: skill.description || '',
    aliases: skill.aliases || [],
    permissions: skill.permissions || [],
  }));
}

// Fuse.js configuration for optimal fuzzy matching
const fuseOptions: Fuse.IFuseOptions<SearchableSkill> = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'description', weight: 0.25 },
    { name: 'category', weight: 0.15 },
    { name: 'aliases', weight: 0.15 },
    { name: 'permissions', weight: 0.05 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4, // 0 = exact match, 1 = match anything
  ignoreLocation: true,
  minMatchCharLength: 2,
  findAllMatches: true,
};

// ═══════════════════════════════════════════════════════════
// Search Engine Class
// ═══════════════════════════════════════════════════════════

class SkillSearchEngine {
  private fuse: Fuse<SearchableSkill>;
  private skills: SearchableSkill[];

  constructor() {
    this.skills = buildSearchableSkills();
    this.fuse = new Fuse(this.skills, fuseOptions);
  }

  /**
   * Search skills with natural language query
   */
  search(query: string, limit = 10): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.fuse.search(query, { limit });
    
    return results.map(result => ({
      item: result.item,
      score: 1 - (result.score || 0), // Convert to 0-1 where 1 is best
      matches: result.matches || [],
    }));
  }

  /**
   * Filter existing nodes by search query
   */
  filterNodes(nodes: SkillNode[], query: string): SkillNode[] {
    if (!query.trim()) {
      return nodes;
    }

    const searchResults = this.search(query, 50);
    const matchingIds = new Set(searchResults.map(r => r.item.id));

    return nodes.filter(node => matchingIds.has(node.id));
  }

  /**
   * Get highlighted text with match ranges
   */
  getHighlightedText(text: string, matches: Fuse.FuseResultMatch[]): string {
    if (!matches.length) return text;

    // Find matches for this text
    const textMatches = matches.filter(m => 
      m.value?.toLowerCase() === text.toLowerCase()
    );

    if (!textMatches.length || !textMatches[0].indices) {
      return text;
    }

    // Build highlighted string
    let result = '';
    let lastIndex = 0;
    const indices = textMatches[0].indices;

    for (const [start, end] of indices) {
      result += text.slice(lastIndex, start);
      result += `<mark>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    }
    result += text.slice(lastIndex);

    return result;
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set(this.skills.map(s => s.category));
    return Array.from(categories).sort();
  }

  /**
   * Get skills by category
   */
  getByCategory(category: string): SearchableSkill[] {
    return this.skills.filter(s => s.category === category);
  }

  /**
   * Reload skills (if KNOWN_SKILLS updates)
   */
  reload(): void {
    this.skills = buildSearchableSkills();
    this.fuse = new Fuse(this.skills, fuseOptions);
  }
}

// Singleton instance
let searchEngine: SkillSearchEngine | null = null;

export function getSearchEngine(): SkillSearchEngine {
  if (!searchEngine) {
    searchEngine = new SkillSearchEngine();
  }
  return searchEngine;
}

// ═══════════════════════════════════════════════════════════
// Quick Search Hook Helper
// ═══════════════════════════════════════════════════════════

export function searchSkills(query: string, limit = 10): SearchResult[] {
  return getSearchEngine().search(query, limit);
}

export function filterSkillNodes(nodes: SkillNode[], query: string): SkillNode[] {
  return getSearchEngine().filterNodes(nodes, query);
}
