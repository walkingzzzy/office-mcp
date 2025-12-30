/**
 * BrandIcon - 品牌图标组件
 * 武汉问津职业学校 Logo
 * 
 * 用于: AI 头像、TopBar Logo、空状态展示、水印
 */

import React from 'react'

// 导入主应用品牌资源
import BrandLogoImage from '../../../assets/brand-logo.png'

export interface BrandIconProps {
  /** 尺寸 (px) */
  size?: number
  /** 颜色 (仅用于兼容旧调用，实际使用图片) */
  color?: string
  /** 自定义样式类名 */
  className?: string
}

/**
 * 武汉问津品牌图标 - 使用主应用实际 Logo
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 24,
  className
}) => {
  return (
    <img
      src={BrandLogoImage}
      alt="武汉问津"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        borderRadius: '50%'
      }}
    />
  )
}

/**
 * 品牌图标 - 填充版本 (用于水印等场景)
 * 使用相同的 Logo 图片
 */
export const BrandIconFilled: React.FC<BrandIconProps> = ({
  size = 24,
  className
}) => {
  return (
    <img
      src={BrandLogoImage}
      alt="武汉问津"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        borderRadius: '50%'
      }}
    />
  )
}

export default BrandIcon
