/**
 * 澄清问题卡片样式
 * 已迁移到 Tailwind
 */

export const clarificationCardStyles = {
  card: 'p-4 rounded-lg bg-card shadow-md max-w-full my-2',
  questionIcon: 'text-primary',
  headerText: 'text-foreground',
  descriptionText: 'text-muted-foreground',
  content: 'mt-3 flex flex-col gap-3',
  questionText: 'text-sm leading-normal text-foreground whitespace-pre-wrap',
  textarea: 'min-h-[80px] w-full',
  optionsContainer: 'flex flex-col gap-2',
  optionButton: 'flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-card cursor-pointer transition-all duration-150 text-left w-full hover:bg-accent',
  optionButtonHover: 'bg-accent',
  optionSelected: 'bg-primary/10 shadow-md border-primary',
  optionDisabled: 'cursor-not-allowed opacity-60',
  optionIcon: 'text-xl shrink-0',
  optionText: 'flex-1 text-sm text-foreground',
  checkIcon: 'text-primary shrink-0',
  actions: 'flex justify-end gap-2 mt-4 pt-3 border-t border-border',
}

export const useClarificationCardStyles = () => clarificationCardStyles
