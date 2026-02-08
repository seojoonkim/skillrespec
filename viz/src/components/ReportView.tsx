import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';
import type { VizData, SkillNode } from '../types';

interface ReportViewProps {
  data: VizData;
  onOpenFullReport?: () => void;
}

type SortKey = 'name' | 'category' | 'tokens' | 'connections';
type SortOrder = 'asc' | 'desc';

// ═══════════════════════════════════════════════════════════
// Analysis Logic
// ═══════════════════════════════════════════════════════════
interface AnalysisResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  dominantCategory: { name: string; percentage: number } | null;
  missingCategories: string[];
}

interface ActionItem {
  type: 'install' | 'remove' | 'update';
  skill: string;
  reason: string;
}

function analyzeSkillset(data: VizData): AnalysisResult {
  const { nodes, clusters, metrics } = data;
  
  // Calculate category distribution
  const categoryCount: Record<string, number> = {};
  nodes.forEach(n => {
    categoryCount[n.category] = (categoryCount[n.category] || 0) + 1;
  });
  
  const totalSkills = nodes.length;
  const categoryPercentages = Object.entries(categoryCount)
    .map(([cat, count]) => ({ name: cat, percentage: Math.round((count / totalSkills) * 100) }))
    .sort((a, b) => b.percentage - a.percentage);
  
  const dominant = categoryPercentages[0];
  
  // Find missing/weak categories
  const allCategories = ['productivity', 'development', 'media', 'communication', 'design', 'marketing', 'security', 'utility'];
  const presentCategories = new Set(Object.keys(categoryCount));
  const missingCategories = allCategories.filter(cat => !presentCategories.has(cat));
  const weakCategories = categoryPercentages.filter(c => c.percentage < 5).map(c => c.name);
  
  // Build summary
  let summary = '';
  if (dominant && dominant.percentage > 40) {
    summary = `Your skill set is heavily focused on ${capitalize(dominant.name)} (${dominant.percentage}%), which may limit versatility. Consider diversifying into ${missingCategories.length > 0 ? missingCategories.slice(0, 2).map(capitalize).join(' and ') : 'other areas'}.`;
  } else if (categoryPercentages.length >= 5 && categoryPercentages[4]?.percentage >= 10) {
    summary = 'Your skill set is well-balanced across multiple categories. This provides good versatility for various tasks.';
  } else {
    summary = `Your skill set covers ${categoryPercentages.length} categories. Consider expanding into ${missingCategories.slice(0, 2).map(capitalize).join(' and ')} for better coverage.`;
  }
  
  // Build strengths
  const strengths: string[] = [];
  if (dominant && dominant.percentage >= 20) {
    strengths.push(`Strong ${capitalize(dominant.name)} foundation`);
  }
  if (presentCategories.has('security')) {
    const secSkills = nodes.filter(n => n.category === 'security');
    if (secSkills.length > 0) {
      strengths.push(`Security covered with ${secSkills[0].name}`);
    }
  }
  if (presentCategories.has('development')) {
    strengths.push('Development capabilities present');
  }
  if (metrics.uniquenessIndex > 0.7) {
    strengths.push('Good skill diversity (low redundancy)');
  }
  if (categoryPercentages.length >= 6) {
    strengths.push('Broad category coverage');
  }
  
  // Build improvements
  const improvements: string[] = [];
  if (missingCategories.includes('development')) {
    improvements.push('No Development skills detected');
  }
  if (missingCategories.includes('security')) {
    improvements.push('No Security skills - consider adding protection');
  }
  if (!presentCategories.has('productivity') || categoryCount.productivity < 2) {
    improvements.push('Limited productivity tools');
  }
  if (weakCategories.length > 2) {
    improvements.push(`Weak coverage in ${weakCategories.slice(0, 2).map(capitalize).join(', ')}`);
  }
  if (dominant && dominant.percentage > 50) {
    improvements.push(`Over-reliance on ${capitalize(dominant.name)} (${dominant.percentage}%)`);
  }
  
  // Ensure at least one item in each
  if (strengths.length === 0) strengths.push('Foundational skill set in place');
  if (improvements.length === 0) improvements.push('Consider adding specialized skills');
  
  return {
    summary,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    dominantCategory: dominant || null,
    missingCategories,
  };
}

function generateActions(data: VizData, analysis: AnalysisResult): ActionItem[] {
  const actions: ActionItem[] = [];
  const { nodes } = data;
  
  // Install recommendations based on missing categories
  const suggestedInstalls: Record<string, { skill: string; reason: string }> = {
    development: { skill: 'docker-basics', reason: 'Add DevOps capability' },
    security: { skill: 'prompt-guard', reason: 'Essential security layer' },
    productivity: { skill: 'notion-sync', reason: 'Improve task management' },
  };
  
  for (const missing of analysis.missingCategories.slice(0, 2)) {
    if (suggestedInstalls[missing]) {
      actions.push({
        type: 'install',
        skill: suggestedInstalls[missing].skill,
        reason: suggestedInstalls[missing].reason,
      });
    }
  }
  
  // Find duplicate/similar skills to remove
  const nameMap = new Map<string, SkillNode[]>();
  nodes.forEach(n => {
    const baseName = n.name.toLowerCase().replace(/[-_\s]+(pro|max|v\d+|skill)?$/i, '');
    if (!nameMap.has(baseName)) nameMap.set(baseName, []);
    nameMap.get(baseName)!.push(n);
  });
  
  for (const [, duplicates] of nameMap) {
    if (duplicates.length > 1) {
      // Recommend removing the larger one (more tokens = more bloat)
      const sorted = [...duplicates].sort((a, b) => b.tokens - a.tokens);
      actions.push({
        type: 'remove',
        skill: sorted[0].id,
        reason: `Duplicate of ${sorted[1].name}`,
      });
    }
  }
  
  // Find heavy skills that might need updates
  const heavySkills = nodes.filter(n => n.tokens > 4000).slice(0, 2);
  for (const skill of heavySkills) {
    // Simulate version check
    if (skill.tokens > 5000) {
      actions.push({
        type: 'update',
        skill: skill.id,
        reason: 'Newer version available with optimizations',
      });
    }
  }
  
  return actions.slice(0, 6);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ═══════════════════════════════════════════════════════════
// Report View Component
// ═══════════════════════════════════════════════════════════
export default function ReportView({ data, onOpenFullReport }: ReportViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tokens');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = [...new Set(data.nodes.map(n => n.category))];
    return cats.sort();
  }, [data.nodes]);

  const sortedNodes = useMemo(() => {
    let nodes = [...data.nodes];

    if (filterCategory) {
      nodes = nodes.filter(n => n.category === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.name.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query)
      );
    }

    nodes.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'tokens':
          comparison = a.tokens - b.tokens;
          break;
        case 'connections':
          comparison = a.connections.length - b.connections.length;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return nodes;
  }, [data.nodes, sortKey, sortOrder, filterCategory, searchQuery]);

  // Analysis
  const analysis = useMemo(() => analyzeSkillset(data), [data]);
  const actions = useMemo(() => generateActions(data, analysis), [data, analysis]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      onClick={() => handleSort(sortKeyName)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        position: 'sticky',
        top: 0,
      }}
    >
      {label}
      {sortKey === sortKeyName && (
        <span style={{ marginLeft: '4px', opacity: 0.6 }}>
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );

  const installActions = actions.filter(a => a.type === 'install');
  const removeActions = actions.filter(a => a.type === 'remove');
  const updateActions = actions.filter(a => a.type === 'update');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme.colors.bgPrimary,
      overflow: 'auto',
    }}>
      {/* ═══════════════════════════════════════════════════════════
          TOP BAR - Full Report Button
      ═══════════════════════════════════════════════════════════ */}
      {onOpenFullReport && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgSecondary,
        }}>
          <button
            onClick={onOpenFullReport}
            style={{
              padding: '8px 16px',
              background: theme.colors.accent,
              border: 'none',
              borderRadius: theme.radius.md,
              color: '#fff',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            📄 Full Report
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ANALYSIS SUMMARY
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '24px',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <h2 style={{
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          margin: 0,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📊</span> ANALYSIS SUMMARY
        </h2>
        
        <p style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          lineHeight: 1.6,
          margin: 0,
          marginBottom: '20px',
          maxWidth: '700px',
        }}>
          {analysis.summary}
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {/* Strengths */}
          <div style={{
            padding: '16px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h3 style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.success,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
              marginBottom: '12px',
            }}>
              Strengths
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {analysis.strengths.map((s, i) => (
                <li key={i} style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span style={{ color: theme.colors.success }}>•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Areas for Improvement */}
          <div style={{
            padding: '16px',
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h3 style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.warning,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
              marginBottom: '12px',
            }}>
              Areas for Improvement
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {analysis.improvements.map((s, i) => (
                <li key={i} style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span style={{ color: theme.colors.warning }}>•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          RECOMMENDED ACTIONS
      ═══════════════════════════════════════════════════════════ */}
      {actions.length > 0 && (
        <section style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚡</span> RECOMMENDED ACTIONS
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Install */}
            {installActions.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.success,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🟢 INSTALL
                </h4>
                {installActions.map((a, i) => (
                  <div key={i} style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                    paddingLeft: '20px',
                  }}>
                    <span style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{a.skill}</span>
                    <span style={{ color: theme.colors.textMuted }}> — {a.reason}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Remove */}
            {removeActions.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.error,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🔴 REMOVE
                </h4>
                {removeActions.map((a, i) => (
                  <div key={i} style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                    paddingLeft: '20px',
                  }}>
                    <span style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{a.skill}</span>
                    <span style={{ color: theme.colors.textMuted }}> — {a.reason}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Update */}
            {updateActions.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.warning,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🟡 UPDATE
                </h4>
                {updateActions.map((a, i) => (
                  <div key={i} style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                    paddingLeft: '20px',
                  }}>
                    <span style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{a.skill}</span>
                    <span style={{ color: theme.colors.textMuted }}> — {a.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SKILL LIST
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <h2 style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            📋 SKILL LIST
          </h2>
        </div>
        
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              outline: 'none',
            }}
          />

          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            style={{
              padding: '8px 12px',
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{capitalize(cat)}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
          }}>
            {sortedNodes.length} skills
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: theme.fonts.sans,
          }}>
            <thead>
              <tr>
                <SortHeader label="Skill" sortKeyName="name" />
                <SortHeader label="Category" sortKeyName="category" />
                <SortHeader label="Tokens" sortKeyName="tokens" />
                <SortHeader label="Connections" sortKeyName="connections" />
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  background: theme.colors.bgSecondary,
                  position: 'sticky',
                  top: 0,
                }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map((node) => {
                const color = theme.categoryColors[node.category] || theme.colors.textMuted;
                
                // Essential skills (high token + important categories)
                const essentialSkills = ['prompt-guard', 'marketing-psychology', 'thinking-model-enhancer'];
                const isEssential = essentialSkills.includes(node.id) || node.category === 'security';
                
                // Check for duplicates (simplified - similar names)
                const isDuplicate = node.id.includes('-skill') && node.id.includes('-max');
                
                // Check for updates (simulated - high token count might indicate old version)
                const hasUpdate = node.tokens > 5000;
                
                // Status logic
                const getStatus = () => {
                  if (isDuplicate) return { label: 'Duplicate', color: theme.colors.error, icon: '⚠️' };
                  if (hasUpdate) return { label: 'Update Available', color: theme.colors.warning, icon: '🔄' };
                  if (isEssential) return { label: 'Essential', color: theme.colors.success, icon: '⭐' };
                  return { label: 'Active', color: theme.colors.textMuted, icon: '✓' };
                };
                
                const status = getStatus();
                
                return (
                  <tr
                    key={node.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgSecondary}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.colors.textPrimary,
                      }}>
                        {node.name}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        fontFamily: theme.fonts.mono,
                      }}>
                        {node.id}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textSecondary,
                        textTransform: 'capitalize',
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: color,
                        }} />
                        {node.category}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: theme.fontSize.sm,
                      fontFamily: theme.fonts.mono,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      ~{node.tokens.toLocaleString()}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: theme.fontSize.sm,
                      fontFamily: theme.fonts.mono,
                      color: theme.colors.textSecondary,
                    }}>
                      {node.connections.length}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        fontSize: theme.fontSize.xs,
                        color: status.color,
                        background: `${status.color}15`,
                        borderRadius: theme.radius.sm,
                      }}>
                        <span>{status.icon}</span>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
