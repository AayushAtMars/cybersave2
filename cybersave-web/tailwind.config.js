/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#0B3D91',
          light: '#3B82F6',
          ghost: '#EFF6FF',
        },
        background: '#F5F7FA',
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F0F4FF',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          inverse: '#FFFFFF',
        },
        status: {
          success: {
            DEFAULT: '#16A34A',
            bg: '#F0FDF4',
          },
          pending: {
            DEFAULT: '#D97706',
            bg: '#FFFBEB',
          },
          error: {
            DEFAULT: '#DC2626',
            bg: '#FEF2F2',
          },
          inProgress: {
            DEFAULT: '#2563EB',
            bg: '#EFF6FF',
          }
        },
        border: {
          DEFAULT: '#E2E8F0',
          focus: '#2563EB',
        },
        divider: '#F1F5F9',
        overlay: 'rgba(0,0,0,0.5)',
        warning: '#F59E0B',
        info: '#0EA5E9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter is standard, will add to index.css
      }
    },
  },
  plugins: [],
}
