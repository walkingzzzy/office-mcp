/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ========== 与主应用统一的主题色（使用 CSS 变量）==========
        'theme-primary': 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'theme-accent': 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'theme-bg': 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        'theme-surface': 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'theme-text': 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'theme-text-secondary': 'rgb(var(--color-text-secondary-rgb) / <alpha-value>)',
        'theme-text-muted': 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        'theme-border': 'rgb(var(--color-border-rgb) / <alpha-value>)',
        
        // ========== 新设计系统颜色（shadcn/ui 风格）==========
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // Sidebar 颜色
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        // Chart 颜色
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
        // ========== 保留的 Fluent UI 兼容颜色 ==========
        brand: {
          DEFAULT: 'var(--colorBrandBackground)',
          hover: 'var(--colorBrandBackgroundHover)',
          pressed: 'var(--colorBrandBackgroundPressed)',
          foreground: 'var(--colorBrandForeground1)',
          // 新增：与主应用一致的品牌色阶
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        neutral: {
          bg1: 'var(--colorNeutralBackground1)',
          bg2: 'var(--colorNeutralBackground2)',
          bg3: 'var(--colorNeutralBackground3)',
          bg4: 'var(--colorNeutralBackground4)',
          'bg-hover': 'var(--colorNeutralBackground1Hover)',
        },
      },
      borderRadius: {
        // 统一圆角系统（与主应用一致）
        lg: '12px',
        md: '8px',
        sm: '6px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        // 保留 Fluent UI 兼容
        full: 'var(--borderRadiusCircular, 10000px)',
      },
      fontFamily: {
        sans: ['Geist', 'Geist Fallback', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'Geist Mono Fallback', 'monospace'],
        // 保留 Fluent UI 兼容
        base: 'var(--fontFamilyBase)',
        monospace: 'var(--fontFamilyMonospace)',
      },
      boxShadow: {
        card: 'var(--shadow4)',
        tooltip: 'var(--shadow8)',
        flyout: 'var(--shadow16)',
        glow: '0 0 45px rgba(56, 189, 248, 0.45)',
        glass: '0 30px 90px rgba(15, 23, 42, 0.18)',
        // 新增：与主应用一致的主题阴影
        'theme-glow': '0 4px 20px rgba(var(--color-primary-rgb), 0.15)',
        'theme-glow-lg': '0 8px 30px rgba(var(--color-primary-rgb), 0.2)',
        'theme-glow-xl': '0 12px 40px rgba(var(--color-primary-rgb), 0.25)',
        'theme-accent': '0 4px 20px rgba(var(--color-accent-rgb), 0.2)',
      },
      spacing: {
        '4.5': '1.125rem',
        18: '4.5rem',
      },
      // 动画配置（与主应用一致）
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fadeInUp': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
    }
  },
  // 兼容现有主题系统：支持 .dark 类和 theme-mode 属性
  darkMode: ['class', '[theme-mode="dark"]'],
  plugins: [require('tailwindcss-animate')]
}
