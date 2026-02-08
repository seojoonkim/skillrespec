export type HealthStatus = 'healthy' | 'needsUpdate' | 'shouldRemove' | 'unused';

export type VulnerabilityLevel = 'low' | 'medium' | 'high' | 'critical';
export type TrustSource = 'official' | 'verified' | 'community' | 'unknown';

export interface VulnerabilityInfo {
  score: number;              // 0-100 (higher = more vulnerable)
  level: VulnerabilityLevel;
  permissions: string[];      // e.g., ['filesystem', 'code-execution', 'network']
  trustSource: TrustSource;
  handlesSensitiveData: boolean;
  lastAudit?: string;         // ISO date string
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
  version?: string;         // Currently installed version (e.g., "1.0.0")
  latestVersion?: string;   // Latest available version from ClawdHub
  health: HealthStatus;     // Health status for visualization
  connectionCount: number;  // Number of connections (for centrality)
  vulnerability?: VulnerabilityInfo;  // Security vulnerability info
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
  cosineSimilarities: SimilarityPair[];
  clusterDensity: number;
  overlapCoefficient: number;
  coverageScores: Record<string, number>;
  uniquenessIndex: number;
}

export interface SimilarityPair {
  skill1: string;
  skill2: string;
  similarity: number;
}

export interface VizData {
  nodes: SkillNode[];
  edges: SkillEdge[];
  clusters: SkillCluster[];
  metrics: VizMetrics;
}
