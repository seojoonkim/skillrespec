import { theme } from '../styles/theme';

interface AnalyzePageProps {
  onNavigate: (path: string) => void;
}

export default function AnalyzePage({ onNavigate }: AnalyzePageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bgPrimary,
      fontFamily: theme.fonts.sans,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        height: '52px',
        padding: '0 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: theme.fontSize.sm,
            fontFamily: theme.fonts.sans,
          }}
        >
          ← Back
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ 
            fontSize: '20px',
            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))',
          }}>⚔️</span>
          <span style={{
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.textPrimary,
            letterSpacing: '-0.02em',
          }}>
            SkillRespec
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
          }}>
            ⌨️
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: theme.fontSize.xxl,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.textPrimary,
            margin: 0,
            marginBottom: '8px',
          }}>
            Use the CLI
          </h1>
          <p style={{
            fontSize: theme.fontSize.md,
            color: theme.colors.textMuted,
            margin: 0,
            marginBottom: '32px',
          }}>
            Analyze your skills directly from the terminal
          </p>

          {/* CLI Instructions */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.xl,
            border: `1px solid ${theme.colors.border}`,
            padding: '24px',
            textAlign: 'left',
          }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              marginBottom: '12px',
            }}>
              Install & run:
            </div>
            
            <div style={{
              background: theme.colors.bgTertiary,
              borderRadius: theme.radius.md,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <code style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.accent,
              }}>
                npx skillrespec ~/skills/
              </code>
            </div>

            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              marginBottom: '12px',
            }}>
              Or install globally:
            </div>
            
            <div style={{
              background: theme.colors.bgTertiary,
              borderRadius: theme.radius.md,
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: '8px',
              }}>
                <span style={{ color: theme.colors.textMuted }}># Install</span>
              </div>
              <code style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.accent,
              }}>
                npm install -g skillrespec
              </code>
              <div style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginTop: '16px',
                marginBottom: '8px',
              }}>
                <span style={{ color: theme.colors.textMuted }}># Run</span>
              </div>
              <code style={{
                fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm,
                color: theme.colors.accent,
              }}>
                skillrespec analyze ~/skills/
              </code>
            </div>

            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.colors.border}`,
            }}>
              The CLI scans your skills folder, analyzes each skill, and opens this visualization with your results.
            </div>
          </div>

          {/* Features */}
          <div style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            {[
              { icon: '📁', title: 'Scan Skills', desc: 'Reads SKILL.md files' },
              { icon: '📊', title: 'Analyze', desc: 'Tokens, versions, security' },
              { icon: '🌐', title: 'Visualize', desc: 'Opens browser with results' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.radius.lg,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {icon}
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  marginBottom: '4px',
                }}>
                  {title}
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted,
                }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
