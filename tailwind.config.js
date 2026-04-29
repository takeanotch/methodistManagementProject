
// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   darkMode: 'class', // or 'class'

//   content: [
//     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       animation: {
//         'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
//         'twinkle': 'twinkle 3s ease-in-out infinite',
//         'trail': 'trail 2s ease-out infinite',
//       },
//       keyframes: {
//         'pulse-slow': {
//           '0%, 100%': { transform: 'scale(1)', opacity: '1' },
//           '50%': { transform: 'scale(1.05)', opacity: '0.9' },
//         },
//         'twinkle': {
//           '0%, 100%': { opacity: '0.3' },
//           '50%': { opacity: '1' },
//         },
//         'trail': {
//           '0%': { opacity: '0', transform: 'scale(0.5)' },
//           '50%': { opacity: '0.5' },
//           '100%': { opacity: '0', transform: 'scale(1.5)' },
//         },
//       },
//     },
//   },
//   plugins: [],
// }
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        // Corporate – NEXT AFRICA
        'next-orange': {
          DEFAULT: '#FFA127',
          light: '#FFB65C',
          dark: '#E68E1E',
        },

        'next-gray': {
          DEFAULT: '#575757',
          light: '#7A7A7A',
          dark: '#3D3D3D',
        },
      },

      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'trail': 'trail 2s ease-out infinite',
      },

      keyframes: {
        'pulse-slow': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        'trail': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
      },
    },
  },

  plugins: [],
}
