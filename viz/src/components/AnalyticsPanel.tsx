// ═══════════════════════════════════════════════════════════
// Analytics Panel - Usage Dashboard with Charts + Insights
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { theme } from '../styles/theme';
import { generateUsageStats, getCategoryUsage, type UsageStats, type SkillUsage } from '../lib/usageData';
import type { SkillNode } from '../types';

// ═══════════════════════════════════════════════════════════
// Grayscale Chart Colors
// ═══════════════════════════════════════════════════════════
const chartColors = {
  primary: '#a1a1aa',
  secondary: '#71717a',
  tertiary: '#52525b',
  error: '#f87171',
  grid: 'rgba(255, 255, 255, 0.06)',
  tooltip: {
    bg: '#1a1a1a',
    border: '#3f3f46',
    text: '#fafafa',
  },
};

// ═══════════════════════════════════════════════════════════
// Custom Tooltip
// ═══════════════════════════════════════════════════════════
interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: chartColors.tooltip.bg,
      border: `1px solid ${chartColors.tooltip.border}`,
      borderRadius: theme.radius.md,
      padding: '10px 14px',
      fontSize: theme.fontSize.xs,
      fontFamily: theme.fonts.sans,
    }}>
      <div style={{
        color: theme.colors.textMuted,
        marginBottom: '6px',
      }}>
        {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} style={{
          color: entry.color || chartColors.tooltip.text,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            background: entry.color || chartColors.primary,
          }} />
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════════════════════════
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

function StatCard({ label, value, subtitle, trend, icon }: StatCardProps) {
  const trendColor = trend === 'up' ? theme.colors.success 
    : trend === 'down' ? theme.colors.error 
    : theme.colors.textMuted;
    
  return (
    <div style={{
      padding: '14px',
      background: theme.colors.bgTertiary,
      borderRadius: theme.radius.md,
      flex: 1,
      minWidth: '100px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
      }}>
        {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: theme.fontSize.xs,
          color: trendColor,
          marginTop: '4px',
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab Component
// ═══════════════════════════════════════════════════════════
function Tab({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        background: active ? theme.colors.bgTertiary : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? theme.colors.textPrimary : 'transparent'}`,
        color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        cursor: 'pointer',
        fontFamily: theme.fonts.sans,
        transition: theme.transitions.fast,
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Analytics Panel
// ═══════════════════════════════════════════════════════════
interface AnalyticsPanelProps {
  nodes: SkillNode[];
  embedded?: boolean;
}

export default function AnalyticsPanel({ nodes, embedded = false }: AnalyticsPanelProps) {
  const [activeChart, setActiveChart] = useState<'usage' | 'trend' | 'errors' | 'insights'>('usage');
  
  // Generate mock usage data
  const stats: UsageStats = useMemo(() => generateUsageStats(nodes), [nodes]);
  const categoryUsage = useMemo(() => getCategoryUsage(stats.skillUsage), [stats]);
  
  // Prepare chart data
  const skillChartData = stats.skillUsage.slice(0, 10).map(s => ({
    name: s.skillName.length > 12 ? s.skillName.slice(0, 10) + '...' : s.skillName,
    fullName: s.skillName,
    invocations: s.invocations,
    errors: s.errors,
    errorRate: s.errorRate,
  }));
  
  const trendData = stats.dailyTrend;
  
  const containerStyle: React.CSSProperties = {
    background: embedded ? 'transparent' : theme.colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgTertiary,
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
          📊 Analytics
        </h2>
        <span style={{
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMuted,
        }}>
          Last 7 days · Mock data
        </span>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        overflowX: 'auto',
      }}>
        <StatCard
          icon="📈"
          label="Total Calls"
          value={stats.totalInvocations}
          subtitle="+12% vs last week"
          trend="up"
        />
        <StatCard
          icon="⚠️"
          label="Error Rate"
          value={`${stats.overallErrorRate}%`}
          subtitle={stats.overallErrorRate < 3 ? 'Healthy' : 'Needs attention'}
          trend={stats.overallErrorRate < 3 ? 'up' : 'down'}
        />
        <StatCard
          icon="⚡"
          label="Avg Response"
          value={`${stats.avgResponseTime}ms`}
          subtitle="Within target"
          trend="neutral"
        />
      </div>

      {/* Chart Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        overflowX: 'auto',
      }}>
        <Tab active={activeChart === 'usage'} onClick={() => setActiveChart('usage')}>
          📊 Usage
        </Tab>
        <Tab active={activeChart === 'trend'} onClick={() => setActiveChart('trend')}>
          📈 Trend
        </Tab>
        <Tab active={activeChart === 'errors'} onClick={() => setActiveChart('errors')}>
          ⚠️ Errors
        </Tab>
        <Tab active={activeChart === 'insights'} onClick={() => setActiveChart('insights')}>
          💡 Insights
        </Tab>
      </div>

      {/* Chart Content */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {activeChart === 'usage' && (
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '14px',
            }}>
              Top 10 Skills by Invocations
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={chartColors.grid}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number"
                    tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invocations" radius={[0, 4, 4, 0]}>
                    {skillChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={index === 0 ? chartColors.primary : chartColors.secondary}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category Breakdown */}
            <div style={{ marginTop: '20px' }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: '10px',
              }}>
                Usage by Category
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryUsage.slice(0, 6).map(cat => (
                  <div key={cat.category} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      width: '80px',
                      textTransform: 'capitalize',
                    }}>
                      {cat.category}
                    </span>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: theme.colors.bgTertiary,
                      borderRadius: theme.radius.full,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        background: chartColors.primary,
                        borderRadius: theme.radius.full,
                      }} />
                    </div>
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textMuted,
                      width: '40px',
                      textAlign: 'right',
                    }}>
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeChart === 'trend' && (
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '14px',
            }}>
              Weekly Invocation Trend
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={chartColors.grid}
                  />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis 
                    tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.grid }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone"
                    dataKey="invocations"
                    name="Invocations"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                    activeDot={{ r: 6, fill: theme.colors.textPrimary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Hourly Heatmap Summary */}
            <div style={{ marginTop: '20px' }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.textPrimary,
                marginBottom: '10px',
              }}>
                Peak Hours Today
              </div>
              <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
              }}>
                {stats.hourlyTrend.map((hour, i) => {
                  const intensity = hour.invocations / Math.max(...stats.hourlyTrend.map(h => h.invocations));
                  return (
                    <div
                      key={i}
                      title={`${hour.hour}: ${hour.invocations} invocations`}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: theme.radius.sm,
                        background: `rgba(161, 161, 170, ${0.1 + intensity * 0.8})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        color: intensity > 0.5 ? theme.colors.bgPrimary : theme.colors.textMuted,
                      }}
                    >
                      {i}
                    </div>
                  );
                })}
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                marginTop: '6px',
              }}>
                Hover for details · Hour 0-23
              </div>
            </div>
          </div>
        )}

        {activeChart === 'errors' && (
          <div>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: '14px',
            }}>
              Skills with Highest Error Rates
            </div>
            
            {/* Error Rate List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.skillUsage
                .filter(s => s.errorRate > 0)
                .sort((a, b) => b.errorRate - a.errorRate)
                .slice(0, 8)
                .map(skill => (
                  <div
                    key={skill.skillId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: theme.colors.bgTertiary,
                      borderRadius: theme.radius.md,
                      gap: '12px',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.radius.sm,
                      background: skill.errorRate > 5 
                        ? theme.colors.error + '20'
                        : skill.errorRate > 2
                          ? theme.colors.warning + '20'
                          : theme.colors.bgSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: skill.errorRate > 5 
                        ? theme.colors.error
                        : skill.errorRate > 2
                          ? theme.colors.warning
                          : theme.colors.textMuted,
                      fontWeight: theme.fontWeight.bold,
                      fontSize: theme.fontSize.sm,
                    }}>
                      {skill.errorRate.toFixed(1)}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textPrimary,
                        fontWeight: theme.fontWeight.medium,
                      }}>
                        {skill.skillName}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                      }}>
                        {skill.errors} errors / {skill.invocations} calls
                      </div>
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textMuted,
                    }}>
                      {skill.avgResponseTime}ms
                    </div>
                  </div>
                ))
              }
            </div>
            
            {stats.skillUsage.filter(s => s.errorRate > 0).length === 0 && (
              <div style={{
                padding: '30px',
                textAlign: 'center',
                color: theme.colors.textMuted,
              }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <div style={{ marginTop: '8px' }}>No errors detected!</div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'insights' && (
          <InsightsSection stats={stats} nodes={nodes} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Insights Section Component
// ═══════════════════════════════════════════════════════════

interface InsightsSectionProps {
  stats: UsageStats;
  nodes: SkillNode[];
}

function InsightsSection({ stats, nodes }: InsightsSectionProps) {
  // Calculate insights
  const insights = useMemo(() => {
    const sortedByUsage = [...stats.skillUsage].sort((a, b) => b.invocations - a.invocations);
    const top5 = sortedByUsage.slice(0, 5);
    
    // Unused skills (less than 5 invocations in 7 days)
    const unusedSkills = stats.skillUsage.filter(s => s.invocations < 5);
    
    // Calculate potential space savings (mock: 50-500KB per skill)
    const totalSavings = unusedSkills.reduce((sum, s) => {
      // Use skill name length as seed for consistent mock size
      const mockSize = 50 + (s.skillName.length * 17) % 450;
      return sum + mockSize;
    }, 0);
    
    // Get skills that might need attention
    const slowSkills = stats.skillUsage.filter(s => s.avgResponseTime > 300);
    const errorProneSkills = stats.skillUsage.filter(s => s.errorRate > 3);
    
    // Weekly report summary
    const weeklyStats = {
      totalCalls: stats.totalInvocations,
      avgCallsPerDay: Math.round(stats.totalInvocations / 7),
      mostActiveDay: stats.dailyTrend.reduce((max, d) => 
        d.invocations > max.invocations ? d : max
      ),
      improvement: Math.round((Math.random() * 20) - 5), // Mock: -5% to +15%
    };
    
    return { top5, unusedSkills, totalSavings, slowSkills, errorProneSkills, weeklyStats };
  }, [stats, nodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top 5 Most Used */}
      <div>
        <div style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          🏆 Top 5 Most Used Skills
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {insights.top5.map((skill, i) => (
            <div
              key={skill.skillId}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                background: theme.colors.bgTertiary,
                borderRadius: theme.radius.md,
                gap: '10px',
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: theme.radius.full,
                background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c32' : theme.colors.bgSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: theme.fontSize.xs,
                fontWeight: theme.fontWeight.bold,
                color: i < 3 ? theme.colors.bgPrimary : theme.colors.textMuted,
              }}>
                {i + 1}
              </span>
              <span style={{
                flex: 1,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textPrimary,
              }}>
                {skill.skillName}
              </span>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.mono,
              }}>
                {skill.invocations.toLocaleString()} calls
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Unused Skills */}
      {insights.unusedSkills.length > 0 && (
        <div>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            💤 Installed but Rarely Used
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              fontWeight: theme.fontWeight.normal,
            }}>
              ({insights.unusedSkills.length})
            </span>
          </div>
          <div style={{
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.md,
            padding: '12px',
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px',
            }}>
              {insights.unusedSkills.slice(0, 6).map(skill => (
                <span
                  key={skill.skillId}
                  style={{
                    padding: '4px 8px',
                    background: theme.colors.bgSecondary,
                    borderRadius: theme.radius.full,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                  }}
                >
                  {skill.skillName}
                </span>
              ))}
              {insights.unusedSkills.length > 6 && (
                <span style={{
                  padding: '4px 8px',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  +{insights.unusedSkills.length - 6} more
                </span>
              )}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
            }}>
              💡 Less than 5 uses in the last 7 days
            </div>
          </div>
        </div>
      )}

      {/* Space Savings Suggestion */}
      {insights.totalSavings > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.success}10, ${theme.colors.success}05)`,
          border: `1px solid ${theme.colors.success}30`,
          borderRadius: theme.radius.md,
          padding: '14px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>🧹</span>
            <div>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.success,
              }}>
                Optimization Suggestion
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
              }}>
                Remove {insights.unusedSkills.length} unused skills to save ~{formatBytes(insights.totalSavings * 1024)}
              </div>
            </div>
          </div>
          <button
            style={{
              width: '100%',
              padding: '8px',
              background: theme.colors.success + '20',
              border: `1px solid ${theme.colors.success}40`,
              borderRadius: theme.radius.md,
              color: theme.colors.success,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            Review & Clean Up
          </button>
        </div>
      )}

      {/* Performance Alerts */}
      {(insights.slowSkills.length > 0 || insights.errorProneSkills.length > 0) && (
        <div>
          <div style={{
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.textPrimary,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            ⚡ Performance Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {insights.slowSkills.slice(0, 3).map(skill => (
              <div
                key={skill.skillId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: theme.colors.warning + '10',
                  border: `1px solid ${theme.colors.warning}30`,
                  borderRadius: theme.radius.md,
                  gap: '8px',
                }}
              >
                <span style={{ color: theme.colors.warning }}>🐢</span>
                <span style={{
                  flex: 1,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textPrimary,
                }}>
                  {skill.skillName}
                </span>
                <span style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.warning,
                  fontFamily: theme.fonts.mono,
                }}>
                  {skill.avgResponseTime}ms
                </span>
              </div>
            ))}
            {insights.errorProneSkills.slice(0, 2).map(skill => (
              <div
                key={skill.skillId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: theme.colors.error + '10',
                  border: `1px solid ${theme.colors.error}30`,
                  borderRadius: theme.radius.md,
                  gap: '8px',
                }}
              >
                <span style={{ color: theme.colors.error }}>⚠️</span>
                <span style={{
                  flex: 1,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textPrimary,
                }}>
                  {skill.skillName}
                </span>
                <span style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.error,
                  fontFamily: theme.fonts.mono,
                }}>
                  {skill.errorRate.toFixed(1)}% errors
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Report */}
      <div style={{
        background: theme.colors.bgTertiary,
        borderRadius: theme.radius.md,
        padding: '14px',
      }}>
        <div style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.textPrimary,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          📅 Weekly Report Summary
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginBottom: '4px',
            }}>
              Total Calls
            </div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
            }}>
              {insights.weeklyStats.totalCalls.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginBottom: '4px',
            }}>
              Avg/Day
            </div>
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
            }}>
              {insights.weeklyStats.avgCallsPerDay.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginBottom: '4px',
            }}>
              Most Active
            </div>
            <div style={{
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.textPrimary,
            }}>
              {insights.weeklyStats.mostActiveDay.date}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginBottom: '4px',
            }}>
              vs Last Week
            </div>
            <div style={{
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              color: insights.weeklyStats.improvement >= 0 
                ? theme.colors.success 
                : theme.colors.error,
            }}>
              {insights.weeklyStats.improvement >= 0 ? '+' : ''}
              {insights.weeklyStats.improvement}%
            </div>
          </div>
        </div>
        <button
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '8px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: theme.transitions.fast,
          }}
        >
          📊 Generate Full Report
        </button>
      </div>
    </div>
  );
}

// Utility function for formatting bytes
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
