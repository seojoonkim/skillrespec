// ═══════════════════════════════════════════════════════════
// Skill History System - Track changes with rollback capability
// ═══════════════════════════════════════════════════════════

import { supabase } from './supabase';
import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type HistoryAction = 'install' | 'remove' | 'update' | 'config_change';

export interface SkillHistoryEntry {
  id: string;
  userId?: string;
  action: HistoryAction;
  skillId: string;
  skillName: string;
  skillsSnapshot: string[]; // List of skill IDs at this point
  previousVersion?: string;
  newVersion?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RollbackCommand {
  type: 'install' | 'remove';
  skillId: string;
  skillName: string;
  version?: string;
  command: string;
}

// ═══════════════════════════════════════════════════════════
// Local Storage Management
// ═══════════════════════════════════════════════════════════

const HISTORY_STORAGE_KEY = 'skillrespec_history';
const MAX_LOCAL_ENTRIES = 20;

/**
 * Get history from localStorage
 */
export function getLocalHistory(): SkillHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SkillHistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Save history entry to localStorage
 */
export function saveToLocalHistory(entry: SkillHistoryEntry): void {
  try {
    const history = getLocalHistory();
    history.unshift(entry); // Add to beginning
    
    // Keep only the most recent entries
    const trimmed = history.slice(0, MAX_LOCAL_ENTRIES);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

/**
 * Clear local history
 */
export function clearLocalHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

// ═══════════════════════════════════════════════════════════
// Supabase Integration
// ═══════════════════════════════════════════════════════════

/**
 * Save history entry to Supabase
 */
export async function saveHistoryToSupabase(
  entry: Omit<SkillHistoryEntry, 'id'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('skill_history')
      .insert({
        user_id: entry.userId,
        action: entry.action,
        skill_id: entry.skillId,
        skill_name: entry.skillName,
        skills_snapshot: entry.skillsSnapshot,
        previous_version: entry.previousVersion,
        new_version: entry.newVersion,
        metadata: entry.metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase history save error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch history from Supabase
 */
export async function fetchHistoryFromSupabase(
  userId?: string,
  limit = 50
): Promise<SkillHistoryEntry[]> {
  try {
    let query = supabase
      .from('skill_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Failed to fetch history:', error);
      return [];
    }

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string | undefined,
      action: row.action as HistoryAction,
      skillId: row.skill_id as string,
      skillName: row.skill_name as string,
      skillsSnapshot: row.skills_snapshot as string[],
      previousVersion: row.previous_version as string | undefined,
      newVersion: row.new_version as string | undefined,
      timestamp: row.timestamp as string,
      metadata: row.metadata as Record<string, unknown> | undefined,
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// History Recording
// ═══════════════════════════════════════════════════════════

/**
 * Record a skill change event
 */
export function recordSkillChange(
  action: HistoryAction,
  skill: { id: string; name: string; version?: string },
  currentSkills: SkillNode[],
  previousVersion?: string,
  metadata?: Record<string, unknown>
): SkillHistoryEntry {
  const entry: SkillHistoryEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    skillId: skill.id,
    skillName: skill.name,
    skillsSnapshot: currentSkills.map(s => s.id),
    previousVersion,
    newVersion: skill.version,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Save to localStorage
  saveToLocalHistory(entry);

  // Async save to Supabase (fire and forget)
  saveHistoryToSupabase(entry).catch(console.error);

  return entry;
}

// ═══════════════════════════════════════════════════════════
// Rollback Generation
// ═══════════════════════════════════════════════════════════

/**
 * Generate rollback commands to restore skills to a specific point
 */
export function generateRollbackCommands(
  targetSnapshot: string[],
  currentSkills: SkillNode[]
): RollbackCommand[] {
  const commands: RollbackCommand[] = [];
  const currentIds = new Set(currentSkills.map(s => s.id));
  const targetIds = new Set(targetSnapshot);

  // Skills to remove (in current but not in target)
  for (const skill of currentSkills) {
    if (!targetIds.has(skill.id)) {
      commands.push({
        type: 'remove',
        skillId: skill.id,
        skillName: skill.name,
        command: `clawdhub uninstall ${skill.id}`,
      });
    }
  }

  // Skills to install (in target but not in current)
  for (const skillId of targetSnapshot) {
    if (!currentIds.has(skillId)) {
      commands.push({
        type: 'install',
        skillId,
        skillName: skillId, // We might not have the name
        command: `clawdhub install ${skillId}`,
      });
    }
  }

  return commands;
}

/**
 * Get a summary of changes between two snapshots
 */
export function getSnapshotDiff(
  oldSnapshot: string[],
  newSnapshot: string[]
): { added: string[]; removed: string[]; unchanged: string[] } {
  const oldSet = new Set(oldSnapshot);
  const newSet = new Set(newSnapshot);

  const added = newSnapshot.filter(id => !oldSet.has(id));
  const removed = oldSnapshot.filter(id => !newSet.has(id));
  const unchanged = newSnapshot.filter(id => oldSet.has(id));

  return { added, removed, unchanged };
}

// ═══════════════════════════════════════════════════════════
// History Helpers
// ═══════════════════════════════════════════════════════════

/**
 * Get action display info
 */
export function getActionInfo(action: HistoryAction): {
  icon: string;
  label: string;
  color: string;
} {
  switch (action) {
    case 'install':
      return { icon: '📦', label: 'Installed', color: '#34d399' };
    case 'remove':
      return { icon: '🗑️', label: 'Removed', color: '#f87171' };
    case 'update':
      return { icon: '🔄', label: 'Updated', color: '#60a5fa' };
    case 'config_change':
      return { icon: '⚙️', label: 'Config Changed', color: '#fbbf24' };
  }
}

/**
 * Format timestamp for display
 */
export function formatHistoryTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Group history entries by date
 */
export function groupHistoryByDate(entries: SkillHistoryEntry[]): Map<string, SkillHistoryEntry[]> {
  const groups = new Map<string, SkillHistoryEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  }

  return groups;
}

export default {
  getLocalHistory,
  saveToLocalHistory,
  clearLocalHistory,
  recordSkillChange,
  generateRollbackCommands,
  getSnapshotDiff,
  getActionInfo,
  formatHistoryTimestamp,
  groupHistoryByDate,
};
