/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        blood: { DEFAULT: '#c8102e', light: '#fff0f2', dark: '#8b0a1e' },
        safe:  { DEFAULT: '#0f766e', light: '#f0fdfa' },
      },
      keyframes: {
        beat: { '0%,100%': { transform: 'scale(1)' }, '14%': { transform: 'scale(1.12)' }, '28%': { transform: 'scale(1)' }, '42%': { transform: 'scale(1.08)' }, '70%': { transform: 'scale(1)' } },
        fadeup: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        beat: 'beat 1.8s ease-in-out infinite',
        fadeup: 'fadeup .4s ease-out',
      }
    },
  },
  plugins: [],
}
