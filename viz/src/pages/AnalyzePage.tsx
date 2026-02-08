import { useState, useCallback, useRef } from 'react';
import { theme } from '../styles/theme';
import { parseSkillInput, analyzeSkills, encodeResultForUrl } from '../lib/analyzer';
import type { AnalysisResult } from '../lib/analyzer';

interface AnalyzePageProps {
  onNavigate: (path: string) => void;
}

const SAMPLE_INPUT = `prompt-guard
github
coding-agent
discord
notion
obsidian
whisper
canvas`;

const SAMPLE_JSON = `[
  "prompt-guard",
  "github@2.0.0",
  "coding-agent",
  "discord",
  "notion",
  "obsidian",
  "whisper",
  "canvas"
]`;

export default function AnalyzePage({ onNavigate }: AnalyzePageProps) {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    
    if (!input.trim()) {
      setError('Please enter your skills list');
      return;
    }

    setIsAnalyzing(true);

    try {
      const skills = parseSkillInput(input);
      
      if (skills.length === 0) {
        setError('No valid skills found in input');
        setIsAnalyzing(false);
        return;
      }

      const result = analyzeSkills(skills);
      const encoded = encodeResultForUrl(result);
      
      // Store in localStorage as backup
      localStorage.setItem(`skillrespec_result_${result.id}`, JSON.stringify(result));
      
      // Navigate to results
      onNavigate(`/results#${encoded}`);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [input, onNavigate]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const loadSample = useCallback((type: 'list' | 'json') => {
    setInput(type === 'list' ? SAMPLE_INPUT : SAMPLE_JSON);
    setError(null);
  }, []);

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
          <span style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
          }}>
            / Analyzer
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
        }}>
          {/* Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <h1 style={{
              fontSize: theme.fontSize.xxl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: '8px',
            }}>
              Analyze Your Skills
            </h1>
            <p style={{
              fontSize: theme.fontSize.md,
              color: theme.colors.textMuted,
              margin: 0,
            }}>
              Paste your skill list to get a detailed analysis
            </p>
          </div>

          {/* Input Card */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.radius.xl,
            border: `1px solid ${theme.colors.border}`,
            padding: '24px',
          }}>
            {/* Format Hint */}
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMuted,
              }}>
                Supported formats:
              </span>
              <button
                onClick={() => loadSample('list')}
                style={{
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: '4px 8px',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.mono,
                }}
              >
                line-by-line
              </button>
              <button
                onClick={() => loadSample('json')}
                style={{
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: '4px 8px',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.mono,
                }}
              >
                JSON array
              </button>
              <button
                onClick={() => setInput(`drwxr-xr-x  5 user  staff  160 Feb  1 12:34 prompt-guard
drwxr-xr-x  4 user  staff  128 Jan 28 09:12 github
drwxr-xr-x  3 user  staff   96 Feb  2 14:56 coding-agent`)}
                style={{
                  background: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: '4px 8px',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.mono,
                }}
              >
                ls -l output
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              placeholder={`Paste your skills here...

Examples:
• One skill per line: prompt-guard
• JSON array: ["skill1", "skill2"]
• With version: github@2.0.0
• ls -l output from skills folder`}
              style={{
                width: '100%',
                height: '240px',
                background: theme.colors.bgTertiary,
                border: `1px solid ${error ? theme.colors.error : theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: '16px',
                fontSize: theme.fontSize.sm,
                fontFamily: theme.fonts.mono,
                color: theme.colors.textPrimary,
                resize: 'vertical',
                outline: 'none',
                transition: theme.transitions.fast,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.accent;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? theme.colors.error : theme.colors.border;
              }}
            />

            {/* Error Message */}
            {error && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: theme.colors.errorGlow,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.error}`,
                color: theme.colors.error,
                fontSize: theme.fontSize.sm,
              }}>
                {error}
              </div>
            )}

            {/* File Upload */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  border: `1px dashed ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  padding: '12px 16px',
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMuted,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.sans,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderHover;
                  e.currentTarget.style.color = theme.colors.textSecondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.color = theme.colors.textMuted;
                }}
              >
                📁 Upload .txt or .json file
              </button>
              <span style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
              }}>
                or paste content directly
              </span>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '16px',
                background: input.trim() 
                  ? `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`
                  : theme.colors.bgTertiary,
                border: 'none',
                borderRadius: theme.radius.lg,
                fontSize: theme.fontSize.md,
                fontWeight: theme.fontWeight.semibold,
                color: input.trim() ? theme.colors.bgPrimary : theme.colors.textMuted,
                cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                fontFamily: theme.fonts.sans,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: theme.transitions.fast,
                opacity: isAnalyzing ? 0.7 : 1,
              }}
            >
              {isAnalyzing ? (
                <>
                  <span style={{
                    animation: 'spin 1s linear infinite',
                  }}>⏳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  🔍 Analyze Skills
                </>
              )}
            </button>
          </div>

          {/* Info Cards */}
          <div style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            {[
              { icon: '🎯', title: 'Health Score', desc: 'Overall skill health rating' },
              { icon: '🔒', title: 'Security Audit', desc: 'Vulnerability assessment' },
              { icon: '📊', title: 'Coverage', desc: 'Category balance analysis' },
              { icon: '⚡', title: 'Updates', desc: 'Outdated skill detection' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.radius.lg,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '16px',
                }}
              >
                <div style={{
                  fontSize: '24px',
                  marginBottom: '8px',
                }}>
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

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
