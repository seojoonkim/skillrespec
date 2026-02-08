import { useState } from 'react';
import { recommendations } from '../data/recommendations';
import type { DiagnosisItem, InstallItem, RemoveItem, UpdateItem } from '../data/recommendations';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  color: string;
  compact?: boolean;
}

function Tab({ active, onClick, children, count, color, compact }: TabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: compact ? '8px 6px' : '10px 8px',
        background: active ? `${color}15` : 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
        color: active ? color : '#666',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span style={{
          background: active ? color : '#444',
          color: active ? '#000' : '#888',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function DiagnosisSection({ items, compact }: { items: DiagnosisItem[]; compact?: boolean }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📊';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#666';
    }
  };

  return (
    <div style={{ padding: compact ? '12px' : '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#888',
        marginBottom: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.1em',
      }}>
        📊 스킬셋 진단
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: compact ? '10px' : '12px',
              background: `${getColor(item.type)}10`,
              border: `1px solid ${getColor(item.type)}30`,
              borderRadius: '8px',
              borderLeft: `3px solid ${getColor(item.type)}`,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: compact ? '12px' : '14px' }}>{getIcon(item.type)}</span>
              <span style={{
                fontSize: compact ? '11px' : '12px',
                fontWeight: 600,
                color: getColor(item.type),
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                {item.text}
              </span>
            </div>
            <div style={{
              fontSize: compact ? '10px' : '11px',
              color: '#888',
              marginLeft: '22px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstallSection({ items, compact }: { items: InstallItem[]; compact?: boolean }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#666';
    }
  };

  return (
    <div style={{ padding: compact ? '12px' : '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#888',
        marginBottom: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.1em',
      }}>
        ✅ 설치 추천
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: compact ? '10px' : '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: compact ? '12px' : '14px' }}>📦</span>
                <span style={{
                  fontSize: compact ? '12px' : '13px',
                  fontWeight: 600,
                  color: '#10b981',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {item.id}
                </span>
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: getPriorityColor(item.priority),
                textTransform: 'uppercase',
                padding: '2px 6px',
                background: `${getPriorityColor(item.priority)}20`,
                borderRadius: '4px',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                {item.priority}
              </span>
            </div>
            <div style={{
              fontSize: compact ? '10px' : '11px',
              color: '#888',
              marginLeft: '22px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {item.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoveSection({ items, compact }: { items: RemoveItem[]; compact?: boolean }) {
  return (
    <div style={{ padding: compact ? '12px' : '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#888',
        marginBottom: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.1em',
      }}>
        ❌ 제거 추천
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: compact ? '10px' : '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}>
              <span style={{ fontSize: compact ? '12px' : '14px' }}>🗑️</span>
              <span style={{
                fontSize: compact ? '12px' : '13px',
                fontWeight: 600,
                color: '#ef4444',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {item.id}
              </span>
            </div>
            <div style={{
              fontSize: compact ? '10px' : '11px',
              color: '#888',
              marginLeft: '22px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {item.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdateSection({ items, compact }: { items: UpdateItem[]; compact?: boolean }) {
  return (
    <div style={{ padding: compact ? '12px' : '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#888',
        marginBottom: '12px',
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '0.1em',
      }}>
        🔄 업데이트 추천
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: compact ? '10px' : '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: compact ? '12px' : '14px' }}>⬆️</span>
                <span style={{
                  fontSize: compact ? '12px' : '13px',
                  fontWeight: 600,
                  color: '#3b82f6',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {item.id}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                <span style={{ color: '#666' }}>{item.from}</span>
                <span style={{ color: '#3b82f6' }}>→</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{item.to}</span>
              </div>
            </div>
            <div style={{
              fontSize: compact ? '10px' : '11px',
              color: '#888',
              marginLeft: '22px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {item.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecommendationsPanelProps {
  position?: 'right' | 'bottom' | 'mobile';
}

export default function RecommendationsPanel({ position = 'right' }: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'install' | 'remove' | 'update'>('diagnosis');

  const isBottom = position === 'bottom';
  const isMobile = position === 'mobile';
  const compact = isBottom || isMobile;

  // Bottom position styles (tablet)
  if (isBottom) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '220px',
        right: '20px',
        height: '200px',
        background: 'rgba(10, 10, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 900,
        pointerEvents: 'auto',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
        }}>
          <Tab active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} count={recommendations.diagnosis.length} color="#a855f7" compact>
            📊 진단
          </Tab>
          <Tab active={activeTab === 'install'} onClick={() => setActiveTab('install')} count={recommendations.install.length} color="#10b981" compact>
            ✅ 설치
          </Tab>
          <Tab active={activeTab === 'remove'} onClick={() => setActiveTab('remove')} count={recommendations.remove.length} color="#ef4444" compact>
            ❌ 제거
          </Tab>
          <Tab active={activeTab === 'update'} onClick={() => setActiveTab('update')} count={recommendations.update.length} color="#3b82f6" compact>
            🔄 업데이트
          </Tab>
        </div>

        {/* Content - Horizontal scroll for bottom */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {activeTab === 'diagnosis' && <DiagnosisSection items={recommendations.diagnosis} compact />}
          {activeTab === 'install' && <InstallSection items={recommendations.install} compact />}
          {activeTab === 'remove' && <RemoveSection items={recommendations.remove} compact />}
          {activeTab === 'update' && <UpdateSection items={recommendations.update} compact />}
        </div>
      </div>
    );
  }

  // Mobile position styles
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              스킬 추천
            </h2>
            <p style={{
              fontSize: '11px',
              color: '#666',
              margin: 0,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              AI 기반 최적화 제안
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          margin: '0 12px',
        }}>
          <Tab active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} count={recommendations.diagnosis.length} color="#a855f7" compact>
            📊
          </Tab>
          <Tab active={activeTab === 'install'} onClick={() => setActiveTab('install')} count={recommendations.install.length} color="#10b981" compact>
            ✅
          </Tab>
          <Tab active={activeTab === 'remove'} onClick={() => setActiveTab('remove')} count={recommendations.remove.length} color="#ef4444" compact>
            ❌
          </Tab>
          <Tab active={activeTab === 'update'} onClick={() => setActiveTab('update')} count={recommendations.update.length} color="#3b82f6" compact>
            🔄
          </Tab>
        </div>

        {/* Content */}
        <div style={{
          overflowY: 'auto',
          maxHeight: 'calc(60vh - 120px)',
        }}>
          {activeTab === 'diagnosis' && <DiagnosisSection items={recommendations.diagnosis} compact />}
          {activeTab === 'install' && <InstallSection items={recommendations.install} compact />}
          {activeTab === 'remove' && <RemoveSection items={recommendations.remove} compact />}
          {activeTab === 'update' && <UpdateSection items={recommendations.update} compact />}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <button
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              cursor: 'pointer',
            }}
          >
            ⚡ 모든 추천 적용하기
          </button>
        </div>
      </div>
    );
  }

  // Default: Right panel (desktop)
  return (
    <div style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      width: '320px',
      maxHeight: 'calc(100vh - 180px)',
      background: 'rgba(10, 10, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 900,
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}>
            🎯
          </div>
          <div>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              스킬 추천
            </h2>
            <p style={{
              fontSize: '10px',
              color: '#666',
              margin: 0,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              AI 기반 최적화 제안
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <Tab active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} count={recommendations.diagnosis.length} color="#a855f7">
          📊
        </Tab>
        <Tab active={activeTab === 'install'} onClick={() => setActiveTab('install')} count={recommendations.install.length} color="#10b981">
          ✅
        </Tab>
        <Tab active={activeTab === 'remove'} onClick={() => setActiveTab('remove')} count={recommendations.remove.length} color="#ef4444">
          ❌
        </Tab>
        <Tab active={activeTab === 'update'} onClick={() => setActiveTab('update')} count={recommendations.update.length} color="#3b82f6">
          🔄
        </Tab>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {activeTab === 'diagnosis' && <DiagnosisSection items={recommendations.diagnosis} />}
        {activeTab === 'install' && <InstallSection items={recommendations.install} />}
        {activeTab === 'remove' && <RemoveSection items={recommendations.remove} />}
        {activeTab === 'update' && <UpdateSection items={recommendations.update} />}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        <button
          style={{
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          ⚡ 모든 추천 적용하기
        </button>
      </div>
    </div>
  );
}
