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
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        primary: {
          DEFAULT: 'var(--brand-primary)',
          focus: 'var(--brand-primary-focus)'
        },
        'primary-foreground': 'var(--primary-foreground)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)'
        },
        gold: {
          DEFAULT: 'var(--brand-gold)',
          hover: 'var(--brand-gold-hover)',
          dark: 'var(--brand-gold-hover)'
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
        primary: 'var(--foreground)',
        secondary: 'var(--secondary-foreground)'
      },
      spacing: {
        'compact': '0.5rem',  // 8px
        'normal': '1rem',     // 16px
        'loose': '1.5rem',    // 24px
      },
      borderRadius: {
        'sm': '0.125rem', // 2px
        DEFAULT: '0.25rem', // 4px
        'md': '0.25rem', // 4px
        'lg': '0.375rem',   // 6px
        'xl': '0.5rem', // 8px
        '2xl': '0.5rem', // 8px
        '3xl': '0.625rem',    // 10px
      }
    }
  },
  plugins: []
} satisfies Config;
