import { theme } from '../styles/theme';

interface LoadingScreenProps {
  error?: string;
}

export default function LoadingScreen({ error }: LoadingScreenProps) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.colors.bgPrimary,
      color: theme.colors.textPrimary,
      fontFamily: theme.fonts.sans,
    }}>
      {error ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          background: theme.colors.bgSecondary,
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`,
          maxWidth: '400px',
        }}>
          <span style={{ 
            fontSize: '48px',
            display: 'block',
            marginBottom: '16px',
          }}>
            ⚠️
          </span>
          <h1 style={{ 
            fontSize: theme.fontSize.xl, 
            marginBottom: '12px',
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.error,
          }}>
            Something went wrong
          </h1>
          <p style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            margin: 0,
          }}>
            {error}
          </p>
        </div>
      ) : (
        <>
          {/* Logo */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <span style={{ 
              fontSize: '40px',
              filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.4))',
            }}>
              ⚔️
            </span>
            <h1 style={{ 
              fontSize: theme.fontSize.xxxl, 
              fontWeight: theme.fontWeight.bold,
              margin: 0,
              letterSpacing: '-0.03em',
              background: `linear-gradient(135deg, ${theme.colors.textPrimary}, ${theme.colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              SkillRespec
            </h1>
          </div>
          
          <p style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.md,
            marginBottom: '32px',
            letterSpacing: '0.02em',
          }}>
            Analyzing your skill tree...
          </p>
          
          {/* Loading animation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: theme.colors.accent,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          
          {/* Animated bar */}
          <div style={{
            width: '240px',
            height: '3px',
            background: theme.colors.bgTertiary,
            borderRadius: theme.radius.full,
            overflow: 'hidden',
            marginTop: '32px',
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              background: `linear-gradient(90deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
              borderRadius: theme.radius.full,
              animation: 'loading 1.5s ease-in-out infinite',
              boxShadow: `0 0 10px ${theme.colors.accentGlow}`,
            }} />
          </div>
        </>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(0.7);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
