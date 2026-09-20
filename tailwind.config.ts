import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0E17',
          soft: '#0D1320',
        },
        panel: {
          DEFAULT: '#141B29',
          raised: '#182034',
          line: '#2A3648',
        },
        brass: {
          DEFAULT: '#D4A24C',
          soft: '#E8C77E',
          dim: '#8A6A2E',
        },
        flow: {
          DEFAULT: '#4FBDAF',
          soft: '#7ED6C9',
          dim: '#2A6E64',
        },
        garnet: {
          DEFAULT: '#C05B4D',
          soft: '#DE8A7C',
          dim: '#7A362C',
        },
        paper: {
          DEFAULT: '#FAF8F3',
          dim: '#F0EBDE',
        },
        // Data-identity channel colors — validated as a set against dataviz's CVD/contrast
        // checks (adjacent pairs, dark + light). Reserved for chart/channel identity only;
        // never reused for UI status (that stays brass=warning / garnet=error).
        chart: {
          bank: '#3987E5',
          other: '#D95926',
          business: '#199E70',
        },
        chartLight: {
          bank: '#2A78D6',
          other: '#EB6834',
          business: '#1BAF7A',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      boxShadow: {
        instrument: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px -20px rgba(0,0,0,0.6)',
        glow: '0 0 24px rgba(212,162,76,0.35)',
      },
      keyframes: {
        flowShimmer: {
          '0%': { backgroundPosition: '0% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        needleSettle: {
          '0%': { transform: 'rotate(var(--from))' },
          '100%': { transform: 'rotate(var(--to))' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        flowShimmer: 'flowShimmer 2.4s linear infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
