// ═══════════════════════════════════════════════════════════
// Marketplace Panel - ClawHub Skill Discovery
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { theme } from '../styles/theme';
import { 
  fetchPopularSkills, 
  searchSkills, 
  getInstallCommand, 
  formatDownloads,
  type ClawHubSkill 
} from '../lib/clawhub';
import type { SkillNode } from '../types';

interface MarketplacePanelProps {
  installedSkills?: SkillNode[];
  embedded?: boolean;
}

export default function MarketplacePanel({ 
  installedSkills = [],
  embedded = false 
}: MarketplacePanelProps) {
  const [skills, setSkills] = useState<ClawHubSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'stars' | 'recent'>('downloads');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    const data = await fetchPopularSkills();
    setSkills(data);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchSkills(query);
      setSkills(results);
    } else {
      loadSkills();
    }
  };

  const handleCopyInstall = (slug: string) => {
    const cmd = getInstallCommand(slug);
    navigator.clipboard.writeText(cmd);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const isInstalled = (skillId: string): boolean => {
    return installedSkills.some(s => 
      s.id.toLowerCase() === skillId.toLowerCase() ||
      s.name.toLowerCase().includes(skillId.toLowerCase())
    );
  };

  const sortedSkills = [...skills].sort((a, b) => {
    switch (sortBy) {
      case 'stars': return b.stars - a.stars;
      case 'recent': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default: return b.downloads - a.downloads;
    }
  });

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
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>🏪</span>
          <span style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
          }}>
            ClawHub Marketplace
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
            padding: '2px 8px',
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.full,
          }}>
            {skills.length} skills
          </span>
        </div>

        {/* Search */}
        <div style={{
          position: 'relative',
        }}>
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              outline: 'none',
              fontFamily: theme.fonts.sans,
            }}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            opacity: 0.5,
          }}>
            🔍
          </span>
        </div>

        {/* Sort buttons */}
        <div style={{
          display: 'flex',
          gap: '6px',
        }}>
          {[
            { id: 'downloads', label: '⬇️ Downloads' },
            { id: 'stars', label: '⭐ Stars' },
            { id: 'recent', label: '🕐 Recent' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSortBy(id as typeof sortBy)}
              style={{
                flex: 1,
                padding: '6px 10px',
                background: sortBy === id ? theme.colors.bgElevated : 'transparent',
                border: `1px solid ${sortBy === id ? theme.colors.accent : theme.colors.border}`,
                borderRadius: theme.radius.sm,
                color: sortBy === id ? theme.colors.accent : theme.colors.textMuted,
                fontSize: theme.fontSize.xs,
                cursor: 'pointer',
                fontFamily: theme.fonts.sans,
                transition: theme.transitions.fast,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills List */}
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
            fontSize: theme.fontSize.sm,
          }}>
            Loading skills...
          </div>
        ) : sortedSkills.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100px',
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
          }}>
            No skills found
          </div>
        ) : (
          sortedSkills.map((skill) => {
            const installed = isInstalled(skill.id);
            return (
              <div
                key={skill.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  transition: theme.transitions.fast,
                }}
              >
                {/* Top row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '8px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontSize: theme.fontSize.md,
                        fontWeight: theme.fontWeight.semibold,
                        color: theme.colors.textPrimary,
                      }}>
                        {skill.name}
                      </span>
                      {skill.verified && (
                        <span title="Verified" style={{ fontSize: '12px' }}>✅</span>
                      )}
                      {installed && (
                        <span style={{
                          fontSize: theme.fontSize.xs,
                          padding: '2px 6px',
                          background: theme.colors.successGlow,
                          color: theme.colors.success,
                          borderRadius: theme.radius.full,
                        }}>
                          Installed
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {skill.description}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  <span>⬇️ {formatDownloads(skill.downloads)}</span>
                  <span>⭐ {skill.stars}</span>
                  <span>v{skill.version}</span>
                  <span style={{ 
                    padding: '2px 6px',
                    background: theme.categoryColors[skill.category] ? 
                      `${theme.categoryColors[skill.category]}20` : 
                      theme.colors.bgElevated,
                    color: theme.categoryColors[skill.category] || theme.colors.textMuted,
                    borderRadius: theme.radius.full,
                  }}>
                    {skill.category}
                  </span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleCopyInstall(skill.slug)}
                  disabled={installed}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: installed 
                      ? theme.colors.bgElevated 
                      : `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    color: installed ? theme.colors.textMuted : theme.colors.bgPrimary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.medium,
                    cursor: installed ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: theme.fonts.sans,
                    transition: theme.transitions.fast,
                    opacity: installed ? 0.6 : 1,
                  }}
                >
                  {copied === skill.slug ? (
                    <>✓ Copied!</>
                  ) : installed ? (
                    <>✓ Already Installed</>
                  ) : (
                    <>⬇️ Copy Install Command</>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '10px 16px',
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
      }}>
        Run copied command in terminal to install
      </div>
    </div>
  );
}
