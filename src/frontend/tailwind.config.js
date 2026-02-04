import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '1.5rem',
                md: '2rem',
                lg: '2rem',
                xl: '2rem',
                '2xl': '2rem'
            },
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'oklch(var(--border) / <alpha-value>)',
                input: 'oklch(var(--input) / <alpha-value>)',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background) / <alpha-value>)',
                foreground: 'oklch(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground) / <alpha-value>)'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground) / <alpha-value>)'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
                    foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
                },
                card: {
                    DEFAULT: 'oklch(var(--card) / <alpha-value>)',
                    foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
                },
                chart: {
                    1: 'oklch(var(--chart-1) / <alpha-value>)',
                    2: 'oklch(var(--chart-2) / <alpha-value>)',
                    3: 'oklch(var(--chart-3) / <alpha-value>)',
                    4: 'oklch(var(--chart-4) / <alpha-value>)',
                    5: 'oklch(var(--chart-5) / <alpha-value>)'
                },
                sidebar: {
                    DEFAULT: 'oklch(var(--sidebar) / <alpha-value>)',
                    foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
                    primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
                    'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
                    accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
                    'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
                    border: 'oklch(var(--sidebar-border) / <alpha-value>)',
                    ring: 'oklch(var(--sidebar-ring) / <alpha-value>)'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0,0,0,0.05)'
            },
            spacing: {
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-top': 'env(safe-area-inset-top)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)'
            },
            minHeight: {
                'touch': '44px'
            },
            minWidth: {
                'touch': '44px'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'slide-up': {
                    from: { transform: 'translateY(100%)' },
                    to: { transform: 'translateY(0)' }
                },
                'slide-down': {
                    from: { transform: 'translateY(-100%)' },
                    to: { transform: 'translateY(0)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'slide-up': 'slide-up 0.3s ease-out',
                'slide-down': 'slide-down 0.3s ease-out'
            }
        },
        screens: {
            'xs': '320px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px'
        }
    },
    plugins: [typography, containerQueries, animate]
};
