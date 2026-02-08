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
      background: '#0a0a0f',
      color: '#fff',
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Error</h1>
          <p style={{ color: '#888' }}>{error}</p>
        </>
      ) : (
        <>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 20,
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            ⚔️
          </div>
          <h1 style={{ 
            fontSize: 24, 
            marginBottom: 8,
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            SkillRespec
          </h1>
          <p style={{ color: '#888' }}>Loading skills...</p>
          
          {/* Loading bar */}
          <div style={{
            width: 200,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            marginTop: 20,
            overflow: 'hidden',
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
              borderRadius: 2,
              animation: 'loading 1.5s ease-in-out infinite',
            }} />
          </div>
        </>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(250%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
