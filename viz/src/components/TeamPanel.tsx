// ═══════════════════════════════════════════════════════════
// Team Panel - Team Sync & Skill Pack Management
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { theme } from '../styles/theme';
import {
  createTeam,
  getTeams,
  joinTeamByCode,
  getTeamMembers,
  getTeamSkillPacks,
  createSkillPack,
  generateBatchInstallCommand,
  isMockMode,
  type Team,
  type TeamMember,
  type TeamSkillPack,
} from '../lib/team';
import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Mock User ID (in real app, from auth)
// ═══════════════════════════════════════════════════════════
const MOCK_USER_ID = 'user-1';

// ═══════════════════════════════════════════════════════════
// Toast Component
// ═══════════════════════════════════════════════════════════
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(20px)'}`,
      padding: '10px 20px',
      background: theme.colors.bgElevated,
      border: `1px solid ${theme.colors.accent}`,
      borderRadius: theme.radius.full,
      color: theme.colors.textPrimary,
      fontSize: theme.fontSize.sm,
      fontFamily: theme.fonts.mono,
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'all 0.2s ease',
      pointerEvents: 'none',
      boxShadow: `0 4px 20px ${theme.colors.accentGlow}`,
    }}>
      ✓ {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Skill Pack Card
// ═══════════════════════════════════════════════════════════
interface SkillPackCardProps {
  pack: TeamSkillPack;
  onDeploy: (skills: string[]) => void;
}

function SkillPackCard({ pack, onDeploy }: SkillPackCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>📦</span>
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
            }}>
              {pack.name}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
            }}>
              {pack.skills.length} skills
            </div>
          </div>
        </div>
        <span style={{
          color: theme.colors.textMuted,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: theme.transitions.fast,
        }}>
          ▼
        </span>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div style={{
          padding: '0 14px 14px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          {pack.description && (
            <p style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
              margin: '10px 0',
              lineHeight: 1.5,
            }}>
              {pack.description}
            </p>
          )}
          
          {/* Skills List */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '10px',
          }}>
            {pack.skills.map(skill => (
              <span
                key={skill}
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.mono,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
          
          {/* Deploy Button */}
          <button
            onClick={() => onDeploy(pack.skills)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
              border: 'none',
              borderRadius: theme.radius.sm,
              color: theme.colors.bgPrimary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: theme.fonts.sans,
            }}
          >
            🚀 Deploy to My Skills
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Team Panel
// ═══════════════════════════════════════════════════════════
interface TeamPanelProps {
  embedded?: boolean;
  activeSkills?: SkillNode[];
}

export default function TeamPanel({ embedded = false, activeSkills = [] }: TeamPanelProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [skillPacks, setSkillPacks] = useState<TeamSkillPack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showCreatePack, setShowCreatePack] = useState(false);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [selectedSkillsForPack, setSelectedSkillsForPack] = useState<Set<string>>(new Set());
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      const userTeams = await getTeams(MOCK_USER_ID);
      setTeams(userTeams);
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0]);
      }
      setLoading(false);
    };
    loadTeams();
  }, []);

  // Load team data when selected team changes
  useEffect(() => {
    if (!selectedTeam) return;
    
    const loadTeamData = async () => {
      const [teamMembers, teamPacks] = await Promise.all([
        getTeamMembers(selectedTeam.id),
        getTeamSkillPacks(selectedTeam.id),
      ]);
      setMembers(teamMembers);
      setSkillPacks(teamPacks);
    };
    loadTeamData();
  }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    const { team, error } = await createTeam(newTeamName.trim(), MOCK_USER_ID);
    if (error) {
      showToast(`Error: ${error}`);
      return;
    }
    
    if (team) {
      setTeams([...teams, team]);
      setSelectedTeam(team);
      setNewTeamName('');
      setShowCreateTeam(false);
      showToast(`Team "${team.name}" created!`);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) return;
    
    const { team, error } = await joinTeamByCode(inviteCode.trim(), MOCK_USER_ID);
    if (error) {
      showToast(`Error: ${error}`);
      return;
    }
    
    if (team) {
      setTeams([...teams, team]);
      setSelectedTeam(team);
      setInviteCode('');
      setShowJoinTeam(false);
      showToast(`Joined "${team.name}"!`);
    }
  };

  const handleCreateSkillPack = async () => {
    if (!selectedTeam || !newPackName.trim() || selectedSkillsForPack.size === 0) return;
    
    const { pack, error } = await createSkillPack(
      selectedTeam.id,
      newPackName.trim(),
      Array.from(selectedSkillsForPack),
      MOCK_USER_ID,
      newPackDesc.trim() || undefined
    );
    
    if (error) {
      showToast(`Error: ${error}`);
      return;
    }
    
    if (pack) {
      setSkillPacks([pack, ...skillPacks]);
      setNewPackName('');
      setNewPackDesc('');
      setSelectedSkillsForPack(new Set());
      setShowCreatePack(false);
      showToast(`Skill pack "${pack.name}" created!`);
    }
  };

  const handleDeployPack = (skills: string[]) => {
    const command = generateBatchInstallCommand(skills);
    navigator.clipboard.writeText(command);
    showToast('Install command copied!');
  };

  const copyInviteCode = () => {
    if (selectedTeam?.invite_code) {
      navigator.clipboard.writeText(selectedTeam.invite_code);
      showToast('Invite code copied!');
    }
  };

  const containerStyle: React.CSSProperties = {
    background: embedded ? 'transparent' : theme.colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: theme.colors.textMuted }}>Loading teams...</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgTertiary,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            👥 Team Sync
          </h2>
          {isMockMode() && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: theme.colors.warning + '20',
              color: theme.colors.warning,
              borderRadius: theme.radius.sm,
            }}>
              MOCK
            </span>
          )}
        </div>
        
        {/* Team Selector / Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {teams.length > 0 ? (
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
              }}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                fontFamily: theme.fonts.sans,
              }}
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          ) : (
            <span style={{
              flex: 1,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              alignSelf: 'center',
            }}>
              No teams yet
            </span>
          )}
          
          <button
            onClick={() => setShowCreateTeam(true)}
            style={{
              padding: '8px 12px',
              background: theme.colors.accent + '20',
              border: `1px solid ${theme.colors.accent}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.accent,
              fontSize: theme.fontSize.sm,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            + New
          </button>
          <button
            onClick={() => setShowJoinTeam(true)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            Join
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Create Team Modal */}
        {showCreateTeam && (
          <div style={{
            marginBottom: '16px',
            padding: '14px',
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '10px',
            }}>
              Create New Team
            </div>
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                marginBottom: '10px',
                fontFamily: theme.fonts.sans,
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateTeam}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: theme.colors.accent,
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  color: theme.colors.bgPrimary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateTeam(false)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Join Team Modal */}
        {showJoinTeam && (
          <div style={{
            marginBottom: '16px',
            padding: '14px',
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '10px',
            }}>
              Join Team
            </div>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                marginBottom: '10px',
                fontFamily: theme.fonts.mono,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
              maxLength={6}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleJoinTeam}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: theme.colors.accent,
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  color: theme.colors.bgPrimary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                Join
              </button>
              <button
                onClick={() => setShowJoinTeam(false)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedTeam && (
          <>
            {/* Invite Code */}
            <div style={{
              padding: '12px 14px',
              background: theme.colors.bgTertiary,
              borderRadius: theme.radius.md,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                  marginBottom: '4px',
                }}>
                  Invite Code
                </div>
                <div style={{
                  fontSize: theme.fontSize.lg,
                  fontFamily: theme.fonts.mono,
                  color: theme.colors.accent,
                  letterSpacing: '0.15em',
                }}>
                  {selectedTeam.invite_code || 'N/A'}
                </div>
              </div>
              <button
                onClick={copyInviteCode}
                style={{
                  padding: '6px 10px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.xs,
                  cursor: 'pointer',
                }}
              >
                📋 Copy
              </button>
            </div>

            {/* Members */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>👤</span> Members ({members.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {members.map(member => (
                  <span
                    key={member.user_id}
                    style={{
                      fontSize: theme.fontSize.xs,
                      padding: '4px 10px',
                      background: member.role === 'owner' ? theme.colors.accent + '20' : theme.colors.bgTertiary,
                      border: `1px solid ${member.role === 'owner' ? theme.colors.accent : theme.colors.border}`,
                      borderRadius: theme.radius.full,
                      color: member.role === 'owner' ? theme.colors.accent : theme.colors.textSecondary,
                    }}
                  >
                    {member.display_name || member.user_id}
                    {member.role === 'owner' && ' 👑'}
                  </span>
                ))}
              </div>
            </div>

            {/* Skill Packs */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>📦</span> Team Skill Packs
                </div>
                <button
                  onClick={() => setShowCreatePack(true)}
                  style={{
                    padding: '4px 10px',
                    background: 'transparent',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.xs,
                    cursor: 'pointer',
                  }}
                >
                  + New Pack
                </button>
              </div>

              {/* Create Pack Modal */}
              {showCreatePack && (
                <div style={{
                  marginBottom: '12px',
                  padding: '14px',
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.accent}`,
                }}>
                  <input
                    value={newPackName}
                    onChange={(e) => setNewPackName(e.target.value)}
                    placeholder="Pack name..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: theme.colors.bgSecondary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      color: theme.colors.textPrimary,
                      fontSize: theme.fontSize.sm,
                      marginBottom: '8px',
                      fontFamily: theme.fonts.sans,
                    }}
                  />
                  <input
                    value={newPackDesc}
                    onChange={(e) => setNewPackDesc(e.target.value)}
                    placeholder="Description (optional)..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: theme.colors.bgSecondary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                      color: theme.colors.textPrimary,
                      fontSize: theme.fontSize.sm,
                      marginBottom: '10px',
                      fontFamily: theme.fonts.sans,
                    }}
                  />
                  
                  {/* Select Skills */}
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                    marginBottom: '6px',
                  }}>
                    Select skills to include ({selectedSkillsForPack.size} selected)
                  </div>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    background: theme.colors.bgSecondary,
                    borderRadius: theme.radius.sm,
                    padding: '8px',
                    marginBottom: '10px',
                  }}>
                    {activeSkills.map(skill => (
                      <label
                        key={skill.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          borderRadius: theme.radius.sm,
                          background: selectedSkillsForPack.has(skill.id) ? theme.colors.accent + '10' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSkillsForPack.has(skill.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedSkillsForPack);
                            if (e.target.checked) {
                              newSet.add(skill.id);
                            } else {
                              newSet.delete(skill.id);
                            }
                            setSelectedSkillsForPack(newSet);
                          }}
                          style={{ accentColor: theme.colors.accent }}
                        />
                        <span style={{
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.textSecondary,
                        }}>
                          {skill.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCreateSkillPack}
                      disabled={!newPackName.trim() || selectedSkillsForPack.size === 0}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: newPackName.trim() && selectedSkillsForPack.size > 0
                          ? theme.colors.accent
                          : theme.colors.bgElevated,
                        border: 'none',
                        borderRadius: theme.radius.sm,
                        color: newPackName.trim() && selectedSkillsForPack.size > 0
                          ? theme.colors.bgPrimary
                          : theme.colors.textMuted,
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.medium,
                        cursor: newPackName.trim() && selectedSkillsForPack.size > 0
                          ? 'pointer'
                          : 'not-allowed',
                      }}
                    >
                      Create Pack
                    </button>
                    <button
                      onClick={() => {
                        setShowCreatePack(false);
                        setSelectedSkillsForPack(new Set());
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radius.sm,
                        color: theme.colors.textMuted,
                        fontSize: theme.fontSize.sm,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Pack List */}
              {skillPacks.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                }}>
                  No skill packs yet. Create one to share with your team!
                </div>
              ) : (
                skillPacks.map(pack => (
                  <SkillPackCard
                    key={pack.id}
                    pack={pack}
                    onDeploy={handleDeployPack}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
