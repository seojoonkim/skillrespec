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

// ═══════════════════════════════════════════════════════════
// Skill Reviews API
// ═══════════════════════════════════════════════════════════

export interface SkillReview {
  id: string;
  skill_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
}

export interface SkillReviewStats {
  skill_id: string;
  average_rating: number;
  review_count: number;
}

// Get reviews for a specific skill
export async function getSkillReviews(
  skillId: string,
  limit = 10
): Promise<SkillReview[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return generateMockReviews(skillId, limit);
  }

  try {
    const { data, error } = await supabase
      .from('skill_reviews')
      .select('*')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return generateMockReviews(skillId, limit);
    }
    return data as SkillReview[];
  } catch {
    return generateMockReviews(skillId, limit);
  }
}

// Get average rating for a skill
export async function getSkillRatingStats(
  skillId: string
): Promise<SkillReviewStats | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return generateMockRatingStats(skillId);
  }

  try {
    const { data, error } = await supabase
      .from('skill_reviews')
      .select('rating')
      .eq('skill_id', skillId);

    if (error || !data || data.length === 0) {
      return generateMockRatingStats(skillId);
    }

    const ratings = data.map(r => r.rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    return {
      skill_id: skillId,
      average_rating: parseFloat(avgRating.toFixed(1)),
      review_count: ratings.length,
    };
  } catch {
    return generateMockRatingStats(skillId);
  }
}

// Submit or update a review
export async function submitSkillReview(
  skillId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string; review?: SkillReview }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock success for demo
    return {
      success: true,
      review: {
        id: `mock-${Date.now()}`,
        skill_id: skillId,
        user_id: userId,
        rating,
        comment,
        created_at: new Date().toISOString(),
        user_name: 'You',
      },
    };
  }

  try {
    // Check if user already has a review
    const { data: existing } = await supabase
      .from('skill_reviews')
      .select('id')
      .eq('skill_id', skillId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from('skill_reviews')
        .update({ rating, comment, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, review: data as SkillReview };
    } else {
      // Insert new review
      const { data, error } = await supabase
        .from('skill_reviews')
        .insert({ skill_id: skillId, user_id: userId, rating, comment })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, review: data as SkillReview };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Delete a review
export async function deleteSkillReview(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('skill_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// Mock Data Generators (for demo/offline mode)
// ═══════════════════════════════════════════════════════════

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

const mockUserNames = [
  'dev_ninja', 'code_wizard', 'agent_builder', 'ai_enthusiast',
  'skill_master', 'prompt_pro', 'automation_ace', 'data_guru',
];

const mockComments = [
  'Works great for my workflow!',
  'Solid skill, recommend it.',
  'Could use better documentation.',
  'Exactly what I needed.',
  'Good but had some issues initially.',
  'Perfect integration with my setup.',
  'Very reliable and fast.',
  'Nice skill, minor improvements needed.',
  'Essential for my daily tasks.',
  'Clean implementation, love it!',
];

function generateMockReviews(skillId: string, limit: number): SkillReview[] {
  const rng = seededRandom(skillId);
  const count = Math.min(limit, Math.floor(rng() * 8) + 2);
  const reviews: SkillReview[] = [];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rng() * 60);
    const rating = Math.floor(rng() * 3) + 3; // 3-5 mostly positive
    
    reviews.push({
      id: `mock-${skillId}-${i}`,
      skill_id: skillId,
      user_id: `user-${i}`,
      rating,
      comment: mockComments[Math.floor(rng() * mockComments.length)],
      created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      user_name: mockUserNames[Math.floor(rng() * mockUserNames.length)],
    });
  }

  return reviews.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function generateMockRatingStats(skillId: string): SkillReviewStats {
  const rng = seededRandom(skillId);
  const avgRating = 3.5 + rng() * 1.5; // 3.5-5.0
  const reviewCount = Math.floor(rng() * 50) + 5;

  return {
    skill_id: skillId,
    average_rating: parseFloat(avgRating.toFixed(1)),
    review_count: reviewCount,
  };
}

export default supabase;
