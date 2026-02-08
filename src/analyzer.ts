/**
 * Skill Analyzer - Analyzes skill health and provides recommendations
 */

import type { Skill, CatalogSkill, SkillHealth, AnalysisResult, RespecRecommendation, AnalysisMetrics } from './types.js';
import { calculateMetrics, findSimilarPairs, CATEGORY_COLORS } from './metrics.js';

const ROAST_LINES = {
  redundant: [
    "🔥 You have %n skills that basically do the same thing. Ever heard of DRY?",
    "🔥 Your skill overlap is so high, I thought this was a mirror factory.",
    "🔥 Congratulations, you've achieved skill redundancy nirvana. That's not a compliment.",
    "🔥 Half your skills are just other skills wearing fake mustaches.",
  ],
  bloated: [
    "🔥 Your token usage is higher than my rent. Time to Marie Kondo this mess.",
    "🔥 %n tokens? Are you building an AI or feeding a token monster?",
    "🔥 I've seen smaller context windows in submarine portholes.",
    "🔥 Your skills need a diet. Preferably keto. Cut the carbs (and tokens).",
  ],
  imbalanced: [
    "🔥 Your category coverage is more unbalanced than a flamingo on a surfboard.",
    "🔥 %cat has 47 skills while %other has 2. You okay, bro?",
    "🔥 This skill distribution would make any statistician cry.",
    "🔥 Your portfolio is so lopsided it needs a chiropractor.",
  ],
  generic: [
    "🔥 This skill set has the personality of unseasoned tofu.",
    "🔥 I've seen more exciting skills in a 'Hello World' tutorial.",
    "🔥 Your uniqueness index is so low, you might be a clone.",
    "🔥 If beige was a skill portfolio, this would be it.",
  ],
  praise: [
    "👏 Okay, not gonna lie, this is actually pretty solid.",
    "👏 Respectable setup. I'll save my roasts for someone who deserves them.",
    "👏 Clean, organized, balanced. Are you sure you're human?",
    "👏 This skill portfolio fucks. No notes.",
  ],
};

export async function analyzeSkills(
  skills: Skill[],
  options: { roast?: boolean } = {}
): Promise<AnalysisResult> {
  const health: SkillHealth[] = [];

  for (const skill of skills) {
    const skillHealth = await analyzeSkill(skill);
    health.push(skillHealth);
  }

  const overallScore = health.length > 0
    ? Math.round(health.reduce((sum, h) => sum + h.score, 0) / health.length)
    : 0;

  // Calculate empty metrics for local skills
  const metrics: AnalysisMetrics = {
    cosineSimilarities: [],
    clusterDensity: 0,
    overlapCoefficient: 0,
    coverageScores: {},
    uniquenessIndex: 0,
    totalTokens: 0,
    avgTokensPerSkill: 0,
  };

  return {
    health,
    overallScore,
    roastMode: options.roast,
    metrics,
  };
}

export async function analyzeCatalogSkills(
  skills: CatalogSkill[],
  options: { roast?: boolean } = {}
): Promise<AnalysisResult> {
  const metrics = calculateMetrics(skills);
  
  // Calculate overall score based on metrics
  let overallScore = 50;
  
  // Uniqueness contributes 30%
  overallScore += metrics.uniquenessIndex * 30;
  
  // Cluster density (balance) contributes 20%
  overallScore += metrics.clusterDensity * 20;
  
  // Penalize high overlap
  overallScore -= metrics.overlapCoefficient * 20;
  
  overallScore = Math.round(Math.min(100, Math.max(0, overallScore)));

  const health: SkillHealth[] = skills.slice(0, 10).map(s => ({
    skill: {
      name: s.name,
      path: s.path,
      id: s.id,
      category: s.category,
      estimatedTokens: s.estimatedTokens,
    },
    score: 70 + Math.random() * 30,
    issues: [],
    suggestions: [],
  }));

  return {
    health,
    overallScore,
    roastMode: options.roast,
    metrics,
  };
}

async function analyzeSkill(skill: Skill): Promise<SkillHealth> {
  // TODO: Implement actual analysis logic
  return {
    skill,
    score: 70,
    issues: [],
    suggestions: ['Add more documentation', 'Consider adding tests'],
  };
}

export function getRecommendations(result: AnalysisResult): RespecRecommendation[] {
  const recommendations: RespecRecommendation[] = [];
  
  // Find merge candidates from high similarity pairs
  for (const pair of result.metrics.cosineSimilarities.slice(0, 5)) {
    if (pair.similarity > 0.6) {
      recommendations.push({
        skill: { name: pair.skill1, path: '' },
        action: 'merge',
        reason: `${Math.round(pair.similarity * 100)}% similar to ${pair.skill2}`,
        priority: pair.similarity > 0.8 ? 'high' : 'medium',
        mergeWith: pair.skill2,
      });
    }
  }
  
  return recommendations;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatAnalysisResult(result: AnalysisResult): string {
  const { metrics, roastMode, overallScore } = result;
  const lines: string[] = [];
  
  if (roastMode) {
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║  🔥🔥🔥 ROAST MODE: SKILL PORTFOLIO DESTRUCTION 🔥🔥🔥       ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
  } else {
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║  📊 SKILL PORTFOLIO ANALYSIS                                 ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
  }
  
  // Overall Score
  const scoreBar = '█'.repeat(Math.round(overallScore / 5));
  const emptyBar = '░'.repeat(20 - Math.round(overallScore / 5));
  lines.push(`  Overall Score: ${getScoreEmoji(overallScore)} ${overallScore}/100`);
  lines.push(`  [${scoreBar}${emptyBar}]`);
  lines.push('');
  
  // Metrics
  lines.push('  ┌─────────────────────────────────────────────────────────────┐');
  lines.push('  │ TECHNICAL METRICS                                          │');
  lines.push('  ├─────────────────────────────────────────────────────────────┤');
  lines.push(`  │ Cosine Similarities    │ Top ${metrics.cosineSimilarities.length} pairs analyzed           │`);
  lines.push(`  │ Cluster Density        │ ${(metrics.clusterDensity * 100).toFixed(1)}% (balance)               │`);
  lines.push(`  │ Overlap Coefficient    │ ${(metrics.overlapCoefficient * 100).toFixed(1)}% (redundancy)          │`);
  lines.push(`  │ Uniqueness Index       │ ${(metrics.uniquenessIndex * 100).toFixed(1)}%                         │`);
  lines.push(`  │ Total Tokens           │ ~${metrics.totalTokens.toLocaleString()} tokens                  │`);
  lines.push(`  │ Avg per Skill          │ ~${metrics.avgTokensPerSkill.toLocaleString()} tokens                    │`);
  lines.push('  └─────────────────────────────────────────────────────────────┘');
  lines.push('');
  
  // Coverage breakdown
  if (Object.keys(metrics.coverageScores).length > 0) {
    lines.push('  📊 Category Coverage:');
    const sortedCats = Object.entries(metrics.coverageScores)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [cat, pct] of sortedCats) {
      const bar = '█'.repeat(Math.round(pct / 5));
      const color = CATEGORY_COLORS[cat] || '#ffffff';
      lines.push(`     ${cat.padEnd(15)} ${bar.padEnd(20)} ${pct}%`);
    }
    lines.push('');
  }
  
  // Top similar pairs
  if (metrics.cosineSimilarities.length > 0) {
    lines.push('  🔗 Most Similar Skill Pairs:');
    for (const pair of metrics.cosineSimilarities.slice(0, 5)) {
      const simPct = Math.round(pair.similarity * 100);
      lines.push(`     ${pair.skill1} ↔ ${pair.skill2}: ${simPct}%`);
    }
    lines.push('');
  }
  
  // Roast commentary
  if (roastMode) {
    lines.push('  💀 ROAST VERDICT:');
    lines.push('');
    
    if (metrics.overlapCoefficient > 0.4) {
      lines.push('  ' + pickRandom(ROAST_LINES.redundant).replace('%n', String(metrics.cosineSimilarities.length)));
    }
    
    if (metrics.totalTokens > 100000) {
      lines.push('  ' + pickRandom(ROAST_LINES.bloated).replace('%n', metrics.totalTokens.toLocaleString()));
    }
    
    if (metrics.clusterDensity < 0.5) {
      const cats = Object.entries(metrics.coverageScores).sort((a, b) => b[1] - a[1]);
      if (cats.length >= 2) {
        lines.push('  ' + pickRandom(ROAST_LINES.imbalanced)
          .replace('%cat', cats[0][0])
          .replace('%other', cats[cats.length - 1][0]));
      }
    }
    
    if (metrics.uniquenessIndex < 0.7) {
      lines.push('  ' + pickRandom(ROAST_LINES.generic));
    }
    
    if (overallScore >= 80) {
      lines.push('  ' + pickRandom(ROAST_LINES.praise));
    }
    
    lines.push('');
  }
  
  // Recommendations
  const recommendations = getRecommendations(result);
  if (recommendations.length > 0) {
    lines.push('  💡 RESPEC RECOMMENDATIONS:');
    for (const rec of recommendations) {
      const icon = rec.action === 'merge' ? '🔀' : rec.action === 'remove' ? '🗑️' : '📦';
      lines.push(`     ${icon} ${rec.skill.name}: ${rec.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}
