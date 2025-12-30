/**
 * WelcomeScreen - 欢迎界面组件
 * 与主应用 (office-local-bridge) 视觉统一
 * 
 * 更新: 使用统一的主题色、玻璃态效果和动画
 */

import React from 'react'
import {
  BookOpenRegular,
  DocumentTextRegular,
  SearchRegular,
  SparkleRegular
} from '@fluentui/react-icons'
import { BrandAvatar } from '../atoms/BrandAvatar'

interface WelcomeScreenProps {
  onSuggestionClick?: (text: string) => void
}

// 建议卡片数据
const suggestions = [
  { 
    icon: BookOpenRegular, 
    text: '介绍一下问津职校的专业设置',
    colorVar: '--color-primary-rgb'
  },
  { 
    icon: SearchRegular, 
    text: '如何提升专业技能水平',
    colorVar: '--color-accent-rgb'
  },
  { 
    icon: DocumentTextRegular, 
    text: '帮我写一份实习报告',
    color: '#10b981' // emerald-500
  },
  { 
    icon: SparkleRegular, 
    text: '职业规划与就业建议',
    color: '#f59e0b' // amber-500
  },
]

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSuggestionClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fadeInUp">
      {/* Logo 区域 - 与主应用风格一致 */}
      <div className="relative mb-6 animate-float">
        {/* 发光背景 */}
        <div 
          className="absolute -inset-4 rounded-full blur-xl -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(var(--color-primary-rgb), 0.25) 0%, transparent 70%)'
          }}
        />
        {/* Logo 容器 - 渐变背景 */}
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-theme-glow-lg"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--color-primary-rgb)), rgb(var(--color-accent-rgb)))'
          }}
        >
          <BrandAvatar size={48} isAI useLogo className="rounded-xl" />
        </div>
      </div>

      {/* 标题 - 使用渐变文字 */}
      <h2 className="text-2xl font-bold gradient-text mb-2">
        欢迎使用问津AI助手
      </h2>
      
      {/* 副标题 */}
      <p className="text-sm text-theme-accent mb-1">
        武汉问津职业学校 · 始于1958
      </p>

      {/* 描述文字 */}
      <p className="text-sm text-theme-muted text-center max-w-xs mb-8">
        我是您的智能学习伙伴，可以帮助您解答学业问题、提供职业规划建议、辅助完成作业等。开始对话吧！
      </p>

      {/* 建议卡片 - 使用玻璃态效果，响应式布局，窄屏单列 */}
      <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-3 min-[350px]:gap-4 w-full max-w-sm px-2 min-[350px]:px-0">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon
          const iconColor = suggestion.colorVar
            ? `rgb(var(${suggestion.colorVar}))`
            : suggestion.color

          return (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion.text)}
              className="glass flex items-center gap-3 p-3 min-[350px]:p-4 rounded-xl text-left
                         hover:border-primary/30 active:scale-[0.98] animate-ripple
                         card-hover-enhanced"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'fadeInUp 0.5s ease-out both'
              }}
            >
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <IconComponent
                  className="w-4 h-4 min-[350px]:w-5 min-[350px]:h-5"
                  style={{ color: iconColor }}
                />
              </div>
              <span className="text-sm text-theme-secondary line-clamp-2">
                {suggestion.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* 底部提示 */}
      <p className="mt-8 text-xs text-theme-muted">
        在下方输入框中输入问题，按 Enter 发送
      </p>
    </div>
  )
}

export default WelcomeScreen
