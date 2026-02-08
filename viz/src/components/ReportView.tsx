import { useState, useMemo } from 'react';
import { theme } from '../styles/theme';
import { useTranslation } from '../i18n/useTranslation';
import type { VizData, SkillNode } from '../types';

interface ReportViewProps {
  data: VizData;
}

type SortKey = 'name' | 'category' | 'tokens' | 'connections';
type SortOrder = 'asc' | 'desc';

export default function ReportView({ data }: ReportViewProps) {
  const { t } = useTranslation();
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

    // Filter by category
    if (filterCategory) {
      nodes = nodes.filter(n => n.category === filterCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.name.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query)
      );
    }

    // Sort
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme.colors.bgPrimary,
    }}>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 24px',
        borderBottom: `1px solid ${theme.colors.border}`,
        flexWrap: 'wrap',
      }}>
        {/* Search */}
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

        {/* Category filter */}
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
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Results count */}
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
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
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
              const isHeavy = node.tokens > 3000;
              const hasHighOverlap = node.connections.length > 5;
              
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
                  <td style={{
                    padding: '12px 16px',
                  }}>
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
                    color: isHeavy ? theme.colors.warning : theme.colors.textSecondary,
                  }}>
                    ~{node.tokens.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    fontSize: theme.fontSize.sm,
                    fontFamily: theme.fonts.mono,
                    color: hasHighOverlap ? theme.colors.warning : theme.colors.textSecondary,
                  }}>
                    {node.connections.length}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {isHeavy && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.warning,
                        background: `${theme.colors.warning}15`,
                        borderRadius: theme.radius.sm,
                        marginRight: '4px',
                      }}>
                        Heavy
                      </span>
                    )}
                    {hasHighOverlap && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.info,
                        background: `${theme.colors.info}15`,
                        borderRadius: theme.radius.sm,
                      }}>
                        Connected
                      </span>
                    )}
                    {!isHeavy && !hasHighOverlap && (
                      <span style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                      }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
