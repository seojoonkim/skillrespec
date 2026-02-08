// ═══════════════════════════════════════════════════════════
// SKILL.md Linter - AgentLinter-style validation
// Grades: A-F based on completeness and best practices
// ═══════════════════════════════════════════════════════════

export type LintGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
  id: string;
  severity: LintSeverity;
  message: string;
  fix?: string;          // Suggested fix
}

export interface LintResult {
  grade: LintGrade;
  score: number;         // 0-100
  issues: LintIssue[];
  checks: LintCheck[];
  summary: string;
}

export interface LintCheck {
  id: string;
  name: string;
  passed: boolean;
  points: number;        // Points earned
  maxPoints: number;     // Max possible
  severity: LintSeverity;
}

// ═══════════════════════════════════════════════════════════
// Skill Structure Interface (what we expect in a skill dir)
// ═══════════════════════════════════════════════════════════

export interface SkillStructure {
  skillMd: string | null;      // SKILL.md content
  readmeMd: string | null;     // README.md content
  hasExamples: boolean;        // examples/ directory
  hasTests: boolean;           // tests/ or test/ directory
  hasChangelog: boolean;       // CHANGELOG.md
  hasLicense: boolean;         // LICENSE file
  fileCount: number;           // Total files
  name?: string;               // Parsed from SKILL.md
  description?: string;        // Parsed from SKILL.md
  version?: string;            // Parsed from SKILL.md
}

// ═══════════════════════════════════════════════════════════
// Lint Rules
// ═══════════════════════════════════════════════════════════

const REQUIRED_FIELDS = ['name', 'description'];
const RECOMMENDED_FIELDS = ['version', 'author', 'category', 'tags'];
const OPTIONAL_FIELDS = ['permissions', 'dependencies', 'config'];

// ═══════════════════════════════════════════════════════════
// Parser Functions
// ═══════════════════════════════════════════════════════════

export function parseSkillMd(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  
  // Parse YAML frontmatter
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];
    yaml.split('\n').forEach((line) => {
      const match = line.match(/^(\w+):\s*(.+)/);
      if (match) {
        fields[match[1].toLowerCase()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  // Parse markdown headers (fallback)
  const nameMatch = content.match(/^#\s+(.+)/m);
  if (nameMatch && !fields.name) {
    fields.name = nameMatch[1].trim();
  }

  // Look for description in first paragraph
  if (!fields.description) {
    const descMatch = content.match(/^#[^\n]+\n\n([^\n]+)/m);
    if (descMatch) {
      fields.description = descMatch[1].trim();
    }
  }

  return fields;
}

export function extractSections(content: string): string[] {
  const headers = content.match(/^##\s+.+/gm) || [];
  return headers.map((h) => h.replace(/^##\s+/, '').toLowerCase());
}

// ═══════════════════════════════════════════════════════════
// Main Linting Function
// ═══════════════════════════════════════════════════════════

export function lintSkill(structure: SkillStructure): LintResult {
  const issues: LintIssue[] = [];
  const checks: LintCheck[] = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // ─────────────────────────────────────────────────────────
  // Check 1: SKILL.md exists (30 points)
  // ─────────────────────────────────────────────────────────
  const hasSkillMd = !!structure.skillMd;
  checks.push({
    id: 'skill-md-exists',
    name: 'SKILL.md exists',
    passed: hasSkillMd,
    points: hasSkillMd ? 30 : 0,
    maxPoints: 30,
    severity: 'error',
  });
  maxPoints += 30;
  if (hasSkillMd) {
    totalPoints += 30;
  } else {
    issues.push({
      id: 'missing-skill-md',
      severity: 'error',
      message: 'Missing SKILL.md file',
      fix: 'Create a SKILL.md file with name and description',
    });
    // Early return - can't lint without SKILL.md
    return {
      grade: 'F',
      score: 0,
      issues,
      checks,
      summary: 'Missing required SKILL.md file',
    };
  }

  // Parse SKILL.md
  const fields = parseSkillMd(structure.skillMd!);
  const sections = extractSections(structure.skillMd!);

  // ─────────────────────────────────────────────────────────
  // Check 2: Required fields (20 points each)
  // ─────────────────────────────────────────────────────────
  for (const field of REQUIRED_FIELDS) {
    const hasField = !!fields[field];
    checks.push({
      id: `required-${field}`,
      name: `Has ${field} field`,
      passed: hasField,
      points: hasField ? 20 : 0,
      maxPoints: 20,
      severity: 'error',
    });
    maxPoints += 20;
    if (hasField) {
      totalPoints += 20;
    } else {
      issues.push({
        id: `missing-${field}`,
        severity: 'error',
        message: `Missing required field: ${field}`,
        fix: `Add "${field}: your-${field}" to SKILL.md frontmatter`,
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Check 3: Recommended fields (5 points each)
  // ─────────────────────────────────────────────────────────
  for (const field of RECOMMENDED_FIELDS) {
    const hasField = !!fields[field];
    checks.push({
      id: `recommended-${field}`,
      name: `Has ${field} field`,
      passed: hasField,
      points: hasField ? 5 : 0,
      maxPoints: 5,
      severity: 'warning',
    });
    maxPoints += 5;
    if (hasField) {
      totalPoints += 5;
    } else {
      issues.push({
        id: `missing-${field}`,
        severity: 'warning',
        message: `Missing recommended field: ${field}`,
        fix: `Consider adding "${field}:" to SKILL.md`,
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Check 4: README.md (10 points)
  // ─────────────────────────────────────────────────────────
  const hasReadme = !!structure.readmeMd;
  checks.push({
    id: 'readme-exists',
    name: 'README.md exists',
    passed: hasReadme,
    points: hasReadme ? 10 : 0,
    maxPoints: 10,
    severity: 'warning',
  });
  maxPoints += 10;
  if (hasReadme) {
    totalPoints += 10;
  } else {
    issues.push({
      id: 'missing-readme',
      severity: 'warning',
      message: 'No README.md found',
      fix: 'Add a README.md with usage instructions',
    });
  }

  // ─────────────────────────────────────────────────────────
  // Check 5: Examples (10 points)
  // ─────────────────────────────────────────────────────────
  const hasExamples = structure.hasExamples || sections.includes('examples') || sections.includes('usage');
  checks.push({
    id: 'has-examples',
    name: 'Has examples/usage',
    passed: hasExamples,
    points: hasExamples ? 10 : 0,
    maxPoints: 10,
    severity: 'info',
  });
  maxPoints += 10;
  if (hasExamples) {
    totalPoints += 10;
  } else {
    issues.push({
      id: 'no-examples',
      severity: 'info',
      message: 'No examples or usage section found',
      fix: 'Add an examples/ directory or ## Usage section',
    });
  }

  // ─────────────────────────────────────────────────────────
  // Check 6: Tests (10 points)
  // ─────────────────────────────────────────────────────────
  checks.push({
    id: 'has-tests',
    name: 'Has tests',
    passed: structure.hasTests,
    points: structure.hasTests ? 10 : 0,
    maxPoints: 10,
    severity: 'info',
  });
  maxPoints += 10;
  if (structure.hasTests) {
    totalPoints += 10;
  } else {
    issues.push({
      id: 'no-tests',
      severity: 'info',
      message: 'No tests directory found',
      fix: 'Add a tests/ directory with test cases',
    });
  }

  // ─────────────────────────────────────────────────────────
  // Check 7: Description length (bonus, 5 points)
  // ─────────────────────────────────────────────────────────
  const descLen = (fields.description || '').length;
  const goodDesc = descLen >= 20 && descLen <= 200;
  checks.push({
    id: 'desc-length',
    name: 'Good description length',
    passed: goodDesc,
    points: goodDesc ? 5 : 0,
    maxPoints: 5,
    severity: 'info',
  });
  maxPoints += 5;
  if (goodDesc) {
    totalPoints += 5;
  } else if (descLen < 20) {
    issues.push({
      id: 'desc-short',
      severity: 'info',
      message: 'Description is too short (< 20 chars)',
      fix: 'Expand description to be more informative',
    });
  } else if (descLen > 200) {
    issues.push({
      id: 'desc-long',
      severity: 'info',
      message: 'Description is too long (> 200 chars)',
      fix: 'Keep description concise, put details in README',
    });
  }

  // ─────────────────────────────────────────────────────────
  // Calculate final score and grade
  // ─────────────────────────────────────────────────────────
  const score = Math.round((totalPoints / maxPoints) * 100);
  const grade = scoreToGrade(score);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  let summary = '';
  if (grade === 'A') {
    summary = 'Excellent! This skill follows best practices.';
  } else if (grade === 'B') {
    summary = 'Good structure with minor improvements possible.';
  } else if (grade === 'C') {
    summary = `Needs work. ${errorCount} errors, ${warningCount} warnings.`;
  } else if (grade === 'D') {
    summary = `Missing key elements. ${errorCount} errors to fix.`;
  } else {
    summary = 'Critical issues. Fix required fields first.';
  }

  return {
    grade,
    score,
    issues,
    checks,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function scoreToGrade(score: number): LintGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function gradeColor(grade: LintGrade): string {
  switch (grade) {
    case 'A': return '#34d399'; // emerald
    case 'B': return '#60a5fa'; // blue
    case 'C': return '#fbbf24'; // amber
    case 'D': return '#fb923c'; // orange
    case 'F': return '#f87171'; // red
  }
}

export function severityColor(severity: LintSeverity): string {
  switch (severity) {
    case 'error': return '#f87171';
    case 'warning': return '#fbbf24';
    case 'info': return '#60a5fa';
  }
}

export function severityIcon(severity: LintSeverity): string {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
  }
}

// ═══════════════════════════════════════════════════════════
// Mock function to simulate linting a skill from VizData
// ═══════════════════════════════════════════════════════════

export function lintSkillFromNode(skillId: string): LintResult {
  // In real implementation, this would read actual files
  // For demo, generate somewhat random but consistent results
  const seed = skillId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const mockStructure: SkillStructure = {
    skillMd: `---
name: ${skillId}
description: A skill for ${skillId.replace(/-/g, ' ')}
version: 1.0.0
author: demo
---

# ${skillId}

This skill provides functionality for ${skillId.replace(/-/g, ' ')}.
`,
    readmeMd: random(0, 100) > 30 ? '# README\n\nUsage instructions here.' : null,
    hasExamples: random(0, 100) > 50,
    hasTests: random(0, 100) > 60,
    hasChangelog: random(0, 100) > 70,
    hasLicense: random(0, 100) > 40,
    fileCount: random(3, 15),
  };

  return lintSkill(mockStructure);
}
