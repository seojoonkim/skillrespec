// ═══════════════════════════════════════════════════════════
// Skill Presets / Profiles System
// Supports Supabase sync + Local Storage offline fallback
// ═══════════════════════════════════════════════════════════

import { supabase } from './supabase';

export interface SkillPreset {
  id: string;
  name: string;
  description: string;
  skills: string[];       // Skill IDs that are active
  icon: string;           // Emoji icon
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;    // Built-in presets
}

// ═══════════════════════════════════════════════════════════
// Default Presets (Built-in)
// ═══════════════════════════════════════════════════════════

export const DEFAULT_PRESETS: SkillPreset[] = [
  {
    id: 'preset-coding',
    name: '💻 Coding Mode',
    description: 'Development-focused skills for coding sessions',
    skills: ['code-reviewer', 'git-workflow', 'shell-master', 'api-tester', 'db-manager'],
    icon: '💻',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDefault: true,
  },
  {
    id: 'preset-writing',
    name: '✍️ Writing Mode',
    description: 'Documentation and content creation focus',
    skills: ['doc-writer', 'markdown-pro', 'data-viz'],
    icon: '✍️',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDefault: true,
  },
  {
    id: 'preset-security',
    name: '🔒 Security Mode',
    description: 'Security-focused with defense skills enabled',
    skills: ['prompt-guard', 'hivefence', 'code-reviewer'],
    icon: '🔒',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDefault: true,
  },
  {
    id: 'preset-minimal',
    name: '⚡ Minimal Mode',
    description: 'Lightweight setup for fast responses',
    skills: ['shell-master', 'markdown-pro'],
    icon: '⚡',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDefault: true,
  },
  {
    id: 'preset-full',
    name: '🚀 Full Power',
    description: 'All skills enabled for maximum capability',
    skills: [], // Empty = all skills active
    icon: '🚀',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDefault: true,
  },
];

const LOCAL_STORAGE_KEY = 'skillrespec_presets';
const ACTIVE_PRESET_KEY = 'skillrespec_active_preset';

// ═══════════════════════════════════════════════════════════
// Local Storage Operations
// ═══════════════════════════════════════════════════════════

export function getLocalPresets(): SkillPreset[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load local presets:', e);
  }
  return [];
}

export function saveLocalPresets(presets: SkillPreset[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save local presets:', e);
  }
}

export function getActivePresetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PRESET_KEY);
  } catch {
    return null;
  }
}

export function setActivePresetId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PRESET_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    }
  } catch (e) {
    console.error('Failed to save active preset:', e);
  }
}

// ═══════════════════════════════════════════════════════════
// Supabase Operations
// ═══════════════════════════════════════════════════════════

export async function fetchPresetsFromSupabase(): Promise<SkillPreset[]> {
  try {
    const { data, error } = await supabase
      .from('skill_presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed, using local:', error.message);
      return getLocalPresets();
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      skills: row.skills || [],
      icon: row.icon || '📦',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDefault: false,
    }));
  } catch {
    return getLocalPresets();
  }
}

export async function savePresetToSupabase(preset: SkillPreset): Promise<boolean> {
  try {
    const { error } = await supabase.from('skill_presets').upsert({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      skills: preset.skills,
      icon: preset.icon,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase save failed:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deletePresetFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('skill_presets').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete failed:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// Combined Operations (Sync both local + Supabase)
// ═══════════════════════════════════════════════════════════

export async function getAllPresets(): Promise<SkillPreset[]> {
  // Get user presets (try Supabase first, fallback to local)
  const userPresets = await fetchPresetsFromSupabase();
  
  // Merge with defaults (defaults first, then user presets)
  return [...DEFAULT_PRESETS, ...userPresets];
}

export async function createPreset(
  name: string,
  skills: string[],
  description = '',
  icon = '📦'
): Promise<SkillPreset> {
  const preset: SkillPreset = {
    id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    skills,
    icon,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
  };

  // Save to both local and Supabase
  const localPresets = getLocalPresets();
  saveLocalPresets([...localPresets, preset]);
  
  await savePresetToSupabase(preset);

  return preset;
}

export async function updatePreset(preset: SkillPreset): Promise<boolean> {
  if (preset.isDefault) return false; // Can't modify defaults

  const updated = { ...preset, updatedAt: new Date().toISOString() };

  // Update local
  const localPresets = getLocalPresets();
  const index = localPresets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    localPresets[index] = updated;
    saveLocalPresets(localPresets);
  }

  // Update Supabase
  return await savePresetToSupabase(updated);
}

export async function deletePreset(id: string): Promise<boolean> {
  // Don't delete defaults
  if (DEFAULT_PRESETS.some((p) => p.id === id)) return false;

  // Remove from local
  const localPresets = getLocalPresets();
  saveLocalPresets(localPresets.filter((p) => p.id !== id));

  // Remove from Supabase
  await deletePresetFromSupabase(id);

  // Clear active if it was this one
  if (getActivePresetId() === id) {
    setActivePresetId(null);
  }

  return true;
}

export function generatePresetId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
