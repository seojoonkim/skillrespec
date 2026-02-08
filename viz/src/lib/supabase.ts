// ═══════════════════════════════════════════════════════════
// Supabase Client Configuration
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Some features may be unavailable.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ═══════════════════════════════════════════════════════════
// Database Types (for future use)
// ═══════════════════════════════════════════════════════════

export interface SkillAnalysisRecord {
  id: string;
  created_at: string;
  skills_count: number;
  health_score: number;
  categories: Record<string, number>;
  data_hash: string;
}

export interface SkillUsageStats {
  skill_id: string;
  usage_count: number;
  last_seen: string;
}

// ═══════════════════════════════════════════════════════════
// Supabase API Functions
// ═══════════════════════════════════════════════════════════

export async function saveAnalysisResult(
  resultId: string,
  skillsCount: number,
  healthScore: number,
  categories: Record<string, number>
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('skill_analyses')
      .insert({
        id: resultId,
        skills_count: skillsCount,
        health_score: healthScore,
        categories: categories,
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getRecentAnalyses(limit = 10): Promise<SkillAnalysisRecord[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('skill_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('Failed to fetch analyses:', error);
      return [];
    }
    return data as SkillAnalysisRecord[];
  } catch {
    return [];
  }
}

export async function trackSkillUsage(skillId: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return;

  try {
    await supabase.rpc('increment_skill_usage', { skill_id_input: skillId });
  } catch (err) {
    console.error('Failed to track skill usage:', err);
  }
}

export async function getPopularSkills(limit = 20): Promise<SkillUsageStats[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('skill_usage')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }
    return data as SkillUsageStats[];
  } catch {
    return [];
  }
}

export default supabase;
