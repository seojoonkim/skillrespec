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
        <>
          <h1 style={{ 
            fontSize: theme.fontSize.xl, 
            marginBottom: '8px',
            fontWeight: theme.fontWeight.semibold,
          }}>
            Error
          </h1>
          <p style={{ color: theme.colors.textMuted }}>{error}</p>
        </>
      ) : (
        <>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '24px' }}>⚔️</span>
            <h1 style={{ 
              fontSize: theme.fontSize.xxl, 
              fontWeight: theme.fontWeight.semibold,
              margin: 0,
            }}>
              SkillRespec
            </h1>
          </div>
          
          <p style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.sm,
            marginBottom: '24px',
          }}>
            Loading skills...
          </p>
          
          {/* Simple loading bar */}
          <div style={{
            width: '200px',
            height: '2px',
            background: theme.colors.border,
            borderRadius: '1px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              background: theme.colors.accent,
              borderRadius: '1px',
              animation: 'loading 1.2s ease-in-out infinite',
            }} />
          </div>
        </>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
