module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        slate: {
          950: '#020617',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 32px rgba(34,211,238,0.75)',
      },
    },
  },
  plugins: [],
}
