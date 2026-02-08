// ═══════════════════════════════════════════════════════════
// Loading Screen - Elegant skeleton loading
// ═══════════════════════════════════════════════════════════

import { theme, gradientText } from '../styles/theme';

interface LoadingScreenProps {
  error?: string;
}

export default function LoadingScreen({ error }: LoadingScreenProps) {
  return (
    <div 
      className="w-screen h-screen flex flex-col items-center justify-center"
      style={{
        background: theme.colors.bgPrimary,
        fontFamily: theme.fonts.sans,
      }}
    >
      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(${theme.colors.border} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {error ? (
        <div 
          className="relative text-center p-8 rounded-xl max-w-md animate-scale-in"
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.lg,
          }}
        >
          <div 
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: theme.colors.errorMuted,
              boxShadow: theme.shadows.glowError,
            }}
          >
            ⚠
          </div>
          <h1 
            className="text-xl font-semibold mb-3"
            style={{ color: theme.colors.error }}
          >
            Something went wrong
          </h1>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: theme.colors.textMuted }}
          >
            {error}
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col items-center">
          {/* Logo with glow */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: theme.colors.accentMuted,
                boxShadow: theme.shadows.glow,
              }}
            >
              ⚔️
            </div>
            <h1 
              className="text-4xl font-bold tracking-tight"
              style={gradientText()}
            >
              SkillRespec
            </h1>
          </div>
          
          <p 
            className="text-base mb-10 animate-fade-in"
            style={{ 
              color: theme.colors.textMuted,
              animationDelay: '100ms',
            }}
          >
            Analyzing your skill tree...
          </p>
          
          {/* Modern loading dots */}
          <div 
            className="flex gap-2 mb-8 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: theme.colors.accent,
                  boxShadow: theme.shadows.glowSm,
                  animation: `loadingDot 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          
          {/* Progress bar */}
          <div 
            className="w-60 h-1 rounded-full overflow-hidden animate-fade-in"
            style={{
              background: theme.colors.bgTertiary,
              animationDelay: '300ms',
            }}
          >
            <div 
              className="h-full rounded-full"
              style={{
                width: '30%',
                background: `linear-gradient(90deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
                boxShadow: theme.shadows.glowSm,
                animation: 'loadingBar 1.8s ease-in-out infinite',
              }}
            />
          </div>
          
          {/* Terminal-style status */}
          <div 
            className="mt-8 px-4 py-2 rounded-lg font-mono text-xs animate-fade-in"
            style={{
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textTertiary,
              animationDelay: '400ms',
            }}
          >
            <span style={{ color: theme.colors.accent }}>$</span>
            {' '}skillrespec init
            <span className="cursor-blink" />
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes loadingDot {
          0%, 100% { 
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          50% { 
            transform: scale(0.8) translateY(-4px);
            opacity: 0.5;
          }
        }
        
        .cursor-blink::after {
          content: '▋';
          animation: blink 1s step-end infinite;
          color: ${theme.colors.accent};
          margin-left: 2px;
        }
        
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
