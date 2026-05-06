/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    // We rely on CSS variables (tokens.css + themes/*.css) for design tokens.
    // Tailwind utilities are kept lean and reference those vars where useful.
    extend: {
      fontSize: {
        'fluid-xs': 'var(--text-xs)',
        'fluid-sm': 'var(--text-sm)',
        'fluid-base': 'var(--text-base)',
        'fluid-lg': 'var(--text-lg)',
        'fluid-xl': 'var(--text-xl)',
        'fluid-2xl': 'var(--text-2xl)',
        'fluid-display': 'var(--text-display)',
        'fluid-mega': 'var(--text-mega)',
      },
      spacing: {
        'fluid-1': 'var(--space-1)',
        'fluid-2': 'var(--space-2)',
        'fluid-3': 'var(--space-3)',
        'fluid-4': 'var(--space-4)',
        'fluid-6': 'var(--space-6)',
        'fluid-8': 'var(--space-8)',
        'fluid-12': 'var(--space-12)',
      },
      borderRadius: {
        'token-sm': 'var(--radius-sm)',
        'token-md': 'var(--radius-md)',
        'token-lg': 'var(--radius-lg)',
      },
      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        'in-out-quart': 'var(--ease-in-out-quart)',
      },
      zIndex: {
        cursor: 'var(--z-cursor)',
        modal: 'var(--z-modal)',
        header: 'var(--z-header)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [],
};
