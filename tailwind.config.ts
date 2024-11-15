// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
	],
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		animation: {
		  'ken-burns': 'ken-burns 20s ease infinite',
		  'fade-up': 'fade-up 0.5s ease-out',
		  'fade-down': 'fade-down 0.5s ease-out',
		  'slide-in': 'slide-in 0.5s ease-out',
		  'slide-out': 'slide-out 0.5s ease-out',
		},
		keyframes: {
		  'ken-burns': {
			'0%': { transform: 'scale(1)' },
			'50%': { transform: 'scale(1.1)' },
			'100%': { transform: 'scale(1)' },
		  },
		  'fade-up': {
			'0%': { opacity: '0', transform: 'translateY(20px)' },
			'100%': { opacity: '1', transform: 'translateY(0)' },
		  },
		  'fade-down': {
			'0%': { opacity: '0', transform: 'translateY(-20px)' },
			'100%': { opacity: '1', transform: 'translateY(0)' },
		  },
		  'slide-in': {
			'0%': { transform: 'translateX(-100%)' },
			'100%': { transform: 'translateX(0)' },
		  },
		  'slide-out': {
			'0%': { transform: 'translateX(0)' },
			'100%': { transform: 'translateX(100%)' },
		  },
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  }