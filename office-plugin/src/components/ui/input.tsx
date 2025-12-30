import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // 焦点样式增强 - 双层阴影 + 光晕效果（与主应用统一）
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'focus-visible:shadow-[0_0_0_2px_rgba(99,102,241,0.4),0_0_15px_rgba(99,102,241,0.15)]',
        'dark:focus-visible:shadow-[0_0_0_2px_rgba(99,102,241,0.5),0_0_20px_rgba(99,102,241,0.2)]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
