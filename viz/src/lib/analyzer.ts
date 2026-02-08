// ═══════════════════════════════════════════════════════════
// SkillRespec Analyzer - User Skill Analysis Engine
// ═══════════════════════════════════════════════════════════

import { KNOWN_SKILLS, findSkill, getSkillId, getAllCategories } from '../data/knownSkills';
import { theme } from '../styles/theme';
import type { 
  VizData, 
  SkillNode, 
  SkillEdge, 
  SkillCluster, 
  VizMetrics,
  HealthStatus,
  VulnerabilityInfo,
  VulnerabilityLevel,
  TrustSource,
} from '../types';
import type { 
  Recommendations, 
  DiagnosisItem, 
  InstallItem, 
  RemoveItem, 
  UpdateItem, 
  SecurityItem 
} from '../data/recommendations';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SkillInput {
  name: string;
  version?: string;
  path?: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  data: VizData;
  recommendations: Recommendations;
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalSkills: number;
  knownSkills: number;
  unknownSkills: number;
  totalTokens: number;
  healthScore: number;
  categories: Record<string, number>;
  outdatedCount: number;
  criticalSecurityCount: number;
}

// ═══════════════════════════════════════════════════════════
// Input Parsing
// ═══════════════════════════════════════════════════════════

/**
 * Parse various input formats into SkillInput array
 */
export function parseSkillInput(input: string): SkillInput[] {
  const trimmed = input.trim();
  
  // Try JSON array first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'string') {
            return parseSkillString(item);
          }
          if (typeof item === 'object' && item.name) {
            return {
              name: item.name,
              version: item.version,
              path: item.path,
            };
          }
          return { name: String(item) };
        });
      }
    } catch {
      // Not valid JSON, try other formats
    }
  }
  
  // Try line-by-line parsing
  const lines = trimmed.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.startsWith('#')) // Ignore comments
    .filter(line => !line.startsWith('total')); // Ignore ls -l totals
  
  return lines.map(parseSkillString);
}

/**
 * Parse a single skill string (handles various formats)
 */
function parseSkillString(input: string): SkillInput {
  const trimmed = input.trim();
  
  // Handle ls -l output format: "drwxr-xr-x  5 user  staff  160 Feb  1 12:34 skill-name"
  const lsMatch = trimmed.match(/^[d-][rwx-]{9}\s+\d+\s+\S+\s+\S+\s+\d+\s+\w+\s+\d+\s+[\d:]+\s+(.+)$/);
  if (lsMatch) {
    return parseSkillString(lsMatch[1]);
  }
  
  // Handle version suffix: "prompt-guard@2.8.0" or "prompt-guard v2.8.0"
  const versionMatch = trimmed.match(/^(.+?)[@\s]+v?(\d+\.\d+\.\d+)$/);
  if (versionMatch) {
    return {
      name: versionMatch[1].trim(),
      version: versionMatch[2],
    };
  }
  
  // Handle path: "/path/to/skills/prompt-guard"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const name = parts[parts.length - 1];
    return {
      name,
      path: trimmed,
    };
  }
  
  // Simple name
  return { name: trimmed };
}

// ═══════════════════════════════════════════════════════════
// Vulnerability Scoring
// ═══════════════════════════════════════════════════════════

function calculateVulnerabilityScore(
  permissions: string[],
  trustSource: TrustSource,
  handlesSensitiveData: boolean,
  version?: string,
  latestVersion?: string
): { score: number; level: VulnerabilityLevel } {
  let score = 0;

  // A. Permissions (0-25)
  if (permissions.includes('filesystem')) score += 10;
  if (permissions.includes('code-execution')) score += 10;
  if (permissions.includes('network')) score += 5;

  // B. Update status (0-25)
  if (version && latestVersion && version !== latestVersion) {
    const [currMajor, currMinor] = version.split('.').map(Number);
    const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);
    
    if (latestMajor > currMajor) {
      score += 25;
    } else if (latestMinor > currMinor) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // C. Trust source (0-25)
  switch (trustSource) {
    case 'unknown': score += 25; break;
    case 'community': score += 15; break;
    case 'verified': score += 5; break;
    case 'official': score += 0; break;
  }

  // D. Sensitive data (0-25)
  if (handlesSensitiveData) {
    score += 15;
  }

  score = Math.min(100, score);

  let level: VulnerabilityLevel;
  if (score <= 25) level = 'low';
  else if (score <= 50) level = 'medium';
  else if (score <= 75) level = 'high';
  else level = 'critical';

  return { score, level };
}

// ═══════════════════════════════════════════════════════════
// Analysis Engine
// ═══════════════════════════════════════════════════════════

export function analyzeSkills(inputs: SkillInput[]): AnalysisResult {
  const id = generateResultId();
  const createdAt = new Date().toISOString();
  
  // Deduplicate inputs
  const uniqueInputs = deduplicateInputs(inputs);
  
  // Build skill nodes
  const nodes: SkillNode[] = [];
  const unknownSkills: string[] = [];
  const categoryCount: Record<string, number> = {};
  let totalTokens = 0;
  let outdatedCount = 0;
  
  for (const input of uniqueInputs) {
    const skillId = getSkillId(input.name);
    const knownSkill = skillId ? KNOWN_SKILLS[skillId] : undefined;
    
    if (knownSkill) {
      const category = knownSkill.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      totalTokens += knownSkill.estimatedTokens;
      
      const currentVersion = input.version;
      const latestVersion = knownSkill.latestVersion;
      const isOutdated = currentVersion && latestVersion && currentVersion !== latestVersion;
      if (isOutdated) outdatedCount++;
      
      const health = getHealthStatus(currentVersion, latestVersion);
      const { score, level } = calculateVulnerabilityScore(
        knownSkill.permissions || [],
        knownSkill.trustSource,
        knownSkill.handlesSensitiveData || false,
        currentVersion,
        latestVersion
      );
      
      nodes.push({
        id: skillId!,
        name: knownSkill.name,
        category,
        x: 0, y: 0, z: 0, // Will be positioned later
        tokens: knownSkill.estimatedTokens,
        color: theme.categoryColors[category] || '#ffffff',
        size: 0.5,
        connections: [],
        version: currentVersion,
        latestVersion,
        health,
        connectionCount: 0,
        vulnerability: {
          score,
          level,
          permissions: knownSkill.permissions || [],
          trustSource: knownSkill.trustSource,
          handlesSensitiveData: knownSkill.handlesSensitiveData || false,
        },
      });
    } else {
      unknownSkills.push(input.name);
      // Add as unknown skill with default values
      const category = 'utility';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      nodes.push({
        id: input.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: input.name,
        category,
        x: 0, y: 0, z: 0,
        tokens: 500, // Estimate
        color: theme.categoryColors[category] || '#ffffff',
        size: 0.4,
        connections: [],
        version: input.version,
        health: 'healthy',
        connectionCount: 0,
        vulnerability: {
          score: 50,
          level: 'medium',
          permissions: [],
          trustSource: 'unknown',
          handlesSensitiveData: false,
        },
      });
      totalTokens += 500;
    }
  }
  
  // Normalize sizes based on tokens
  const maxTokens = Math.max(...nodes.map(n => n.tokens), 1);
  for (const node of nodes) {
    node.size = (node.tokens / maxTokens) * 0.8 + 0.2;
  }
  
  // Generate edges (connections between similar skills)
  const edges = generateEdges(nodes);
  
  // Update connection counts
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source) {
      source.connectionCount++;
      if (!source.connections.includes(edge.target)) {
        source.connections.push(edge.target);
      }
    }
    if (target) {
      target.connectionCount++;
      if (!target.connections.includes(edge.source)) {
        target.connections.push(edge.source);
      }
    }
  }
  
  // Position nodes
  positionNodes(nodes);
  
  // Build clusters
  const clusters = buildClusters(nodes);
  
  // Calculate metrics
  const metrics = calculateMetrics(nodes, edges);
  
  // Generate recommendations
  const recommendations = generateRecommendations(nodes, categoryCount, unknownSkills);
  
  // Calculate health score
  const healthScore = calculateHealthScore(nodes, categoryCount, outdatedCount);
  
  // Count critical security issues
  const criticalSecurityCount = nodes.filter(
    n => n.vulnerability && (n.vulnerability.level === 'critical' || n.vulnerability.level === 'high')
  ).length;
  
  const summary: AnalysisSummary = {
    totalSkills: nodes.length,
    knownSkills: nodes.length - unknownSkills.length,
    unknownSkills: unknownSkills.length,
    totalTokens,
    healthScore,
    categories: categoryCount,
    outdatedCount,
    criticalSecurityCount,
  };
  
  return {
    id,
    createdAt,
    data: { nodes, edges, clusters, metrics },
    recommendations,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function generateResultId(): string {
  return `sr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function deduplicateInputs(inputs: SkillInput[]): SkillInput[] {
  const seen = new Map<string, SkillInput>();
  for (const input of inputs) {
    const key = input.name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, input);
    }
  }
  return Array.from(seen.values());
}

function getHealthStatus(version?: string, latestVersion?: string): HealthStatus {
  if (!version || !latestVersion) return 'healthy';
  if (version === latestVersion) return 'healthy';
  
  const [currMajor] = version.split('.').map(Number);
  const [latestMajor] = latestVersion.split('.').map(Number);
  
  if (latestMajor > currMajor) return 'needsUpdate';
  return 'needsUpdate';
}

function generateEdges(nodes: SkillNode[]): SkillEdge[] {
  const edges: SkillEdge[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      
      // Calculate similarity
      let similarity = 0;
      
      // Same category = high base similarity
      if (n1.category === n2.category) {
        similarity += 0.4;
      }
      
      // Name similarity
      const nameSim = calculateNameSimilarity(n1.name, n2.name);
      similarity += nameSim * 0.3;
      
      // Permission overlap
      if (n1.vulnerability && n2.vulnerability) {
        const p1 = new Set(n1.vulnerability.permissions);
        const p2 = new Set(n2.vulnerability.permissions);
        const overlap = [...p1].filter(p => p2.has(p)).length;
        const union = new Set([...p1, ...p2]).size;
        if (union > 0) {
          similarity += (overlap / union) * 0.2;
        }
      }
      
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

function calculateNameSimilarity(name1: string, name2: string): number {
  const words1 = name1.toLowerCase().split(/[\s-_]+/);
  const words2 = name2.toLowerCase().split(/[\s-_]+/);
  
  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

function positionNodes(nodes: SkillNode[]): void {
  // Group by category
  const categoryNodes = new Map<string, SkillNode[]>();
  for (const node of nodes) {
    if (!categoryNodes.has(node.category)) {
      categoryNodes.set(node.category, []);
    }
    categoryNodes.get(node.category)!.push(node);
  }
  
  const categories = Array.from(categoryNodes.keys());
  const numCategories = categories.length;
  
  // Find max connection for centrality
  const maxConnections = Math.max(...nodes.map(n => n.connectionCount), 1);
  
  for (let catIdx = 0; catIdx < numCategories; catIdx++) {
    const category = categories[catIdx];
    const catNodes = categoryNodes.get(category)!;
    const angle = (catIdx / numCategories) * Math.PI * 2;
    
    for (let i = 0; i < catNodes.length; i++) {
      const node = catNodes[i];
      
      // Centrality-based radius
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
      color: theme.categoryColors[category] || '#ffffff',
    });
  }
  
  return clusters;
}

function calculateMetrics(nodes: SkillNode[], edges: SkillEdge[]): VizMetrics {
  // Cosine similarities from edges
  const cosineSimilarities = edges
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20)
    .map(e => ({
      skill1: e.source,
      skill2: e.target,
      similarity: e.weight,
    }));
  
  // Category coverage
  const categoryTokens = new Map<string, number>();
  let totalTokens = 0;
  for (const node of nodes) {
    categoryTokens.set(
      node.category,
      (categoryTokens.get(node.category) || 0) + node.tokens
    );
    totalTokens += node.tokens;
  }
  
  const coverageScores: Record<string, number> = {};
  for (const [cat, tokens] of categoryTokens) {
    coverageScores[cat] = Math.round((tokens / totalTokens) * 100);
  }
  
  // Cluster density (average similarity within clusters)
  const clusterDensity = edges.length > 0
    ? edges.reduce((s, e) => s + e.weight, 0) / edges.length
    : 0;
  
  // Uniqueness index (inverse of average similarity)
  const overlapCoefficient = clusterDensity;
  const uniquenessIndex = 1 - overlapCoefficient * 0.5;
  
  return {
    cosineSimilarities,
    clusterDensity: Math.round(clusterDensity * 100) / 100,
    overlapCoefficient: Math.round(overlapCoefficient * 100) / 100,
    coverageScores,
    uniquenessIndex: Math.round(uniquenessIndex * 100) / 100,
  };
}

function generateRecommendations(
  nodes: SkillNode[],
  categoryCount: Record<string, number>,
  unknownSkills: string[]
): Recommendations {
  const diagnosis: DiagnosisItem[] = [];
  const install: InstallItem[] = [];
  const remove: RemoveItem[] = [];
  const update: UpdateItem[] = [];
  const security: SecurityItem[] = [];
  
  // Analyze category balance
  const allCategories = getAllCategories();
  const totalSkills = nodes.length;
  const presentCategories = Object.keys(categoryCount);
  const missingCategories = allCategories.filter(c => !presentCategories.includes(c));
  
  // Category imbalance diagnosis
  const maxCategoryPercent = Math.max(...Object.values(categoryCount).map(c => (c / totalSkills) * 100));
  if (maxCategoryPercent > 50) {
    const dominant = Object.entries(categoryCount)
      .find(([_, count]) => (count / totalSkills) * 100 === maxCategoryPercent);
    if (dominant) {
      diagnosis.push({
        type: 'warning',
        text: `${dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)} skills overload (${Math.round(maxCategoryPercent)}%)`,
        detail: 'Consider balancing with other categories',
      });
    }
  }
  
  // Missing categories
  for (const category of missingCategories) {
    if (category === 'data') {
      diagnosis.push({
        type: 'error',
        text: 'Data/Analytics skills lacking',
        detail: 'No database or analytics capability',
      });
      install.push({
        id: 'sql-query',
        reason: 'Data/Analytics category empty',
        priority: 'high',
        category: 'Data',
      });
    }
    if (category === 'devops') {
      install.push({
        id: 'docker-basics',
        reason: 'DevOps capability missing',
        priority: 'medium',
        category: 'DevOps',
      });
    }
    if (category === 'security' && !presentCategories.includes('security')) {
      diagnosis.push({
        type: 'error',
        text: 'Security skills missing',
        detail: 'No protection against attacks',
      });
      install.push({
        id: 'prompt-guard',
        reason: 'Critical security protection',
        priority: 'high',
        category: 'Security',
      });
    }
  }
  
  // Security assessment
  if (presentCategories.includes('security')) {
    diagnosis.push({
      type: 'success',
      text: 'Security skills present',
      detail: 'Basic protection in place',
    });
  }
  
  // Outdated skills
  for (const node of nodes) {
    if (node.version && node.latestVersion && node.version !== node.latestVersion) {
      const [currMajor] = node.version.split('.').map(Number);
      const [latestMajor] = node.latestVersion.split('.').map(Number);
      
      update.push({
        id: node.id,
        from: `v${node.version}`,
        to: `v${node.latestVersion}`,
        reason: latestMajor > currMajor ? 'Major update with new features' : 'Bug fixes and improvements',
      });
    }
    
    // Security issues
    if (node.vulnerability && (node.vulnerability.level === 'high' || node.vulnerability.level === 'critical')) {
      security.push({
        id: node.id,
        risk: node.vulnerability.level,
        score: node.vulnerability.score,
        reason: buildSecurityReason(node),
        action: buildSecurityAction(node),
        permissions: node.vulnerability.permissions,
      });
    }
  }
  
  // Unknown skills warning
  if (unknownSkills.length > 0) {
    diagnosis.push({
      type: 'warning',
      text: `${unknownSkills.length} unknown skill(s) detected`,
      detail: `Could not verify: ${unknownSkills.slice(0, 3).join(', ')}${unknownSkills.length > 3 ? '...' : ''}`,
    });
  }
  
  // Good health indicators
  if (update.length === 0) {
    diagnosis.push({
      type: 'success',
      text: 'All skills up to date',
      detail: 'No pending updates',
    });
  }
  
  if (security.length === 0) {
    diagnosis.push({
      type: 'success',
      text: 'No critical security issues',
      detail: 'Skill permissions look reasonable',
    });
  }
  
  return { diagnosis, install, remove, update, security };
}

function buildSecurityReason(node: SkillNode): string {
  const parts: string[] = [];
  
  if (node.vulnerability?.trustSource === 'community') {
    parts.push('Community source');
  } else if (node.vulnerability?.trustSource === 'unknown') {
    parts.push('Unknown source');
  }
  
  if (node.vulnerability?.permissions.includes('code-execution')) {
    parts.push('code execution');
  }
  if (node.vulnerability?.permissions.includes('filesystem')) {
    parts.push('filesystem access');
  }
  
  if (node.health === 'needsUpdate') {
    parts.push('outdated');
  }
  
  if (node.vulnerability?.handlesSensitiveData) {
    parts.push('handles sensitive data');
  }
  
  return parts.join(' + ');
}

function buildSecurityAction(node: SkillNode): string {
  if (node.health === 'needsUpdate') {
    return `Update to v${node.latestVersion}`;
  }
  if (node.vulnerability?.trustSource === 'unknown') {
    return 'Verify source or find alternative';
  }
  if (node.vulnerability?.trustSource === 'community') {
    return 'Review permissions and source';
  }
  return 'Review security permissions';
}

function calculateHealthScore(
  nodes: SkillNode[],
  categoryCount: Record<string, number>,
  outdatedCount: number
): number {
  let score = 100;
  
  // Deduct for outdated skills
  score -= outdatedCount * 3;
  
  // Deduct for security issues
  for (const node of nodes) {
    if (node.vulnerability) {
      if (node.vulnerability.level === 'critical') score -= 10;
      else if (node.vulnerability.level === 'high') score -= 5;
      else if (node.vulnerability.level === 'medium') score -= 2;
    }
  }
  
  // Deduct for missing important categories
  if (!categoryCount['security']) score -= 15;
  if (!categoryCount['development']) score -= 5;
  
  // Bonus for good coverage
  const numCategories = Object.keys(categoryCount).length;
  if (numCategories >= 5) score += 5;
  if (numCategories >= 7) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

// ═══════════════════════════════════════════════════════════
// URL Encoding/Decoding for Sharing
// ═══════════════════════════════════════════════════════════

export interface ShareableData {
  v: number; // Version
  i?: string; // ID
  t: number; // Timestamp
  s: string[] | Array<{ i: string; n: string; c: string; t: number; v?: string }>; // Skills
}

export function encodeResultForUrl(result: AnalysisResult): string {
  const compressed: ShareableData = {
    v: 1,
    i: result.id,
    t: new Date(result.createdAt).getTime(),
    s: result.data.nodes.map(n => {
      let entry = n.id;
      if (n.version) entry += `@${n.version}`;
      return entry;
    }),
  };
  
  const json = JSON.stringify(compressed);
  return btoa(encodeURIComponent(json));
}

export function decodeResultFromUrl(encoded: string): AnalysisResult | null {
  try {
    // Try base64url decoding first (CLI format)
    let json: string;
    try {
      // base64url uses - and _ instead of + and /
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      json = decodeURIComponent(escape(atob(base64)));
    } catch {
      // Fall back to standard base64
      json = decodeURIComponent(atob(encoded));
    }
    
    const data: ShareableData = JSON.parse(json);
    
    if (data.v !== 1) {
      console.warn('Unknown share format version:', data.v);
    }
    
    let inputs: SkillInput[];
    
    // Check if it's CLI format (array of objects) or web format (array of strings)
    if (data.s.length > 0 && typeof data.s[0] === 'object') {
      // CLI format: array of { i, n, c, t, v }
      inputs = (data.s as Array<{ i: string; n: string; c: string; t: number; v?: string }>).map(s => ({
        name: s.i,
        version: s.v,
        category: s.c,
        displayName: s.n,
        tokens: s.t,
      }));
    } else {
      // Web format: array of "name@version" strings
      inputs = (data.s as string[]).map(s => {
        const [name, version] = s.split('@');
        return { name, version };
      });
    }
    
    const result = analyzeSkillsWithMetadata(inputs);
    result.id = data.i || `sr_${data.t.toString(36)}`;
    result.createdAt = new Date(data.t).toISOString();
    
    return result;
  } catch (error) {
    console.error('Failed to decode shared result:', error);
    return null;
  }
}

// Extended SkillInput for CLI metadata
interface ExtendedSkillInput extends SkillInput {
  category?: string;
  displayName?: string;
  tokens?: number;
}

// Analyze with pre-computed metadata from CLI
function analyzeSkillsWithMetadata(inputs: ExtendedSkillInput[]): AnalysisResult {
  const id = `sr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  
  // If inputs have full metadata from CLI, use it directly
  const hasMetadata = inputs.some(i => i.category && i.tokens);
  
  if (hasMetadata) {
    // Build from CLI metadata
    return analyzeFromCLIData(inputs, id, createdAt);
  }
  
  // Fall back to regular analysis
  return analyzeSkills(inputs);
}

function analyzeFromCLIData(inputs: ExtendedSkillInput[], id: string, createdAt: string): AnalysisResult {
  const nodes: SkillNode[] = [];
  const categoryCount: Record<string, number> = {};
  let totalTokens = 0;
  let outdatedCount = 0;
  
  const maxTokens = Math.max(...inputs.map(i => i.tokens || 100), 1);
  
  for (const input of inputs) {
    const skillId = input.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const category = input.category || 'utility';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
    
    const tokens = input.tokens || 100;
    totalTokens += tokens;
    
    const knownSkill = KNOWN_SKILLS[skillId];
    const latestVersion = knownSkill?.latestVersion;
    const currentVersion = input.version;
    
    if (currentVersion && latestVersion && currentVersion !== latestVersion) {
      outdatedCount++;
    }
    
    const health = getHealthStatus(currentVersion, latestVersion);
    
    nodes.push({
      id: skillId,
      name: input.displayName || input.name,
      category,
      x: 0, y: 0, z: 0,
      tokens,
      color: theme.categoryColors[category] || '#ffffff',
      size: (tokens / maxTokens) * 0.8 + 0.2,
      connections: [],
      version: currentVersion,
      latestVersion,
      health,
      connectionCount: 0,
      vulnerability: {
        score: 25,
        level: 'low',
        permissions: [],
        trustSource: 'unknown',
        handlesSensitiveData: false,
      },
    });
  }
  
  // Generate edges
  const edges = generateEdges(nodes);
  
  // Update connection counts
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source) {
      source.connectionCount++;
      if (!source.connections.includes(edge.target)) {
        source.connections.push(edge.target);
      }
    }
    if (target) {
      target.connectionCount++;
      if (!target.connections.includes(edge.source)) {
        target.connections.push(edge.source);
      }
    }
  }
  
  // Position nodes
  positionNodes(nodes);
  
  // Build clusters
  const clusters = buildClusters(nodes);
  
  // Calculate metrics
  const metrics = calculateMetrics(nodes, edges);
  
  // Generate recommendations
  const recommendations = generateRecommendations(nodes, categoryCount, []);
  
  // Calculate health score
  const healthScore = calculateHealthScore(nodes, categoryCount, outdatedCount);
  
  const summary: AnalysisSummary = {
    totalSkills: nodes.length,
    knownSkills: nodes.length,
    unknownSkills: 0,
    totalTokens,
    healthScore,
    categories: categoryCount,
    outdatedCount,
    criticalSecurityCount: 0,
  };
  
  return {
    id,
    createdAt,
    data: { nodes, edges, clusters, metrics },
    recommendations,
    summary,
  };
}
