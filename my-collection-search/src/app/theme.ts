import { Theme } from 'theme-ui';

const theme: Theme = {
  // You can use "colors" to define a palette
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#ff5a5f',
    secondary: '#222',
    muted: '#f6f6f6',
    highlight: '#ffffcc',
    accent: '#609',
    dark: '#000',
  },
  // Base typography
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
    monospace: 'Menlo, monospace',
  },
  // Font sizes array for scaling
  fontSizes: [12, 14, 16, 20, 24, 32, 48],
  // Line heights
  lineHeights: {
    body: 1.5,
    heading: 1.25,
  },
  // Font weights
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },
  // Space scale for margin/padding (array-based)
  space: [0, 4, 8, 16, 32, 64],
  // Radii for rounded corners
  radii: {
    default: 4,
    circle: 99999,
  },
  // Border styles
  borders: {
    default: '1px solid',
  },
  // Text variants
  text: {
    heading: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
    },
    small: {
      fontSize: 1,
      color: 'secondary',
    },
  },
  // Buttons
  buttons: {
    primary: {
      color: 'background',
      bg: 'primary',
    },
    secondary: {
      color: 'background',
      bg: 'secondary',
    },
  },
  // Links
  links: {
    default: {
      color: 'primary',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
};

export default theme;