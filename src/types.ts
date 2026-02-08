/**
 * SkillRespec Type Definitions
 */

export interface Skill {
  name: string;
  path: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  lastModified?: Date;
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
}

export interface RespecRecommendation {
  skill: Skill;
  action: 'keep' | 'upgrade' | 'remove' | 'merge';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}
