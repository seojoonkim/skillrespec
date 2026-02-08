// ═══════════════════════════════════════════════════════════
// ReportView - 테이블/리스트 형태의 스킬 리포트
// Linear/Vercel 스타일 플랫 디자인
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { VizData, SkillNode } from '../types';

interface ReportViewProps {
  data: VizData;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectSkill: (skill: SkillNode) => void;
  isMobile?: boolean;
}

type SortKey = 'name' | 'category' | 'tokens' | 'connections';
type SortOrder = 'asc' | 'desc';

// 카테고리별 아이콘 맵핑
const categoryIcons: Record<string, string> = {
  'Marketing': '📢',
  'Development': '💻',
  'Security': '🔒',
  'DevOps': '⚙️',
  'Data': '📊',
  'Analytics': '📈',
  'Design': '🎨',
  'Communication': '💬',
  'Management': '📋',
  'AI': '🤖',
  'Infrastructure': '🏗️',
  'Testing': '🧪',
  'Documentation': '📝',
};

function getCategoryIcon(category: string): string {
  return categoryIcons[category] || '📦';
}

export default function ReportView({ 
  data, 
  selectedCategory,
  onSelectCategory,
  onSelectSkill,
  isMobile = false,
}: ReportViewProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('tokens');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // 필터링 및 정렬된 스킬
  const filteredSkills = useMemo(() => {
    let skills = [...data.nodes];
    
    // 카테고리 필터
    if (selectedCategory) {
      skills = skills.filter(s => s.category === selectedCategory);
    }
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      skills = skills.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    skills.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      
      switch (sortKey) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'category':
          valueA = a.category.toLowerCase();
          valueB = b.category.toLowerCase();
          break;
        case 'tokens':
          valueA = a.tokens;
          valueB = b.tokens;
          break;
        case 'connections':
          valueA = a.connections.length;
          valueB = b.connections.length;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return skills;
  }, [data.nodes, selectedCategory, searchQuery, sortKey, sortOrder]);

  // 카테고리 통계
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; tokens: number; color: string }> = {};
    data.nodes.forEach(node => {
      if (!stats[node.category]) {
        stats[node.category] = { count: 0, tokens: 0, color: node.color };
      }
      stats[node.category].count += 1;
      stats[node.category].tokens += node.tokens;
    });
    return Object.entries(stats).sort((a, b) => b[1].tokens - a[1].tokens);
  }, [data.nodes]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // 총 토큰 계산
  const totalTokens = useMemo(() => 
    filteredSkills.reduce((sum, s) => sum + s.tokens, 0), 
    [filteredSkills]
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      color: '#e5e5e5',
      overflow: 'hidden',
    }}>
      {/* 상단: 검색 + 필터 */}
      <div style={{
        padding: isMobile ? '12px' : '16px 20px',
        borderBottom: '1px solid #262626',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
      }}>
        {/* 검색 */}
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: '#666',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#e5e5e5',
              fontSize: '13px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* 카테고리 필터 태그 (데스크탑만) */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <button
              onClick={() => onSelectCategory(null)}
              style={{
                padding: '6px 12px',
                background: selectedCategory === null ? '#10b981' : '#1a1a1a',
                border: '1px solid',
                borderColor: selectedCategory === null ? '#10b981' : '#262626',
                borderRadius: '6px',
                color: selectedCategory === null ? '#000' : '#999',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              All ({data.nodes.length})
            </button>
            {categoryStats.slice(0, 4).map(([cat, stat]) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                style={{
                  padding: '6px 10px',
                  background: selectedCategory === cat ? '#262626' : '#141414',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#404040' : '#262626',
                  borderRadius: '6px',
                  color: selectedCategory === cat ? '#fff' : '#888',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stat.color,
                }} />
                {cat} ({stat.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 요약 바 */}
      <div style={{
        padding: '8px 20px',
        background: '#141414',
        borderBottom: '1px solid #262626',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#888',
      }}>
        <span>
          {t.reportView.total}: <strong style={{ color: '#10b981' }}>{filteredSkills.length}</strong> skills
        </span>
        <span>
          {t.reportView.tokens}: <strong style={{ color: '#10b981' }}>{totalTokens.toLocaleString()}</strong>
        </span>
      </div>

      {/* 테이블 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isMobile ? '12px' : '13px',
        }}>
          <thead>
            <tr style={{
              background: '#141414',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <th 
                onClick={() => handleSort('name')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#888',
                  borderBottom: '1px solid #262626',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {t.reportView.skillName} <SortIcon column="name" />
              </th>
              {!isMobile && (
                <th 
                  onClick={() => handleSort('category')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#888',
                    borderBottom: '1px solid #262626',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {t.reportView.category} <SortIcon column="category" />
                </th>
              )}
              <th 
                onClick={() => handleSort('tokens')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#888',
                  borderBottom: '1px solid #262626',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minWidth: '80px',
                }}
              >
                {t.reportView.tokens} <SortIcon column="tokens" />
              </th>
              <th 
                onClick={() => handleSort('connections')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#888',
                  borderBottom: '1px solid #262626',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minWidth: '60px',
                }}
              >
                {t.reportView.connections} <SortIcon column="connections" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.length === 0 ? (
              <tr>
                <td 
                  colSpan={isMobile ? 3 : 4}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: '#666',
                  }}
                >
                  {t.reportView.noSkills}
                </td>
              </tr>
            ) : (
              filteredSkills.map((skill, idx) => (
                <tr 
                  key={skill.id}
                  onClick={() => onSelectSkill(skill)}
                  style={{
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)';
                  }}
                >
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: skill.color,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 500, color: '#e5e5e5' }}>
                        {skill.name}
                      </span>
                      {isMobile && (
                        <span style={{
                          fontSize: '10px',
                          color: '#666',
                          marginLeft: 'auto',
                        }}>
                          {skill.category}
                        </span>
                      )}
                    </div>
                  </td>
                  {!isMobile && (
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #1a1a1a',
                      color: '#888',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getCategoryIcon(skill.category)} {skill.category}
                      </span>
                    </td>
                  )}
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1a1a1a',
                    textAlign: 'right',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: '#10b981',
                  }}>
                    {skill.tokens.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1a1a1a',
                    textAlign: 'right',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: skill.connections.length > 3 ? '#10b981' : '#666',
                  }}>
                    {skill.connections.length}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 하단: 카테고리 분포 (데스크탑) */}
      {!isMobile && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #262626',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}>
          {categoryStats.map(([cat, stat]) => (
            <div
              key={cat}
              title={`${cat}: ${stat.count} skills, ${stat.tokens.toLocaleString()} tokens`}
              style={{
                flex: stat.tokens,
                height: '6px',
                background: stat.color,
                borderRadius: '3px',
                opacity: selectedCategory === null || selectedCategory === cat ? 1 : 0.3,
                transition: 'opacity 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
