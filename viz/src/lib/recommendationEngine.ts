// ═══════════════════════════════════════════════════════════
// Skill Recommendation Engine - Rule-based AI Recommendations
// ═══════════════════════════════════════════════════════════

import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SkillRecommendation {
  id: string;
  name: string;
  category: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  type: 'missing-category' | 'popular' | 'complementary' | 'upgrade';
  confidence: number; // 0-100
}

export interface CategoryAnalysis {
  category: string;
  count: number;
  percentage: number;
  status: 'strong' | 'adequate' | 'weak' | 'missing';
}

// ═══════════════════════════════════════════════════════════
// Popular Skills Database (Mock - in real app, from ClawdHub API)
// ═══════════════════════════════════════════════════════════

const POPULAR_SKILLS: Record<string, { id: string; name: string; category: string; popularity: number }[]> = {
  productivity: [
    { id: 'notion-helper', name: 'Notion Helper', category: 'productivity', popularity: 95 },
    { id: 'calendar-sync', name: 'Calendar Sync', category: 'productivity', popularity: 88 },
    { id: 'task-master', name: 'Task Master', category: 'productivity', popularity: 82 },
    { id: 'time-tracker', name: 'Time Tracker', category: 'productivity', popularity: 78 },
  ],
  development: [
    { id: 'github-copilot', name: 'GitHub Copilot', category: 'development', popularity: 98 },
    { id: 'code-reviewer', name: 'Code Reviewer', category: 'development', popularity: 91 },
    { id: 'test-generator', name: 'Test Generator', category: 'development', popularity: 85 },
    { id: 'api-designer', name: 'API Designer', category: 'development', popularity: 79 },
  ],
  security: [
    { id: 'prompt-guard', name: 'Prompt Guard', category: 'security', popularity: 94 },
    { id: 'hivefence', name: 'HiveFence', category: 'security', popularity: 89 },
    { id: 'secret-scanner', name: 'Secret Scanner', category: 'security', popularity: 86 },
    { id: 'audit-logger', name: 'Audit Logger', category: 'security', popularity: 75 },
  ],
  data: [
    { id: 'sql-assistant', name: 'SQL Assistant', category: 'data', popularity: 92 },
    { id: 'data-viz', name: 'Data Visualizer', category: 'data', popularity: 87 },
    { id: 'csv-master', name: 'CSV Master', category: 'data', popularity: 80 },
    { id: 'json-formatter', name: 'JSON Formatter', category: 'data', popularity: 76 },
  ],
  devops: [
    { id: 'docker-helper', name: 'Docker Helper', category: 'devops', popularity: 93 },
    { id: 'k8s-assist', name: 'K8s Assist', category: 'devops', popularity: 88 },
    { id: 'ci-cd-master', name: 'CI/CD Master', category: 'devops', popularity: 84 },
    { id: 'terraform-guide', name: 'Terraform Guide', category: 'devops', popularity: 79 },
  ],
  communication: [
    { id: 'slack-bot', name: 'Slack Bot', category: 'communication', popularity: 90 },
    { id: 'email-composer', name: 'Email Composer', category: 'communication', popularity: 85 },
    { id: 'meeting-notes', name: 'Meeting Notes', category: 'communication', popularity: 82 },
    { id: 'translation-pro', name: 'Translation Pro', category: 'communication', popularity: 77 },
  ],
  design: [
    { id: 'figma-bridge', name: 'Figma Bridge', category: 'design', popularity: 91 },
    { id: 'color-palette', name: 'Color Palette', category: 'design', popularity: 84 },
    { id: 'icon-finder', name: 'Icon Finder', category: 'design', popularity: 79 },
    { id: 'ui-patterns', name: 'UI Patterns', category: 'design', popularity: 75 },
  ],
  media: [
    { id: 'image-gen', name: 'Image Generator', category: 'media', popularity: 96 },
    { id: 'video-editor', name: 'Video Editor', category: 'media', popularity: 83 },
    { id: 'audio-processor', name: 'Audio Processor', category: 'media', popularity: 78 },
    { id: 'thumbnail-maker', name: 'Thumbnail Maker', category: 'media', popularity: 74 },
  ],
  utility: [
    { id: 'file-manager', name: 'File Manager', category: 'utility', popularity: 88 },
    { id: 'clipboard-history', name: 'Clipboard History', category: 'utility', popularity: 82 },
    { id: 'quick-search', name: 'Quick Search', category: 'utility', popularity: 79 },
    { id: 'system-monitor', name: 'System Monitor', category: 'utility', popularity: 73 },
  ],
  marketing: [
    { id: 'seo-optimizer', name: 'SEO Optimizer', category: 'marketing', popularity: 87 },
    { id: 'social-scheduler', name: 'Social Scheduler', category: 'marketing', popularity: 84 },
    { id: 'content-writer', name: 'Content Writer', category: 'marketing', popularity: 81 },
    { id: 'analytics-tracker', name: 'Analytics Tracker', category: 'marketing', popularity: 76 },
  ],
};

// Complementary skill pairs
const COMPLEMENTARY_SKILLS: Record<string, string[]> = {
  'github-copilot': ['code-reviewer', 'test-generator'],
  'docker-helper': ['k8s-assist', 'ci-cd-master'],
  'prompt-guard': ['hivefence', 'secret-scanner'],
  'sql-assistant': ['data-viz', 'csv-master'],
  'figma-bridge': ['ui-patterns', 'color-palette'],
  'slack-bot': ['meeting-notes', 'calendar-sync'],
};

// ═══════════════════════════════════════════════════════════
// Category Analysis
// ═══════════════════════════════════════════════════════════

export function analyzeCategories(nodes: SkillNode[]): CategoryAnalysis[] {
  const categories = Object.keys(POPULAR_SKILLS);
  const total = nodes.length || 1;
  
  const counts: Record<string, number> = {};
  categories.forEach(cat => counts[cat] = 0);
  
  nodes.forEach(node => {
    const cat = node.category.toLowerCase();
    if (counts[cat] !== undefined) {
      counts[cat]++;
    }
  });
  
  return categories.map(category => {
    const count = counts[category];
    const percentage = (count / total) * 100;
    
    let status: CategoryAnalysis['status'];
    if (count === 0) status = 'missing';
    else if (percentage < 5) status = 'weak';
    else if (percentage < 15) status = 'adequate';
    else status = 'strong';
    
    return { category, count, percentage, status };
  }).sort((a, b) => a.count - b.count); // Sort by count ascending (missing first)
}

// ═══════════════════════════════════════════════════════════
// Recommendation Engine
// ═══════════════════════════════════════════════════════════

export function generateRecommendations(
  installedSkills: SkillNode[],
  maxRecommendations = 10
): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = [];
  const installedIds = new Set(installedSkills.map(s => s.id.toLowerCase()));
  
  // 1. Analyze categories and find gaps
  const categoryAnalysis = analyzeCategories(installedSkills);
  const missingCategories = categoryAnalysis.filter(c => c.status === 'missing');
  const weakCategories = categoryAnalysis.filter(c => c.status === 'weak');
  
  // 2. Recommend for missing categories (high priority)
  missingCategories.forEach(({ category }) => {
    const categorySkills = POPULAR_SKILLS[category] || [];
    const topSkill = categorySkills[0];
    if (topSkill && !installedIds.has(topSkill.id)) {
      recommendations.push({
        id: topSkill.id,
        name: topSkill.name,
        category: topSkill.category,
        reason: `You have no ${category} skills. This is the most popular choice.`,
        priority: 'high',
        type: 'missing-category',
        confidence: 95,
      });
    }
  });
  
  // 3. Recommend for weak categories (medium priority)
  weakCategories.forEach(({ category }) => {
    const categorySkills = POPULAR_SKILLS[category] || [];
    const uninstalled = categorySkills.filter(s => !installedIds.has(s.id));
    if (uninstalled.length > 0) {
      const topSkill = uninstalled[0];
      recommendations.push({
        id: topSkill.id,
        name: topSkill.name,
        category: topSkill.category,
        reason: `Your ${category} coverage is weak. Consider adding more tools.`,
        priority: 'medium',
        type: 'missing-category',
        confidence: 80,
      });
    }
  });
  
  // 4. Find complementary skills for installed ones
  installedSkills.forEach(skill => {
    const complements = COMPLEMENTARY_SKILLS[skill.id.toLowerCase()];
    if (complements) {
      complements.forEach(compId => {
        if (!installedIds.has(compId)) {
          // Find skill info
          for (const skills of Object.values(POPULAR_SKILLS)) {
            const found = skills.find(s => s.id === compId);
            if (found) {
              recommendations.push({
                id: found.id,
                name: found.name,
                category: found.category,
                reason: `Works great with ${skill.name} you already have.`,
                priority: 'medium',
                type: 'complementary',
                confidence: 85,
              });
              break;
            }
          }
        }
      });
    }
  });
  
  // 5. Recommend popular skills not installed (low priority)
  Object.values(POPULAR_SKILLS).flat()
    .filter(s => s.popularity >= 90 && !installedIds.has(s.id))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)
    .forEach(skill => {
      // Skip if already recommended
      if (recommendations.some(r => r.id === skill.id)) return;
      
      recommendations.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        reason: `Top ${skill.popularity}% popularity among all users.`,
        priority: 'low',
        type: 'popular',
        confidence: 70,
      });
    });
  
  // Deduplicate and limit
  const seen = new Set<string>();
  return recommendations
    .filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .sort((a, b) => {
      // Sort by priority, then confidence
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    })
    .slice(0, maxRecommendations);
}

// ═══════════════════════════════════════════════════════════
// Get recommendation type icon
// ═══════════════════════════════════════════════════════════

export function getRecommendationIcon(type: SkillRecommendation['type']): string {
  switch (type) {
    case 'missing-category': return '📁';
    case 'popular': return '🔥';
    case 'complementary': return '🔗';
    case 'upgrade': return '⬆️';
    default: return '💡';
  }
}

export function getPriorityColor(priority: SkillRecommendation['priority']): string {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#6b7280';
  }
}
