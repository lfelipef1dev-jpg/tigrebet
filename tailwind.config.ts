import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
      },
      colors: {
        dark: {
          primary: '#080812',
          secondary: '#0d0d1a',
          tertiary: '#12121f',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFF8DC',
          400: '#FFDF60',
          500: '#FFD700',
          600: '#FFA500',
          700: '#FF8C00',
          800: '#B8860B',
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
        'gradient-dark': 'linear-gradient(135deg, #080812 0%, #0d0d1a 50%, #12121f 100%)',
      },
      animation: {
        'gold-glow': 'goldGlow 2.5s ease-in-out infinite',
        'float': 'float 3.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'number-tick': 'numberTick 0.3s ease-out',
      },
      keyframes: {
        goldGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255,215,0,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,165,0,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        numberTick: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(255,215,0,0.3)',
        'gold-md': '0 0 20px rgba(255,215,0,0.4)',
        'gold-lg': '0 0 40px rgba(255,215,0,0.5)',
        'gold-xl': '0 0 60px rgba(255,215,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
