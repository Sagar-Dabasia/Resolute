/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        /* Primary brand = olive green */
        brand: {
          50:  '#f0f8ec',
          100: '#d8edcc',
          200: '#b4d999',
          300: '#8fc268',
          400: '#6aab42',
          500: '#4d8c2a',
          600: '#3d7020',
          700: '#2f5619',
          800: '#243d14',
          900: '#1a2c10',
          950: '#0e1809',
        },
        /* Warm cream accents */
        cream: {
          50:  '#fdfaf5',
          100: '#f8f1e4',
          200: '#f0e3c8',
          300: '#e4cda0',
          400: '#d4b070',
          500: '#c49248',
          600: '#a87630',
          700: '#8a5e22',
          800: '#6e4818',
          900: '#523610',
          950: '#301e06',
        },
        /* Dark olive backgrounds */
        olive: {
          50:  '#f2f7ed',
          100: '#ddebd3',
          200: '#bdd9ab',
          300: '#96c079',
          400: '#72a650',
          500: '#548c34',
          600: '#416e26',
          700: '#335620',
          800: '#2a4419',
          900: '#233914',
          950: '#111d09',
        },
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
