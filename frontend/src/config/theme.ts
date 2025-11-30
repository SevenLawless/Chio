/**
 * Theme Configuration
 * 
 * Centralized theme tokens for consistent styling across the application.
 * These values should match those defined in tailwind.config.js
 */

export const theme = {
  colors: {
    // Brand Colors - Dark green palette
    brand: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4a9d6e', // Primary green
      600: '#3d7c5f',
      700: '#2d5a3d',
      800: '#1a4d3a',
      900: '#0d2818', // Darkest green
    },
    
    // Dark theme colors
    dark: {
      50: '#1a1a1a',
      100: '#0f0f0f',
      200: '#0a0a0a',
      300: '#000000',
    },
    
    // Semantic Colors
    success: {
      light: '#6ee7b7', // emerald-300
      DEFAULT: '#10b981', // emerald-500
      dark: '#059669', // emerald-600
    },
    error: {
      light: '#fda4af', // rose-300
      DEFAULT: '#f43f5e', // rose-500
      dark: '#e11d48', // rose-600
    },
    warning: {
      light: '#fcd34d', // amber-300
      DEFAULT: '#f59e0b', // amber-500
      dark: '#d97706', // amber-600
    },
    
    // Grayscale (using Tailwind's slate)
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
  
  typography: {
    fontFamily: {
      sans: '"Inter Variable", Inter, system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    DEFAULT: '0.5rem',// 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px - cards
    '2xl': '2rem',    // 32px - large cards
    full: '9999px',   // Fully rounded
  },
  
  shadows: {
    card: '0 20px 45px -20px rgba(15, 23, 42, 0.4)',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  opacity: {
    glass: '0.05',      // bg-white/5
    light: '0.10',      // bg-white/10
    medium: '0.20',     // bg-white/20
    strong: '0.40',     // bg-white/40
    overlay: '0.70',    // Modal backdrops
  },
  
  transitions: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },
} as const;

// Type-safe theme access
export type Theme = typeof theme;
export type BrandColor = keyof typeof theme.colors.brand;
export type FontSize = keyof typeof theme.typography.fontSize;

// Helper functions
export const getBrandColor = (shade: BrandColor = 500): string => {
  return theme.colors.brand[shade];
};

export const getSpacing = (size: keyof typeof theme.spacing): string => {
  return theme.spacing[size];
};

export const getBorderRadius = (size: keyof typeof theme.borderRadius): string => {
  return theme.borderRadius[size];
};

// Export as default for easy importing
export default theme;

