// Theraprice Design System — matches web CSS variables
export const COLORS = {
  // Brand greens (from web CSS)
  primary: '#4E7A28',        // --green-deep  (dark green text/buttons)
  primaryMid: '#689F38',     // --green-mid   (header background)
  accent: '#FFC107',         // --green-bright (amber CTA)
  rust: '#BF360C',           // --rust        (price-down / danger)
  rustBg: '#FBE4DA',

  // Trend indicators
  up: '#43A047',
  upBg: '#E3F2E1',
  down: '#D32F2F',
  downBg: '#FBE3E3',
  stable: '#B98900',
  stableBg: '#FFF3D6',
  teal: '#1976D2',
  tealBg: '#E3F0FB',

  // Neutrals
  ink: '#37474F',            // --ink (body text)
  inkSoft: '#757575',        // --ink-soft (secondary text)
  paper: '#FFFFFF',          // --paper
  paperDim: '#F1F5EA',       // --paper-dim (background)
  line: '#E0E0E0',           // --line (borders)

  // Legacy aliases used by existing screens
  background: '#F1F5EA',
  surface: '#FFFFFF',
  textPrimary: '#37474F',
  textSecondary: '#757575',
  border: '#E0E0E0',
  greenLight: '#E3F2E1',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 100,
};

export const SHADOW = {
  small: {
    shadowColor: '#141713',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#141713',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
};