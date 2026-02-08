// ═══════════════════════════════════════════════════════════
// Preset Panel - Skill Profile Management
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { theme } from '../styles/theme';
import {
  getAllPresets,
  createPreset,
  deletePreset,
  getActivePresetId,
  setActivePresetId,
  type SkillPreset,
} from '../lib/presets';
import type { SkillNode } from '../types';

interface PresetPanelProps {
  activeSkills?: SkillNode[];
  onApplyPreset?: (skillIds: string[]) => void;
  embedded?: boolean;
}

export default function PresetPanel({
  activeSkills = [],
  onApplyPreset,
  embedded = false,
}: PresetPanelProps) {
  const [presets, setPresets] = useState<SkillPreset[]>([]);
  const [activePresetId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    const all = await getAllPresets();
    setPresets(all);
    setActiveId(getActivePresetId());
    setLoading(false);
  };

  const handleApply = (preset: SkillPreset) => {
    setActivePresetId(preset.id);
    setActiveId(preset.id);
    if (onApplyPreset) {
      onApplyPreset(preset.skills);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    const skillIds = activeSkills.map((s) => s.id);
    await createPreset(newName, skillIds, newDesc, newIcon);
    
    setNewName('');
    setNewDesc('');
    setNewIcon('📦');
    setShowCreate(false);
    loadPresets();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this preset?')) {
      await deletePreset(id);
      loadPresets();
    }
  };

  const ICON_OPTIONS = ['📦', '💻', '✍️', '🔒', '⚡', '🚀', '🎯', '🔧', '📊', '🌐', '🎨', '📁'];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: embedded ? 'transparent' : theme.colors.bgSecondary,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🎛️</span>
        <span style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
        }}>
          Skill Presets
        </span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            background: showCreate ? theme.colors.bgElevated : 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.full,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            fontFamily: theme.fonts.sans,
          }}
        >
          {showCreate ? '✕ Cancel' : '+ Create'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            marginBottom: '4px',
          }}>
            Save current {activeSkills.length} active skills as a preset
          </div>

          {/* Icon picker */}
          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}>
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setNewIcon(icon)}
                style={{
                  padding: '6px 8px',
                  background: newIcon === icon ? theme.colors.bgElevated : 'transparent',
                  border: `1px solid ${newIcon === icon ? theme.colors.accent : theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Preset name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: '8px 12px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              outline: 'none',
              fontFamily: theme.fonts.sans,
            }}
          />

          <input
            type="text"
            placeholder="Description (optional)..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{
              padding: '8px 12px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              outline: 'none',
              fontFamily: theme.fonts.sans,
            }}
          />

          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{
              padding: '8px',
              background: newName.trim()
                ? `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`
                : theme.colors.bgElevated,
              border: 'none',
              borderRadius: theme.radius.sm,
              color: newName.trim() ? theme.colors.bgPrimary : theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              cursor: newName.trim() ? 'pointer' : 'default',
              fontFamily: theme.fonts.sans,
            }}
          >
            💾 Save Preset
          </button>
        </div>
      )}

      {/* Presets List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            color: theme.colors.textMuted,
          }}>
            Loading presets...
          </div>
        ) : (
          presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: isActive ? theme.colors.accentMuted : theme.colors.bgTertiary,
                  border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  transition: theme.transitions.fast,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '18px' }}>{preset.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        fontSize: theme.fontSize.md,
                        fontWeight: theme.fontWeight.semibold,
                        color: theme.colors.textPrimary,
                      }}>
                        {preset.name}
                      </span>
                      {preset.isDefault && (
                        <span style={{
                          fontSize: theme.fontSize.xs,
                          padding: '2px 6px',
                          background: theme.colors.bgElevated,
                          color: theme.colors.textMuted,
                          borderRadius: theme.radius.full,
                        }}>
                          Default
                        </span>
                      )}
                      {isActive && (
                        <span style={{
                          fontSize: theme.fontSize.xs,
                          padding: '2px 6px',
                          background: theme.colors.accentGlow,
                          color: theme.colors.accent,
                          borderRadius: theme.radius.full,
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textMuted,
                      margin: 0,
                    }}>
                      {preset.description || `${preset.skills.length === 0 ? 'All' : preset.skills.length} skills`}
                    </p>
                  </div>
                </div>

                {/* Skills preview */}
                {preset.skills.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                    marginBottom: '10px',
                    maxHeight: '48px',
                    overflow: 'hidden',
                  }}>
                    {preset.skills.slice(0, 6).map((skillId) => (
                      <span
                        key={skillId}
                        style={{
                          fontSize: theme.fontSize.xs,
                          padding: '2px 6px',
                          background: theme.colors.bgElevated,
                          color: theme.colors.textSecondary,
                          borderRadius: theme.radius.sm,
                        }}
                      >
                        {skillId}
                      </span>
                    ))}
                    {preset.skills.length > 6 && (
                      <span style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        padding: '2px 4px',
                      }}>
                        +{preset.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                }}>
                  <button
                    onClick={() => handleApply(preset)}
                    disabled={isActive}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isActive ? theme.colors.bgElevated : theme.colors.accent,
                      border: 'none',
                      borderRadius: theme.radius.sm,
                      color: isActive ? theme.colors.textMuted : theme.colors.bgPrimary,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      cursor: isActive ? 'default' : 'pointer',
                      fontFamily: theme.fonts.sans,
                      opacity: isActive ? 0.6 : 1,
                    }}
                  >
                    {isActive ? '✓ Active' : '▶ Apply'}
                  </button>
                  {!preset.isDefault && (
                    <button
                      onClick={() => handleDelete(preset.id)}
                      style={{
                        padding: '6px 10px',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.error}30`,
                        borderRadius: theme.radius.sm,
                        color: theme.colors.error,
                        fontSize: theme.fontSize.xs,
                        cursor: 'pointer',
                        fontFamily: theme.fonts.sans,
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
      }}>
        Presets sync with Supabase + local storage
      </div>
    </div>
  );
}
