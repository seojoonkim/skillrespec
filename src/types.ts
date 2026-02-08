/**
 * SkillRespec Type Definitions
 */

export interface Skill {
  name: string;
  path: string;
  id?: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  conflicts?: string[];
  category?: string;
  source?: 'openclaw' | 'local' | 'github';
  estimatedTokens?: number;
  size?: number;
  lastModified?: Date;
}

export interface CatalogSkill {
  id: string;
  name: string;
  description: string;
  source: 'openclaw' | 'local' | 'github';
  path: string;
  url?: string;
  stars?: number;
  size: number;
  estimatedTokens: number;
  category: string;
  author?: string;
  verified?: boolean;
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

export interface SkillHealth {
  skill: Skill;
  score: number; // 0-100
  issues: SkillIssue[];
  suggestions: string[];
}

export interface SkillIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  line?: number;
}

export interface ScanResult {
  skills: Skill[];
  totalCount: number;
  scanTime: number;
}

export interface AnalysisResult {
  health: SkillHealth[];
  overallScore: number;
  roastMode?: boolean;
  metrics: AnalysisMetrics;
}

export interface AnalysisMetrics {
  cosineSimilarities: SimilarityPair[];
  clusterDensity: number;
  overlapCoefficient: number;
  coverageScores: Record<string, number>;
  uniquenessIndex: number;
  totalTokens: number;
  avgTokensPerSkill: number;
}

export interface SimilarityPair {
  skill1: string;
  skill2: string;
  similarity: number;
}

export interface RespecRecommendation {
  skill: Skill;
  action: 'keep' | 'upgrade' | 'remove' | 'merge';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  mergeWith?: string;
}

// 3D Visualization Types
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
}

export interface SkillEdge {
  source: string;
  target: string;
  weight: number;
}

export interface VizData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  clusters: SkillCluster[];
  metrics: VizMetrics;
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
  cosineSimilarities: SimilarityPair[];
  clusterDensity: number;
  overlapCoefficient: number;
  coverageScores: Record<string, number>;
  uniquenessIndex: number;
  categoryBalance?: number;
  avgDepth?: number;
}
