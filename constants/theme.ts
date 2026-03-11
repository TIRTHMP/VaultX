export const Colors = {
  // Background
  bg: '#0A0A0F',
  bgSecondary: '#111118',
  bgCard: '#13131C',
  bgCardHover: '#1A1A28',
  
  // Surfaces
  surface1: '#16161F',
  surface2: '#1E1E2C',
  surface3: '#252538',
  
  // Primary - Amber/Gold
  primary: '#F5A623',
  primaryLight: '#FFBE55',
  primaryDark: '#D4861A',
  primaryGlow: 'rgba(245, 166, 35, 0.15)',
  
  // Accent
  accentBlue: '#4A9EFF',
  accentGreen: '#00D68F',
  accentRed: '#FF4757',
  accentPurple: '#8B5CF6',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9999BB',
  textTertiary: '#666688',
  textDisabled: '#444466',
  
  // Card gradients
  cardVisa: ['#1a1a2e', '#16213e', '#0f3460'],
  cardMastercard: ['#1a1a1a', '#2d1b1b', '#1a1a1a'],
  cardAmex: ['#1a2a1a', '#1d3a1d', '#142814'],
  cardOther: ['#1E1E2C', '#252538', '#1E1E2C'],
  
  // Borders
  border: 'rgba(255,255,255,0.07)',
  borderActive: 'rgba(245, 166, 35, 0.4)',
  
  // Status
  success: '#00D68F',
  warning: '#F5A623',
  error: '#FF4757',
  info: '#4A9EFF',
  
  // Shimmer
  shimmer1: 'rgba(255,255,255,0.0)',
  shimmer2: 'rgba(255,255,255,0.05)',
  shimmer3: 'rgba(255,255,255,0.0)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const Typography = {
  display: {
    fontFamily: 'System',
    letterSpacing: -0.5,
    fontWeight: '700' as const,
  },
  heading: {
    fontFamily: 'System',
    letterSpacing: -0.3,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'System',
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  mono: {
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: 'System',
    letterSpacing: 0.8,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
};

export const Shadow = {
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
};
