/**
 * SkillRespec Metrics Engine
 * Technical analysis for skill portfolios
 */

import type { CatalogSkill, AnalysisMetrics, SimilarityPair, VizMetrics, SkillCluster } from './types.js';

// Category color palette (neon theme)
export const CATEGORY_COLORS: Record<string, string> = {
  productivity: '#00ffff',   // cyan
  development: '#ff00ff',    // magenta
  media: '#ffff00',          // yellow
  communication: '#00ff00',  // green
  design: '#ff6b00',         // orange
  marketing: '#ff0066',      // pink
  security: '#ff0000',       // red
  utility: '#6666ff',        // purple
};

/**
 * Calculate cosine similarity between two skill descriptions
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  
  const allWords = new Set([...words1.keys(), ...words2.keys()]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const word of allWords) {
    const v1 = words1.get(word) || 0;
    const v2 = words2.get(word) || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Simple tokenization with TF weighting
 */
function tokenize(text: string): Map<string, number> {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  
  // Normalize
  const max = Math.max(...freq.values(), 1);
  for (const [word, count] of freq) {
    freq.set(word, count / max);
  }
  
  return freq;
}

/**
 * Find top similar skill pairs
 */
export function findSimilarPairs(skills: CatalogSkill[], topN: number = 20): SimilarityPair[] {
  const pairs: SimilarityPair[] = [];
  
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const text1 = `${skills[i].name} ${skills[i].description}`;
      const text2 = `${skills[j].name} ${skills[j].description}`;
      const similarity = cosineSimilarity(text1, text2);
      
      if (similarity > 0.3) { // Threshold
        pairs.push({
          skill1: skills[i].id,
          skill2: skills[j].id,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
    }
  }
  
  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
}

/**
 * Calculate cluster density
 */
export function calculateClusterDensity(skills: CatalogSkill[]): number {
  const categories = new Map<string, number>();
  for (const skill of skills) {
    categories.set(skill.category, (categories.get(skill.category) || 0) + 1);
  }
  
  // Gini coefficient for category distribution
  const values = [...categories.values()].sort((a, b) => a - b);
  const n = values.length;
  if (n === 0) return 0;
  
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    sumXY += (2 * (i + 1) - n - 1) * values[i];
  }
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const gini = sumXY / (n * n * mean);
  
  // Convert to density (1 - gini = more evenly distributed)
  return Math.round((1 - gini) * 100) / 100;
}

/**
 * Calculate overlap coefficient
 * How much skills share functionality
 */
export function calculateOverlap(skills: CatalogSkill[]): number {
  const pairs = findSimilarPairs(skills, 100);
  const avgSimilarity = pairs.length > 0
    ? pairs.reduce((sum, p) => sum + p.similarity, 0) / pairs.length
    : 0;
  
  return Math.round(avgSimilarity * 100) / 100;
}

/**
 * Coverage score per category
 */
export function calculateCoverage(skills: CatalogSkill[]): Record<string, number> {
  const categoryTokens = new Map<string, number>();
  let totalTokens = 0;
  
  for (const skill of skills) {
    const tokens = skill.estimatedTokens || 0;
    categoryTokens.set(skill.category, (categoryTokens.get(skill.category) || 0) + tokens);
    totalTokens += tokens;
  }
  
  const coverage: Record<string, number> = {};
  for (const [cat, tokens] of categoryTokens) {
    coverage[cat] = Math.round((tokens / totalTokens) * 100);
  }
  
  return coverage;
}

/**
 * Uniqueness index
 * Higher = more diverse skills, Lower = redundant skills
 */
export function calculateUniqueness(skills: CatalogSkill[]): number {
  const pairs = findSimilarPairs(skills, skills.length * skills.length);
  const highSimilarity = pairs.filter(p => p.similarity > 0.5).length;
  const possiblePairs = (skills.length * (skills.length - 1)) / 2;
  
  if (possiblePairs === 0) return 1;
  
  // Uniqueness = 1 - (high similarity pairs / all pairs)
  return Math.round((1 - highSimilarity / possiblePairs) * 100) / 100;
}

/**
 * Calculate all metrics
 */
export function calculateMetrics(skills: CatalogSkill[]): AnalysisMetrics {
  const totalTokens = skills.reduce((sum, s) => sum + (s.estimatedTokens || 0), 0);
  
  return {
    cosineSimilarities: findSimilarPairs(skills, 20),
    clusterDensity: calculateClusterDensity(skills),
    overlapCoefficient: calculateOverlap(skills),
    coverageScores: calculateCoverage(skills),
    uniquenessIndex: calculateUniqueness(skills),
    totalTokens,
    avgTokensPerSkill: Math.round(totalTokens / skills.length),
  };
}

/**
 * Generate 3D positions using simple t-SNE-like algorithm
 * (Simplified for performance)
 */
export function generatePositions(skills: CatalogSkill[]): { x: number; y: number; z: number }[] {
  const n = skills.length;
  const positions: { x: number; y: number; z: number }[] = [];
  
  // Initialize with category-based clustering
  const categoryIndex = new Map<string, number>();
  let catIdx = 0;
  for (const skill of skills) {
    if (!categoryIndex.has(skill.category)) {
      categoryIndex.set(skill.category, catIdx++);
    }
  }
  
  const numCategories = categoryIndex.size;
  
  for (let i = 0; i < n; i++) {
    const skill = skills[i];
    const catI = categoryIndex.get(skill.category) || 0;
    
    // Position in a spiral per category
    const angle = (catI / numCategories) * Math.PI * 2;
    const radius = 3 + Math.random() * 2;
    const skillIndex = skills.filter((s, j) => j < i && s.category === skill.category).length;
    const verticalSpread = (skillIndex - 5) * 0.5;
    
    positions.push({
      x: Math.cos(angle) * radius + (Math.random() - 0.5),
      y: verticalSpread + (Math.random() - 0.5),
      z: Math.sin(angle) * radius + (Math.random() - 0.5),
    });
  }
  
  return positions;
}

/**
 * Build clusters from skills
 */
export function buildClusters(skills: CatalogSkill[]): SkillCluster[] {
  const categorySkills = new Map<string, CatalogSkill[]>();
  
  for (const skill of skills) {
    if (!categorySkills.has(skill.category)) {
      categorySkills.set(skill.category, []);
    }
    categorySkills.get(skill.category)!.push(skill);
  }
  
  const clusters: SkillCluster[] = [];
  const positions = generatePositions(skills);
  
  for (const [category, catSkills] of categorySkills) {
    const skillIds = catSkills.map(s => s.id);
    const skillPositions = skills
      .map((s, i) => ({ s, p: positions[i] }))
      .filter(sp => sp.s.category === category)
      .map(sp => sp.p);
    
    const centroid = {
      x: skillPositions.reduce((sum, p) => sum + p.x, 0) / skillPositions.length,
      y: skillPositions.reduce((sum, p) => sum + p.y, 0) / skillPositions.length,
      z: skillPositions.reduce((sum, p) => sum + p.z, 0) / skillPositions.length,
    };
    
    clusters.push({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      category,
      skills: skillIds,
      centroid,
      density: catSkills.length / skills.length,
      color: CATEGORY_COLORS[category] || '#ffffff',
    });
  }
  
  return clusters;
}
