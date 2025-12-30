/**
 * 卡片组件 - AI 科技感设计（主题感知）
 */

import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  actions?: ReactNode
  variant?: 'default' | 'gradient' | 'glow'
  hover?: boolean
}

export default function Card({ 
  children, 
  className, 
  title, 
  description, 
  actions,
  variant = 'default',
  hover = true
}: CardProps) {
  const baseClasses = 'rounded-2xl transition-all duration-300'
  
  const variantClasses = {
    default: 'glass border-theme-primary',
    gradient: 'gradient-border',
    glow: 'glass border-theme-primary glow-effect',
  }

  return (
    <div 
      className={clsx(
        baseClasses, 
        variantClasses[variant], 
        hover && 'card-hover',
        className
      )}
      style={{
        borderWidth: '1px',
        borderColor: `rgba(var(--color-primary), 0.1)`
      }}
    >
      {(title || actions) && (
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid rgba(var(--color-primary), 0.1)` }}
        >
          <div>
            {title && (
              <h3 className="font-semibold text-theme flex items-center">
                <span
                  className="w-1.5 h-5 rounded-full mr-3"
                  style={{ background: `linear-gradient(to bottom, rgb(var(--color-primary)), rgb(var(--color-accent)))` }}
                />
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-theme-muted mt-1 ml-4">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
