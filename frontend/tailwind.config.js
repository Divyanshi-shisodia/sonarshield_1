/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
  abyss: {
    950: '#08111C',
    900: '#0D1724',
    800: '#132131',
    700: '#1A2C40',
    600: '#263B51',
  },

  cyan: {
    glow: '#4FB3BF',
  },

  sonar: {
    blue: '#3B82A0',
    teal: '#4FB3BF',
  },

  danger: {
    DEFAULT: '#EF4444',
  },
},
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 229, 224, 0.25)',
      },
      backgroundImage: {
        'sonar-grid': 'linear-gradient(rgba(34,229,224,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,229,224,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
