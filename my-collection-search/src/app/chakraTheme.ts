import { extendTheme } from '@chakra-ui/react';

const chakraTheme = extendTheme({
  fonts: {
    heading: 'var(--font-geist-sans), sans-serif',
    body: 'var(--font-geist-sans), sans-serif',
    mono: 'var(--font-geist-mono), monospace',
  },
  colors: {
    brand: {
      menuBg: '#000', // gray.800
      menuText: '#fff',
      menuHover: '#D1D5DB', // gray.300
      menuActive: '#ECC94B', // yellow.300
      menuActiveText: '#fff',
      menuActiveBorder: '#fff',
      pageBg: '#F7FAFC', // gray.50
      pageText: '#1A202C', // gray.800
      promptBg: '#fffbe6', // light yellow for prompt area (optional)
      // Add more custom colors as needed
    },
    gray: {
      50: '#F7FAFC',
      300: '#D1D5DB',
      400: '#A0AEC0',
      500: '#718096',
      800: '#2D3748',
    },
    yellow: {
      300: '#ECC94B',
    },
    blue: {
      500: '#3182CE',
    },
    green: {
      500: '#38A169',
    },
    red: {
      500: '#E53E3E',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'brand.pageBg',
        color: 'brand.pageText',
      },
    },
  },
});

export default chakraTheme;
