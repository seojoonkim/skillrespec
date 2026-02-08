// ═══════════════════════════════════════════════════════════
// Updates Panel - Version comparison and update management
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';
import {
  getAvailableUpdates,
  calculateVersionDiff,
  getChangeTypeInfo,
  getVersionJumpInfo,
  getImpactLevelInfo,
  getUpdateCommand,
  getBulkUpdateCommand,
  analyzeUpdateImpact,
  type SkillUpdate,
  type VersionDiff,
} from '../lib/versionDiff';
import type { SkillNode } from '../types';

interface UpdatesPanelProps {
  skills: SkillNode[];
  embedded?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Version Diff Modal
// ═══════════════════════════════════════════════════════════

function VersionDiffModal({
  diff,
  update,
  allSkills,
  onClose,
}: {
  diff: VersionDiff;
  update: SkillUpdate;
  allSkills: SkillNode[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const versionJumpInfo = getVersionJumpInfo(diff.versionJump);
  const impact = analyzeUpdateImpact(update, allSkills);

  const handleCopy = () => {
    navigator.clipboard.writeText(getUpdateCommand(update.skillId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div
        style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.xl,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
            }}>
              {diff.skillName}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
            }}>
              <span style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMuted,
              }}>
                {diff.currentVersion}
              </span>
              <span style={{ color: theme.colors.textMuted }}>→</span>
              <span style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.accent,
                fontWeight: theme.fontWeight.medium,
              }}>
                {diff.latestVersion}
              </span>
              <span style={{
                padding: '2px 8px',
                background: `${versionJumpInfo.color}20`,
                color: versionJumpInfo.color,
                borderRadius: theme.radius.full,
                fontSize: theme.fontSize.xs,
                fontWeight: theme.fontWeight.medium,
              }}>
                {versionJumpInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Impact Analysis */}
        {(impact.potentialIssues.length > 0 || update.newPermissions.length > 0) && (
          <div style={{
            padding: '16px 20px',
            background: update.hasSecurityFix 
              ? theme.colors.successGlow 
              : diff.breakingChanges 
                ? theme.colors.warningGlow 
                : theme.colors.bgTertiary,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textSecondary,
              marginBottom: '8px',
            }}>
              ⚡ Impact Analysis
            </div>

            {update.hasSecurityFix && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: theme.colors.success,
                borderRadius: theme.radius.md,
                marginBottom: '8px',
                color: '#fff',
                fontSize: theme.fontSize.sm,
              }}>
                🔒 Contains security fixes - Update recommended
              </div>
            )}

            {update.newPermissions.length > 0 && (
              <div style={{
                padding: '12px',
                background: theme.colors.bgSecondary,
                borderRadius: theme.radius.md,
                marginBottom: '8px',
                border: `1px solid ${theme.colors.warning}30`,
              }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.warning,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: '6px',
                }}>
                  ⚠️ New Permissions Required:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {update.newPermissions.map((perm, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        background: theme.colors.warningGlow,
                        color: theme.colors.warning,
                        borderRadius: theme.radius.sm,
                        fontSize: theme.fontSize.xs,
                        fontFamily: theme.fonts.mono,
                      }}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {impact.potentialIssues.length > 0 && (
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMuted,
              }}>
                {impact.potentialIssues.map((issue, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{issue}</li>
                ))}
              </ul>
            )}

            {impact.safeToUpdate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                fontSize: theme.fontSize.sm,
                color: theme.colors.success,
              }}>
                ✓ Safe to update - No breaking changes detected
              </div>
            )}
          </div>
        )}

        {/* Changes */}
        <div style={{ padding: '20px' }}>
          {diff.securityChanges.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                🔒 Security Changes
              </div>
              {diff.securityChanges.map((change, i) => {
                const typeInfo = getChangeTypeInfo(change.type);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px',
                      background: `${typeInfo.color}10`,
                      borderRadius: theme.radius.md,
                      marginBottom: '8px',
                      border: `1px solid ${typeInfo.color}30`,
                    }}
                  >
                    <span style={{
                      color: typeInfo.color,
                      fontFamily: theme.fonts.mono,
                      fontWeight: theme.fontWeight.bold,
                      fontSize: theme.fontSize.md,
                    }}>
                      {typeInfo.icon}
                    </span>
                    <div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textPrimary,
                      }}>
                        {change.description}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        marginTop: '2px',
                      }}>
                        {change.field}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {diff.changes.filter(c => c.type !== 'security').length > 0 && (
            <div>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: '12px',
              }}>
                📝 All Changes
              </div>
              {diff.changes.filter(c => c.type !== 'security').map((change, i) => {
                const typeInfo = getChangeTypeInfo(change.type);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 0',
                      borderBottom: i < diff.changes.length - diff.securityChanges.length - 1
                        ? `1px solid ${theme.colors.borderLight}`
                        : 'none',
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${typeInfo.color}20`,
                      color: typeInfo.color,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.bold,
                      fontFamily: theme.fonts.mono,
                    }}>
                      {typeInfo.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textPrimary,
                      }}>
                        {change.description}
                      </span>
                    </div>
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      color: change.severity === 'high' ? theme.colors.warning : theme.colors.textMuted,
                    }}>
                      {change.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {diff.changes.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: theme.colors.textMuted,
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
              <div>No detailed changelog available</div>
            </div>
          )}
        </div>

        {/* Update Button */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgTertiary,
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                padding: '12px',
                background: copied
                  ? theme.colors.success
                  : `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
                border: 'none',
                borderRadius: theme.radius.lg,
                color: theme.colors.bgPrimary,
                fontSize: theme.fontSize.md,
                fontWeight: theme.fontWeight.semibold,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Update Command'}
            </button>
          </div>
          <code style={{
            display: 'block',
            marginTop: '12px',
            padding: '8px 12px',
            background: theme.colors.bgPrimary,
            borderRadius: theme.radius.md,
            fontSize: theme.fontSize.sm,
            fontFamily: theme.fonts.mono,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}>
            {getUpdateCommand(update.skillId)}
          </code>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Update Card
// ═══════════════════════════════════════════════════════════

function UpdateCard({
  update,
  skill,
  allSkills,
  onViewDiff,
}: {
  update: SkillUpdate;
  skill: SkillNode;
  allSkills: SkillNode[];
  onViewDiff: () => void;
}) {
  const impactInfo = getImpactLevelInfo(update.impactLevel);

  return (
    <div style={{
      background: theme.colors.bgTertiary,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      padding: '14px',
      marginBottom: '10px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        {/* Impact indicator */}
        <div style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: impactInfo.bgColor,
          borderRadius: theme.radius.md,
          fontSize: '16px',
        }}>
          {impactInfo.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <span style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
            }}>
              {update.skillName}
            </span>
            <span style={{
              fontSize: theme.fontSize.xs,
              color: impactInfo.color,
              fontWeight: theme.fontWeight.medium,
            }}>
              {impactInfo.label}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            fontFamily: theme.fonts.mono,
            fontSize: theme.fontSize.xs,
          }}>
            <span style={{ color: theme.colors.textMuted }}>
              {update.currentVersion}
            </span>
            <span style={{ color: theme.colors.textMuted }}>→</span>
            <span style={{ color: theme.colors.accent }}>
              {update.latestVersion}
            </span>
          </div>

          {/* Tags */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '8px',
          }}>
            {update.hasSecurityFix && (
              <span style={{
                padding: '2px 6px',
                background: theme.colors.successGlow,
                color: theme.colors.success,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.xs,
              }}>
                🔒 Security Fix
              </span>
            )}
            {update.breakingChanges && (
              <span style={{
                padding: '2px 6px',
                background: theme.colors.warningGlow,
                color: theme.colors.warning,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.xs,
              }}>
                ⚠️ Breaking
              </span>
            )}
            {update.newPermissions.length > 0 && (
              <span style={{
                padding: '2px 6px',
                background: theme.colors.infoGlow,
                color: theme.colors.info,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.xs,
              }}>
                🔐 New Perms
              </span>
            )}
          </div>
        </div>

        {/* View button */}
        <button
          onClick={onViewDiff}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.xs,
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = theme.colors.accent;
            e.currentTarget.style.color = theme.colors.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          View Diff
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Panel
// ═══════════════════════════════════════════════════════════

export default function UpdatesPanel({ skills, embedded = false }: UpdatesPanelProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<SkillUpdate | null>(null);
  const [copied, setCopied] = useState(false);

  const updates = useMemo(() => getAvailableUpdates(skills), [skills]);
  
  const securityUpdates = updates.filter(u => u.hasSecurityFix);
  const breakingUpdates = updates.filter(u => u.breakingChanges && !u.hasSecurityFix);
  const regularUpdates = updates.filter(u => !u.hasSecurityFix && !u.breakingChanges);

  const selectedSkill = selectedUpdate 
    ? skills.find(s => s.id === selectedUpdate.skillId)
    : null;

  const selectedDiff = selectedUpdate && selectedSkill
    ? calculateVersionDiff(selectedSkill)
    : null;

  const handleBulkCopy = () => {
    const command = getBulkUpdateCommand(updates.map(u => u.skillId));
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerStyle = embedded ? {
    height: '100%',
    overflow: 'auto',
  } : {
    background: theme.colors.bgSecondary,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: embedded ? theme.colors.bgSecondary : 'transparent',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔄</span>
          <span style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            Updates
          </span>
          {updates.length > 0 && (
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.bgPrimary,
              background: securityUpdates.length > 0 ? theme.colors.error : theme.colors.accent,
              padding: '2px 8px',
              borderRadius: theme.radius.full,
              fontWeight: theme.fontWeight.medium,
            }}>
              {updates.length}
            </span>
          )}
        </div>

        {updates.length > 0 && (
          <button
            onClick={handleBulkCopy}
            style={{
              padding: '6px 12px',
              background: copied ? theme.colors.success : theme.colors.bgTertiary,
              border: `1px solid ${copied ? theme.colors.success : theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: copied ? theme.colors.bgPrimary : theme.colors.textMuted,
              fontSize: theme.fontSize.xs,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            {copied ? '✓ Copied' : 'Update All'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {updates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.textMuted,
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
            <div style={{ fontSize: theme.fontSize.sm }}>All skills are up to date</div>
            <div style={{
              fontSize: theme.fontSize.xs,
              marginTop: '4px',
              color: theme.colors.textSubtle,
            }}>
              You're running the latest versions
            </div>
          </div>
        ) : (
          <>
            {/* Security Updates */}
            {securityUpdates.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.error,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🚨 Security Updates ({securityUpdates.length})
                </div>
                {securityUpdates.map(update => {
                  const skill = skills.find(s => s.id === update.skillId);
                  if (!skill) return null;
                  return (
                    <UpdateCard
                      key={update.skillId}
                      update={update}
                      skill={skill}
                      allSkills={skills}
                      onViewDiff={() => setSelectedUpdate(update)}
                    />
                  );
                })}
              </div>
            )}

            {/* Breaking Updates */}
            {breakingUpdates.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.warning,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  ⚠️ Breaking Changes ({breakingUpdates.length})
                </div>
                {breakingUpdates.map(update => {
                  const skill = skills.find(s => s.id === update.skillId);
                  if (!skill) return null;
                  return (
                    <UpdateCard
                      key={update.skillId}
                      update={update}
                      skill={skill}
                      allSkills={skills}
                      onViewDiff={() => setSelectedUpdate(update)}
                    />
                  );
                })}
              </div>
            )}

            {/* Regular Updates */}
            {regularUpdates.length > 0 && (
              <div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  fontWeight: theme.fontWeight.medium,
                  marginBottom: '8px',
                }}>
                  Available Updates ({regularUpdates.length})
                </div>
                {regularUpdates.map(update => {
                  const skill = skills.find(s => s.id === update.skillId);
                  if (!skill) return null;
                  return (
                    <UpdateCard
                      key={update.skillId}
                      update={update}
                      skill={skill}
                      allSkills={skills}
                      onViewDiff={() => setSelectedUpdate(update)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Version Diff Modal */}
      {selectedUpdate && selectedDiff && selectedSkill && (
        <VersionDiffModal
          diff={selectedDiff}
          update={selectedUpdate}
          allSkills={skills}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </div>
  );
}

export { VersionDiffModal, UpdateCard };
