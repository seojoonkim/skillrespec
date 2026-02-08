// ═══════════════════════════════════════════════════════════
// SkillRespec Design System - Minimal & Modern
// 참고: Linear, Vercel, Raycast, Notion
// ═══════════════════════════════════════════════════════════

export const theme = {
  colors: {
    // Backgrounds
    bgPrimary: '#0a0a0a',
    bgSecondary: '#141414',
    bgTertiary: '#1a1a1a',
    bgHover: '#1f1f1f',
    
    // Text
    textPrimary: '#ffffff',
    textSecondary: '#a1a1a1',
    textMuted: '#666666',
    
    // Accent (single color)
    accent: '#10b981',
    accentMuted: 'rgba(16, 185, 129, 0.15)',
    
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Borders
    border: '#262626',
    borderLight: '#1f1f1f',
    borderHover: '#404040',
  },
  
  // Category colors (muted, not neon)
  categoryColors: {
    productivity: '#6b7280',
    development: '#8b5cf6',
    media: '#f59e0b',
    communication: '#3b82f6',
    design: '#ec4899',
    marketing: '#ef4444',
    security: '#10b981',
    utility: '#6366f1',
  } as Record<string, string>,
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  
  fonts: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
  },
  
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// CSS 변수로 내보내기
export const cssVariables = `
  :root {
    --bg-primary: ${theme.colors.bgPrimary};
    --bg-secondary: ${theme.colors.bgSecondary};
    --bg-tertiary: ${theme.colors.bgTertiary};
    --text-primary: ${theme.colors.textPrimary};
    --text-secondary: ${theme.colors.textSecondary};
    --text-muted: ${theme.colors.textMuted};
    --accent: ${theme.colors.accent};
    --border: ${theme.colors.border};
  }
`;
