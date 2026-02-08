// ═══════════════════════════════════════════════════════════
// Skill Analyzer - Generate visualization data
// ═══════════════════════════════════════════════════════════

import type { ScannedSkill } from './scanner.js';

// ═══════════════════════════════════════════════════════════
// Types (matching viz/src/types.ts)
// ═══════════════════════════════════════════════════════════

export type HealthStatus = 'healthy' | 'needsUpdate' | 'shouldRemove' | 'unused';
export type VulnerabilityLevel = 'low' | 'medium' | 'high' | 'critical';
export type TrustSource = 'official' | 'verified' | 'community' | 'unknown';

export interface VulnerabilityInfo {
  score: number;
  level: VulnerabilityLevel;
  permissions: string[];
  trustSource: TrustSource;
  handlesSensitiveData: boolean;
}

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  z: number;
  tokens: number;
  color: string;
  size: number;
  connections: string[];
  version?: string;
  latestVersion?: string;
  health: HealthStatus;
  connectionCount: number;
  vulnerability?: VulnerabilityInfo;
}

export interface SkillEdge {
  source: string;
  target: string;
  weight: number;
}

export interface SkillCluster {
  id: string;
  name: string;
  category: string;
  skills: string[];
  centroid: { x: number; y: number; z: number };
  density: number;
  color: string;
}

export interface VizMetrics {
  cosineSimilarities: Array<{ skill1: string; skill2: string; similarity: number }>;
  clusterDensity: number;
  overlapCoefficient: number;
  coverageScores: Record<string, number>;
  uniquenessIndex: number;
}

export interface VizData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  clusters: SkillCluster[];
  metrics: VizMetrics;
}

// ═══════════════════════════════════════════════════════════
// Category Colors (must match viz theme)
// ═══════════════════════════════════════════════════════════

const CATEGORY_COLORS: Record<string, string> = {
  productivity: '#94a3b8',
  development: '#a78bfa',
  media: '#fbbf24',
  communication: '#60a5fa',
  design: '#f472b6',
  marketing: '#fb7185',
  security: '#34d399',
  utility: '#818cf8',
  data: '#2dd4bf',
  devops: '#fb923c',
};

// ═══════════════════════════════════════════════════════════
// Known Skills Database (for version checking)
// ═══════════════════════════════════════════════════════════

const KNOWN_SKILLS: Record<string, { latestVersion: string; trustSource: TrustSource }> = {
  'prompt-guard': { latestVersion: '3.0.0', trustSource: 'official' },
  'github': { latestVersion: '2.0.0', trustSource: 'official' },
  'discord': { latestVersion: '2.3.0', trustSource: 'official' },
  'slack': { latestVersion: '1.5.2', trustSource: 'official' },
  'notion': { latestVersion: '3.0.0', trustSource: 'official' },
  'coding-agent': { latestVersion: '3.2.0', trustSource: 'verified' },
  'canvas': { latestVersion: '2.0.0', trustSource: 'official' },
  'obsidian': { latestVersion: '1.5.0', trustSource: 'verified' },
  'whisper': { latestVersion: '1.2.0', trustSource: 'official' },
  'himalaya': { latestVersion: '1.0.0', trustSource: 'community' },
  'skill-creator': { latestVersion: '1.8.5', trustSource: 'official' },
  '1password': { latestVersion: '1.1.0', trustSource: 'official' },
  'things': { latestVersion: '1.3.0', trustSource: 'verified' },
  'spotify': { latestVersion: '2.1.0', trustSource: 'verified' },
};

// ═══════════════════════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════════════════════

export function analyzeSkills(skills: ScannedSkill[]): VizData {
  // Build nodes
  const nodes: SkillNode[] = [];
  const categoryCount: Record<string, number> = {};
  
  const maxTokens = Math.max(...skills.map(s => s.tokens || 100), 1);
  
  for (const skill of skills) {
    const category = skill.category || 'utility';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
    
    const knownInfo = KNOWN_SKILLS[skill.id];
    const latestVersion = knownInfo?.latestVersion;
    const trustSource = knownInfo?.trustSource || 'unknown';
    
    const health = getHealthStatus(skill.version, latestVersion);
    const vulnerability = calculateVulnerability(
      skill.permissions || [],
      trustSource,
      skill.version,
      latestVersion
    );
    
    nodes.push({
      id: skill.id,
      name: skill.name,
      category,
      x: 0, y: 0, z: 0, // Will be positioned later
      tokens: skill.tokens || 100,
      color: CATEGORY_COLORS[category] || '#818cf8',
      size: ((skill.tokens || 100) / maxTokens) * 0.8 + 0.2,
      connections: [],
      version: skill.version,
      latestVersion,
      health,
      connectionCount: 0,
      vulnerability,
    });
  }
  
  // Generate edges based on similarity
  const edges = generateEdges(nodes);
  
  // Update connection counts
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source) {
      source.connectionCount++;
      source.connections.push(edge.target);
    }
    if (target) {
      target.connectionCount++;
      target.connections.push(edge.source);
    }
  }
  
  // Position nodes
  positionNodes(nodes);
  
  // Build clusters
  const clusters = buildClusters(nodes);
  
  // Calculate metrics
  const metrics = calculateMetrics(nodes, edges, categoryCount);
  
  return { nodes, edges, clusters, metrics };
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function getHealthStatus(version?: string, latestVersion?: string): HealthStatus {
  if (!version || !latestVersion) return 'healthy';
  if (version === latestVersion) return 'healthy';
  
  const [currMajor] = version.split('.').map(Number);
  const [latestMajor] = latestVersion.split('.').map(Number);
  
  if (latestMajor > currMajor) return 'needsUpdate';
  return 'needsUpdate';
}

function calculateVulnerability(
  permissions: string[],
  trustSource: TrustSource,
  version?: string,
  latestVersion?: string
): VulnerabilityInfo {
  let score = 0;
  
  // Permissions (0-25)
  if (permissions.includes('filesystem')) score += 10;
  if (permissions.includes('code-execution')) score += 10;
  if (permissions.includes('network')) score += 5;
  
  // Update status (0-25)
  if (version && latestVersion && version !== latestVersion) {
    const [currMajor] = version.split('.').map(Number);
    const [latestMajor] = latestVersion.split('.').map(Number);
    if (latestMajor > currMajor) score += 25;
    else score += 10;
  }
  
  // Trust source (0-25)
  switch (trustSource) {
    case 'unknown': score += 25; break;
    case 'community': score += 15; break;
    case 'verified': score += 5; break;
    case 'official': score += 0; break;
  }
  
  score = Math.min(100, score);
  
  let level: VulnerabilityLevel;
  if (score <= 25) level = 'low';
  else if (score <= 50) level = 'medium';
  else if (score <= 75) level = 'high';
  else level = 'critical';
  
  return {
    score,
    level,
    permissions,
    trustSource,
    handlesSensitiveData: permissions.length > 0,
  };
}

function generateEdges(nodes: SkillNode[]): SkillEdge[] {
  const edges: SkillEdge[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      
      let similarity = 0;
      
      // Same category
      if (n1.category === n2.category) {
        similarity += 0.5;
      }
      
      // Name similarity
      const words1 = n1.name.toLowerCase().split(/[\s-_]+/);
      const words2 = n2.name.toLowerCase().split(/[\s-_]+/);
      const common = words1.filter(w => words2.some(w2 => w.includes(w2) || w2.includes(w)));
      similarity += (common.length / Math.max(words1.length, words2.length)) * 0.3;
      
      if (similarity > 0.3) {
        edges.push({
          source: n1.id,
          target: n2.id,
          weight: Math.min(similarity, 1),
        });
      }
    }
  }
  
  return edges;
}

function positionNodes(nodes: SkillNode[]): void {
  const categoryNodes = new Map<string, SkillNode[]>();
  for (const node of nodes) {
    if (!categoryNodes.has(node.category)) {
      categoryNodes.set(node.category, []);
    }
    categoryNodes.get(node.category)!.push(node);
  }
  
  const categories = Array.from(categoryNodes.keys());
  const numCategories = categories.length;
  const maxConnections = Math.max(...nodes.map(n => n.connectionCount), 1);
  
  for (let catIdx = 0; catIdx < numCategories; catIdx++) {
    const category = categories[catIdx];
    const catNodes = categoryNodes.get(category)!;
    const angle = (catIdx / numCategories) * Math.PI * 2;
    
    for (let i = 0; i < catNodes.length; i++) {
      const node = catNodes[i];
      const centralityFactor = 1 - (node.connectionCount / maxConnections);
      const baseRadius = 2 + centralityFactor * 4;
      const radius = baseRadius + Math.random() * 1;
      
      node.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5;
      node.y = (i - catNodes.length / 2) * 0.8 + (Math.random() - 0.5);
      node.z = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5;
    }
  }
}

function buildClusters(nodes: SkillNode[]): SkillCluster[] {
  const categoryNodes = new Map<string, SkillNode[]>();
  for (const node of nodes) {
    if (!categoryNodes.has(node.category)) {
      categoryNodes.set(node.category, []);
    }
    categoryNodes.get(node.category)!.push(node);
  }
  
  const clusters: SkillCluster[] = [];
  for (const [category, catNodes] of categoryNodes) {
    clusters.push({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      category,
      skills: catNodes.map(n => n.id),
      centroid: {
        x: catNodes.reduce((s, n) => s + n.x, 0) / catNodes.length,
        y: catNodes.reduce((s, n) => s + n.y, 0) / catNodes.length,
        z: catNodes.reduce((s, n) => s + n.z, 0) / catNodes.length,
      },
      density: catNodes.length / nodes.length,
      color: CATEGORY_COLORS[category] || '#818cf8',
    });
  }
  
  return clusters;
}

function calculateMetrics(
  nodes: SkillNode[],
  edges: SkillEdge[],
  categoryCount: Record<string, number>
): VizMetrics {
  const cosineSimilarities = edges
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20)
    .map(e => ({
      skill1: e.source,
      skill2: e.target,
      similarity: e.weight,
    }));
  
  const totalTokens = nodes.reduce((s, n) => s + n.tokens, 0);
  const coverageScores: Record<string, number> = {};
  
  for (const [cat, count] of Object.entries(categoryCount)) {
    const catTokens = nodes
      .filter(n => n.category === cat)
      .reduce((s, n) => s + n.tokens, 0);
    coverageScores[cat] = Math.round((catTokens / totalTokens) * 100);
  }
  
  const clusterDensity = edges.length > 0
    ? edges.reduce((s, e) => s + e.weight, 0) / edges.length
    : 0;
  
  return {
    cosineSimilarities,
    clusterDensity: Math.round(clusterDensity * 100) / 100,
    overlapCoefficient: Math.round(clusterDensity * 100) / 100,
    coverageScores,
    uniquenessIndex: Math.round((1 - clusterDensity * 0.5) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════
// URL Encoding
// ═══════════════════════════════════════════════════════════

export interface CompressedData {
  v: number;
  t: number;
  s: Array<{
    i: string;  // id
    n: string;  // name
    c: string;  // category
    t: number;  // tokens
    v?: string; // version
  }>;
}

export function encodeForUrl(data: VizData): string {
  // Compress to minimal format
  const compressed: CompressedData = {
    v: 1,
    t: Date.now(),
    s: data.nodes.map(n => ({
      i: n.id,
      n: n.name,
      c: n.category,
      t: n.tokens,
      v: n.version,
    })),
  };
  
  const json = JSON.stringify(compressed);
  // Use base64url encoding (URL-safe)
  return Buffer.from(json).toString('base64url');
}
