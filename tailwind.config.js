/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#010102',
        'surface-1': '#0a0a0d',
        'surface-2': '#111114',
        'surface-3': '#16161b',
        'surface-4': '#1c1c22',
        hairline: '#23252a',
        'hairline-strong': '#2c2e34',
        'hairline-tertiary': '#1a1c20',
        ink: '#f7f8f8',
        'ink-muted': '#d0d6e0',
        'ink-subtle': '#8a8f98',
        'ink-tertiary': '#62666d',
        primary: {
          DEFAULT: '#5e6ad2',
          hover: '#828fff',
          focus: '#5e69d1',
        },
        success: '#27a644',
        danger: '#f04438',
        warning: '#f79009',
        info: '#4cc2ff',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['80px', { lineHeight: '1.05', letterSpacing: '-3px', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.10', letterSpacing: '-1.8px', fontWeight: '600' }],
        'display-md': ['40px', { lineHeight: '1.15', letterSpacing: '-1px', fontWeight: '600' }],
        headline: ['28px', { lineHeight: '1.2', letterSpacing: '-0.6px', fontWeight: '600' }],
        'card-title': ['22px', { lineHeight: '1.25', letterSpacing: '-0.4px', fontWeight: '500' }],
        subhead: ['20px', { lineHeight: '1.4', letterSpacing: '-0.2px' }],
        'body-lg': ['18px', { lineHeight: '1.5', letterSpacing: '-0.1px' }],
        body: ['16px', { lineHeight: '1.5', letterSpacing: '-0.05px' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
        eyebrow: ['13px', { lineHeight: '1.3', letterSpacing: '0.4px', fontWeight: '500' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      spacing: {
        section: '96px',
      },
      maxWidth: {
        container: '1280px',
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(ellipse at center, rgba(94,106,210,0.18), transparent 60%)',
        'grid-fade':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(94,106,210,0.45)',
        'glow-soft': '0 0 40px -12px rgba(94,106,210,0.35)',
        'inner-hairline': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
