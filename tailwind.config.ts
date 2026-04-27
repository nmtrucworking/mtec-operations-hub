import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './home.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        card: 'var(--bg-card)',
        border: 'var(--border-color)',
        'border-highlight': 'var(--border-highlight)',
        gold: {
          DEFAULT: 'var(--brand-gold)',
          hover: 'var(--brand-gold-hover)'
        },
        brand: {
          blue: 'var(--brand-blue)',
          light: 'var(--brand-blue-light)',
          hover: 'var(--brand-blue-hover)'
        },
        success: {
          bg: 'var(--success-bg)',
          text: 'var(--success-text)',
          border: 'var(--success-border)'
        },
        danger: {
          bg: 'var(--danger-bg)',
          text: 'var(--danger-text)',
          border: 'var(--danger-border)'
        },
        warning: {
          bg: 'var(--warning-bg)',
          text: 'var(--warning-text)',
          border: 'var(--warning-border)'
        }
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)'
      },
      spacing: {
        'compact': '0.5rem',  // 8px
        'normal': '1rem',     // 16px
        'loose': '1.5rem',    // 24px
      },
      borderRadius: {
        'sm': '0.125rem', // 2px
        DEFAULT: '0.25rem', // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem',   // 8px
        'xl': '0.625rem', // 10px (originally 12px)
        '2xl': '0.75rem', // 12px (originally 16px)
        '3xl': '1rem',    // 16px (originally 24px)
      }
    }
  },
  plugins: []
} satisfies Config;
