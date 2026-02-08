// ═══════════════════════════════════════════════════════════
// Usage Data Generator - Mock Analytics Data
// ═══════════════════════════════════════════════════════════

import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SkillUsage {
  skillId: string;
  skillName: string;
  category: string;
  invocations: number;
  errors: number;
  errorRate: number; // percentage
  avgResponseTime: number; // ms
  lastUsed: string; // ISO date
}

export interface HourlyTrend {
  hour: string; // "00:00", "01:00", etc.
  invocations: number;
  errors: number;
}

export interface DailyTrend {
  date: string; // "Mon", "Tue", etc. or "2024-01-15"
  invocations: number;
  errors: number;
}

export interface UsageStats {
  totalInvocations: number;
  totalErrors: number;
  overallErrorRate: number;
  avgResponseTime: number;
  mostUsedSkill: string;
  leastUsedSkill: string;
  skillUsage: SkillUsage[];
  hourlyTrend: HourlyTrend[];
  dailyTrend: DailyTrend[];
}

// ═══════════════════════════════════════════════════════════
// Mock Data Generation
// ═══════════════════════════════════════════════════════════

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// Seeded random for consistent results per skill
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export function generateSkillUsage(nodes: SkillNode[]): SkillUsage[] {
  return nodes.map(node => {
    const rng = seededRandom(node.id);
    
    // Base invocations influenced by category popularity
    const categoryMultiplier: Record<string, number> = {
      development: 1.5,
      productivity: 1.3,
      security: 1.2,
      data: 1.1,
      devops: 1.0,
      communication: 0.9,
      design: 0.8,
      media: 0.7,
      utility: 0.6,
      marketing: 0.5,
    };
    
    const multiplier = categoryMultiplier[node.category.toLowerCase()] || 1;
    const baseInvocations = Math.floor((rng() * 500 + 50) * multiplier);
    const invocations = baseInvocations + randomInt(-20, 50);
    
    // Error rate: 0-8%, mostly low
    const errorRate = rng() < 0.7 ? randomFloat(0, 2) : randomFloat(2, 8);
    const errors = Math.floor(invocations * (errorRate / 100));
    
    // Response time: 50-500ms, mostly fast
    const avgResponseTime = rng() < 0.8 
      ? randomInt(50, 150) 
      : randomInt(150, 500);
    
    // Last used: within last 7 days
    const daysAgo = Math.floor(rng() * 7);
    const lastUsed = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    return {
      skillId: node.id,
      skillName: node.name,
      category: node.category,
      invocations,
      errors,
      errorRate,
      avgResponseTime,
      lastUsed,
    };
  }).sort((a, b) => b.invocations - a.invocations);
}

export function generateHourlyTrend(): HourlyTrend[] {
  const hours: HourlyTrend[] = [];
  
  // Realistic usage pattern: low at night, peaks at 10am and 3pm
  const hourlyPattern = [
    5, 3, 2, 2, 3, 5,      // 00:00 - 05:00
    10, 25, 45, 70, 85, 80, // 06:00 - 11:00
    65, 70, 75, 85, 80, 70, // 12:00 - 17:00
    55, 45, 35, 25, 15, 8,  // 18:00 - 23:00
  ];
  
  for (let h = 0; h < 24; h++) {
    const baseInvocations = hourlyPattern[h] * randomInt(8, 12);
    const invocations = baseInvocations + randomInt(-10, 20);
    const errors = Math.floor(invocations * randomFloat(0.01, 0.05));
    
    hours.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      invocations: Math.max(0, invocations),
      errors: Math.max(0, errors),
    });
  }
  
  return hours;
}

export function generateDailyTrend(): DailyTrend[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Weekday higher than weekend
  const dayPattern = [1.0, 1.1, 1.2, 1.1, 0.9, 0.4, 0.3];
  
  return days.map((day, i) => {
    const baseInvocations = 1000 * dayPattern[i];
    const invocations = Math.floor(baseInvocations + randomInt(-100, 150));
    const errors = Math.floor(invocations * randomFloat(0.02, 0.04));
    
    return {
      date: day,
      invocations: Math.max(0, invocations),
      errors: Math.max(0, errors),
    };
  });
}

// ═══════════════════════════════════════════════════════════
// Full Stats Generator
// ═══════════════════════════════════════════════════════════

export function generateUsageStats(nodes: SkillNode[]): UsageStats {
  const skillUsage = generateSkillUsage(nodes);
  const hourlyTrend = generateHourlyTrend();
  const dailyTrend = generateDailyTrend();
  
  const totalInvocations = skillUsage.reduce((sum, s) => sum + s.invocations, 0);
  const totalErrors = skillUsage.reduce((sum, s) => sum + s.errors, 0);
  const overallErrorRate = totalInvocations > 0 
    ? parseFloat(((totalErrors / totalInvocations) * 100).toFixed(2))
    : 0;
  
  const avgResponseTime = skillUsage.length > 0
    ? Math.round(skillUsage.reduce((sum, s) => sum + s.avgResponseTime, 0) / skillUsage.length)
    : 0;
  
  const sortedByUsage = [...skillUsage].sort((a, b) => b.invocations - a.invocations);
  const mostUsedSkill = sortedByUsage[0]?.skillName || 'N/A';
  const leastUsedSkill = sortedByUsage[sortedByUsage.length - 1]?.skillName || 'N/A';
  
  return {
    totalInvocations,
    totalErrors,
    overallErrorRate,
    avgResponseTime,
    mostUsedSkill,
    leastUsedSkill,
    skillUsage,
    hourlyTrend,
    dailyTrend,
  };
}

// ═══════════════════════════════════════════════════════════
// Category-wise Usage Summary
// ═══════════════════════════════════════════════════════════

export interface CategoryUsage {
  category: string;
  invocations: number;
  percentage: number;
}

export function getCategoryUsage(skillUsage: SkillUsage[]): CategoryUsage[] {
  const categoryMap: Record<string, number> = {};
  
  skillUsage.forEach(s => {
    const cat = s.category.toLowerCase();
    categoryMap[cat] = (categoryMap[cat] || 0) + s.invocations;
  });
  
  const total = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
  
  return Object.entries(categoryMap)
    .map(([category, invocations]) => ({
      category,
      invocations,
      percentage: parseFloat(((invocations / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.invocations - a.invocations);
}
