/**
 * BrandAvatar - 品牌头像组件
 * 已完全迁移到 Tailwind，移除 Fluent UI 依赖
 * 
 * 用于: AI 消息头像、空状态展示、用户头像
 */

import React from 'react'

import { cn } from '@/lib/utils'

// 导入主应用品牌资源
import BrandAvatarImage from '../../../assets/brand-avatar.png'
import BrandLogoImage from '../../../assets/brand-logo.png'

export interface BrandAvatarProps {
  /** 尺寸 */
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128
  /** 是否为 AI 头像 (使用品牌色背景) */
  isAI?: boolean
  /** 用户名 (用于用户头像) */
  name?: string
  /** 用户头像 URL */
  imageUrl?: string
  /** 自定义样式类名 */
  className?: string
  /** 使用 Logo 而非 Avatar 图标 (用于大尺寸展示) */
  useLogo?: boolean
  /** 是否显示光晕动画 */
  showGlow?: boolean
}

// 获取用户名首字母
const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// 根据名字生成一致的背景色
const getColorFromName = (name?: string): string => {
  if (!name) return 'bg-gray-400'
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const BrandAvatar: React.FC<BrandAvatarProps> = ({
  size = 32,
  isAI = true,
  name,
  imageUrl,
  className,
  useLogo = false,
  showGlow = false
}) => {
  // AI 头像 - 使用品牌 Logo
  if (isAI) {
    const imageSrc = useLogo || size >= 48 ? BrandLogoImage : BrandLogoImage // 统一使用蓝色Logo
    
    return (
      <div className={cn(showGlow && 'animate-logo-glow rounded-full', className)}>
        <img 
          src={imageSrc} 
          alt="武汉问津" 
          width={size} 
          height={size}
          className="rounded-full ring-2 ring-primary/20 object-cover"
        />
      </div>
    )
  }

  // 用户头像 - 有图片时显示图片
  if (imageUrl) {
    return (
      <div 
        className={cn('rounded-full ring-2 ring-accent/20 overflow-hidden', className)}
        style={{ width: size, height: size }}
      >
        <img 
          src={imageUrl} 
          alt={name || '用户'} 
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // 用户头像 - 无图片时显示首字母
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)
  const fontSize = size < 24 ? 'text-[10px]' : size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-base'
  
  return (
    <div 
      className={cn(
        'rounded-full ring-2 ring-accent/20 flex items-center justify-center text-white font-medium',
        bgColor,
        fontSize,
        className
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}

export default BrandAvatar
