import { extendTheme } from '@chakra-ui/react';

const chakraTheme = extendTheme({
  fonts: {
    heading: 'var(--font-geist-sans), sans-serif',
    body: 'var(--font-geist-sans), sans-serif',
    mono: 'var(--font-geist-mono), monospace',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export default chakraTheme;
