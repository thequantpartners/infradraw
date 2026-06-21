/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens unificados de landing.html + app.html
        bg: '#060b14',
        surface: '#0d1521', // --surface / --panel
        surface2: '#111c2e', // --surface2 / --panel-2
        border: '#1e2d44',
        border2: '#253650',
        text: '#e8f0fe',
        muted: '#7a92b4',
        dim: '#3d5278',
        blue: '#4f8cff', // --blue / --accent
        blue2: '#3b6de8',
        purple: '#7c5af0',
        cyan: '#22d3ee',
        green: '#34d399', // --green en landing
        emerald: '#10b981', // --green en app
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backgroundImage: {
        grad: 'linear-gradient(135deg, #4f8cff 0%, #7c5af0 100%)',
        grad2: 'linear-gradient(135deg, #22d3ee 0%, #4f8cff 50%, #7c5af0 100%)',
      },
      boxShadow: {
        glow: '0 8px 32px rgba(79,140,255,.35)',
        'glow-lg': '0 12px 40px rgba(79,140,255,.5)',
        accent: '0 4px 20px rgba(79,140,255,.25)',
        'accent-hover': '0 6px 24px rgba(79,140,255,.4)',
        mock: '0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(79,140,255,.08)',
        phone: '0 24px 80px rgba(0,0,0,.5)',
        card: '0 4px 20px rgba(0,0,0,.15)',
        'card-hover': '0 12px 30px rgba(79,140,255,.15)',
        toast: '0 12px 40px rgba(0,0,0,.5)',
        'pro-card': '0 0 0 1px rgba(79,140,255,.25), 0 20px 60px rgba(79,140,255,.15)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.5', transform: 'scale(1.4)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'none' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .7s ease both',
        'fadeUp-fast': 'fadeUp .6s ease both',
        fadeIn: 'fadeIn .4s ease',
        pulse: 'pulse 2s ease infinite',
        spin: 'spin .8s linear infinite',
        'spin-fast': 'spin .7s linear infinite',
        shimmer: 'shimmer 1.4s infinite',
        float: 'float 4s ease-in-out infinite',
        slideIn: 'slideIn .3s cubic-bezier(0.16,1,0.3,1)',
        slideUp: 'slideUp .3s ease',
      },
    },
  },
  plugins: [],
};
