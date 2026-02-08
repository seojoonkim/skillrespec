// ═══════════════════════════════════════════════════════════
// SkillRespec Design System - Modern & Refined
// Aesthetic: Vercel + Linear + Raycast inspired
// ═══════════════════════════════════════════════════════════

export const theme = {
  colors: {
    // Backgrounds - Deep dark with subtle variations
    bgPrimary: '#050505',
    bgSecondary: '#0c0c0c',
    bgTertiary: '#141414',
    bgElevated: '#1a1a1a',
    bgHover: 'rgba(255, 255, 255, 0.04)',
    bgActive: 'rgba(255, 255, 255, 0.08)',
    
    // Text - High contrast hierarchy
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#52525b',
    textSubtle: '#3f3f46',
    
    // Accent - Cyan/Teal gradient
    accent: '#22d3ee',
    accentSecondary: '#06b6d4',
    accentGlow: 'rgba(34, 211, 238, 0.25)',
    accentMuted: 'rgba(34, 211, 238, 0.1)',
    
    // Semantic Colors - Vibrant
    success: '#34d399',
    successGlow: 'rgba(52, 211, 153, 0.2)',
    warning: '#fbbf24',
    warningGlow: 'rgba(251, 191, 36, 0.2)',
    error: '#f87171',
    errorGlow: 'rgba(248, 113, 113, 0.2)',
    info: '#60a5fa',
    infoGlow: 'rgba(96, 165, 250, 0.2)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
    borderFocus: '#22d3ee',
  },
  
  // Category colors - Refined, consistent saturation
  categoryColors: {
    productivity: '#94a3b8',   // Slate
    development: '#a78bfa',    // Violet
    media: '#fbbf24',          // Amber
    communication: '#60a5fa',  // Blue
    design: '#f472b6',         // Pink
    marketing: '#fb7185',      // Rose
    security: '#34d399',       // Emerald
    utility: '#818cf8',        // Indigo
    data: '#2dd4bf',           // Teal
    devops: '#fb923c',         // Orange
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
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    full: '9999px',
  },
  
  fonts: {
    sans: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"Fira Code", "SF Mono", Consolas, monospace',
  },
  
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '28px',
    xxxl: '36px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(34, 211, 238, 0.25)',
    glowSuccess: '0 0 20px rgba(52, 211, 153, 0.25)',
    glowWarning: '0 0 20px rgba(251, 191, 36, 0.25)',
    glowError: '0 0 20px rgba(248, 113, 113, 0.25)',
  },
  
  transitions: {
    fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// CSS Variables Export
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

// Utility function for gradient text
export const gradientText = (color1: string, color2: string) => ({
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

// Utility for glow effect
export const glowEffect = (color: string, intensity = 0.25) => ({
  boxShadow: `0 0 20px rgba(${hexToRgb(color)}, ${intensity})`,
});

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}
