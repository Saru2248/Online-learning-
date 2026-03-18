/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        accent: {
          300: '#fcd34d',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        surface: {
          700: '#293548',
          800: '#1e2235',
          900: '#181b2e',
          950: '#13172b',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #13172b 0%, #1a1d35 50%, #13172b 100%)',
      },
    },
  },
  plugins: [],
};
