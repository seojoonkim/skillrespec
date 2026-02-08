// ═══════════════════════════════════════════════════════════
// SkillRespec Design System - Techy, Minimal, Elegant
// Aesthetic: Linear + Raycast + Vercel + Arc
// ═══════════════════════════════════════════════════════════

export const theme = {
  colors: {
    // Backgrounds - Deep dark with subtle variations
    bgPrimary: '#09090b',
    bgSecondary: '#0c0c0e',
    bgTertiary: '#111113',
    bgElevated: '#18181b',
    bgSurface: '#1f1f23',
    bgHover: 'rgba(255, 255, 255, 0.04)',
    bgActive: 'rgba(255, 255, 255, 0.06)',
    
    // Glass Effects
    glassBg: 'rgba(17, 17, 19, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    glassHighlight: 'rgba(255, 255, 255, 0.03)',
    
    // Text - High contrast hierarchy
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textMuted: '#52525b',
    textSubtle: '#3f3f46',
    
    // Accent - Cyan/Mint
    accent: '#22d3ee',
    accentHover: '#67e8f9',
    accentSecondary: '#06b6d4',
    accentGlow: 'rgba(34, 211, 238, 0.25)',
    accentMuted: 'rgba(34, 211, 238, 0.12)',
    accentSubtle: 'rgba(34, 211, 238, 0.06)',
    
    // Semantic Colors
    success: '#34d399',
    successMuted: 'rgba(52, 211, 153, 0.12)',
    successGlow: 'rgba(52, 211, 153, 0.25)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.12)',
    warningGlow: 'rgba(251, 191, 36, 0.25)',
    error: '#f87171',
    errorMuted: 'rgba(248, 113, 113, 0.12)',
    errorGlow: 'rgba(248, 113, 113, 0.25)',
    info: '#60a5fa',
    infoMuted: 'rgba(96, 165, 250, 0.12)',
    infoGlow: 'rgba(96, 165, 250, 0.25)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.1)',
    borderFocus: '#22d3ee',
    borderSubtle: 'rgba(255, 255, 255, 0.03)',
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
    px: '1px',
    '0.5': '2px',
    '1': '4px',
    '1.5': '6px',
    '2': '8px',
    '2.5': '10px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
  },
  
  radius: {
    sm: '4px',
    DEFAULT: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },
  
  fonts: {
    sans: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
  },
  
  fontSize: {
    '2xs': '10px',
    xs: '11px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '22px',
    '3xl': '28px',
    '4xl': '36px',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.25)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 8px rgba(0, 0, 0, 0.35)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(34, 211, 238, 0.25)',
    glowSm: '0 0 10px rgba(34, 211, 238, 0.15)',
    glowLg: '0 0 30px rgba(34, 211, 238, 0.35)',
    innerGlow: 'inset 0 0 20px rgba(34, 211, 238, 0.1)',
    inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
    glowSuccess: '0 0 20px rgba(52, 211, 153, 0.25)',
    glowWarning: '0 0 20px rgba(251, 191, 36, 0.25)',
    glowError: '0 0 20px rgba(248, 113, 113, 0.25)',
  },
  
  transitions: {
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Animation utilities
  animation: {
    fadeIn: 'fadeIn 200ms ease-out forwards',
    slideUp: 'slideUp 250ms ease-out forwards',
    slideDown: 'slideDown 250ms ease-out forwards',
    scaleIn: 'scaleIn 200ms ease-out forwards',
    pulseGlow: 'glow-pulse 2s ease-in-out infinite',
  },
} as const;

// Glass morphism styles
export const glass = {
  background: theme.colors.glassBg,
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: `1px solid ${theme.colors.glassBorder}`,
};

export const glassElevated = {
  ...glass,
  backdropFilter: 'blur(24px) saturate(200%)',
  WebkitBackdropFilter: 'blur(24px) saturate(200%)',
  boxShadow: `${theme.shadows.lg}, inset 0 1px 0 ${theme.colors.glassHighlight}`,
};

export const glassSubtle = {
  background: 'rgba(17, 17, 19, 0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: `1px solid ${theme.colors.borderSubtle}`,
};

// Utility function for gradient text
export const gradientText = (color1 = theme.colors.textPrimary, color2 = theme.colors.accent) => ({
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

// Utility for glow effect
export const glowEffect = (color: string, intensity = 0.25) => ({
  boxShadow: `0 0 20px rgba(${hexToRgb(color)}, ${intensity})`,
});

// Utility for hover transition
export const hoverTransition = {
  transition: theme.transitions.base,
  cursor: 'pointer',
};

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

// Common component style presets
export const componentStyles = {
  panel: {
    ...glass,
    borderRadius: theme.radius.lg,
    padding: theme.spacing['4'],
  },
  
  card: {
    background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing['4'],
    transition: theme.transitions.base,
  },
  
  cardHover: {
    borderColor: theme.colors.borderHover,
    background: theme.colors.bgSurface,
  },
  
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['2'],
    padding: `${theme.spacing['2']} ${theme.spacing['4']}`,
    borderRadius: theme.radius.md,
    fontFamily: theme.fonts.sans,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    transition: theme.transitions.fast,
    cursor: 'pointer',
    border: 'none',
  },
  
  buttonPrimary: {
    background: `linear-gradient(135deg, ${theme.colors.accentSecondary}, ${theme.colors.accent})`,
    color: theme.colors.bgPrimary,
    boxShadow: theme.shadows.glowSm,
  },
  
  buttonSecondary: {
    background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textSecondary,
  },
  
  buttonGhost: {
    background: 'transparent',
    color: theme.colors.textMuted,
  },
  
  input: {
    width: '100%',
    padding: `${theme.spacing['2']} ${theme.spacing['3']}`,
    background: theme.colors.bgTertiary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    fontFamily: theme.fonts.sans,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    transition: theme.transitions.fast,
    outline: 'none',
  },
  
  inputFocus: {
    borderColor: `rgba(34, 211, 238, 0.5)`,
    boxShadow: `0 0 0 2px rgba(34, 211, 238, 0.15)`,
  },
  
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing['1'],
    padding: `${theme.spacing['0.5']} ${theme.spacing['2']}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSize['2xs'],
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing['1.5'],
    padding: `${theme.spacing['1']} ${theme.spacing['3']}`,
    borderRadius: theme.radius.full,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textTertiary,
    transition: theme.transitions.fast,
  },
};
