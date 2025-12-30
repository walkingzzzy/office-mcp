/**
 * 任务规划类型定义
 * 
 * 实现类似 Cursor/Claude/Windsurf 的任务拆分功能
 * AI 先分析任务并拆分为步骤列表，然后逐步执行
 */

/**
 * 任务步骤状态
 * 注意：为兼容性保留 'in_progress' 和 'running'/'executing' 作为别名
 */
export type TaskStepStatus = 
  | 'pending'      // 待执行
  | 'in_progress'  // 执行中（主状态）
  | 'running'      // 执行中（别名，兼容旧代码）
  | 'executing'    // 执行中（别名，兼容 ConversationState）
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'skipped'      // 已跳过

/**
 * 任务计划状态
 * 注意：为兼容性保留多种别名
 */
export type TaskPlanStatus = 
  | 'planning'     // 规划中（主状态）
  | 'draft'        // 规划中（别名，兼容 ConversationState）
  | 'ready'        // 准备就绪（等待用户确认，主状态）
  | 'confirmed'    // 准备就绪（别名，兼容 ConversationState）
  | 'pending'      // 待执行（别名）
  | 'executing'    // 执行中
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'cancelled'    // 已取消

/**
 * 工具调用记录
 */
export interface TaskToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
  error?: string
  executionTime?: number
}

/**
 * 步骤执行结果
 */
export interface TaskStepResult {
  success: boolean
  message: string
  data?: unknown
}

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * 任务步骤
 * 合并了 types/taskPlan.ts 和 ConversationState.ts 的定义
 */
export interface TaskStep {
  /** 步骤 ID */
  id: string
  /** 步骤序号（从 1 开始） */
  index: number
  /** 步骤描述 */
  description: string
  /** 步骤状态 */
  status: TaskStepStatus
  
  // === 工具相关（可选，用于预规划或实际执行）===
  /** 预计执行的工具名称列表（规划阶段） */
  expectedTools?: string[]
  /** 对应的工具名称（执行阶段） */
  toolName?: string
  /** 工具参数（执行阶段） */
  toolArgs?: Record<string, unknown>
  /** 实际执行的工具调用记录 */
  toolCalls?: TaskToolCall[]
  
  // === 结果相关 ===
  /** 执行结果摘要（简单字符串） */
  resultSummary?: string
  /** 执行结果（结构化） */
  result?: TaskStepResult
  /** 错误信息 */
  error?: string
  
  // === 时间相关 ===
  /** 开始时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 预估执行时间（毫秒） */
  estimatedTime?: number
  /** 实际执行时间（毫秒） */
  actualTime?: number
  
  // === 控制相关 ===
  /** 是否可撤销 */
  canUndo?: boolean
  /** 撤销操作 */
  undoAction?: () => Promise<void>
  /** 风险等级 */
  riskLevel?: RiskLevel
  /** 是否需要确认 */
  needsConfirmation?: boolean

  // === 🆕 来源追溯（用于从审查结果生成的步骤）===
  /** 来源问题 ID（对应 ReviewIssue.index） */
  sourceIssueId?: string
  /** 来源问题原始描述 */
  sourceIssueText?: string
  /** 问题类型（来自 ReviewIssue.type） */
  issueType?: 'format' | 'content' | 'style' | 'structure' | 'other'
  /** 位置提示（来自 ReviewIssue.location） */
  locationHint?: string
  /** 依赖的步骤 ID 列表（需要先完成这些步骤） */
  dependsOn?: string[]
}

/**
 * 任务计划
 * 合并了 types/taskPlan.ts 和 ConversationState.ts 的定义
 */
export interface TaskPlan {
  /** 计划 ID */
  id: string
  /** 关联的消息 ID（可选，某些场景下可能没有） */
  messageId?: string
  /** 任务标题/目标 */
  title: string
  /** 任务描述 */
  description?: string
  /** 计划状态 */
  status: TaskPlanStatus
  /** 任务步骤列表 */
  steps: TaskStep[]
  /** 当前执行的步骤索引（从 0 开始，-1 表示未开始） */
  currentStepIndex: number
  /** 总步骤数 */
  totalSteps?: number
  /** 已完成步骤数 */
  completedSteps?: number
  
  // === 时间相关 ===
  /** 创建时间（ISO 字符串格式） */
  createdAt: string
  /** 更新时间（ISO 字符串格式） */
  updatedAt?: string
  /** 开始执行时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 预估总执行时间（毫秒） */
  estimatedTotalTime?: number
  /** 实际总执行时间（毫秒） */
  totalExecutionTime?: number
  
  // === 确认相关 ===
  /** 是否需要用户确认才能执行 */
  requiresConfirmation?: boolean
  /** 用户是否已确认 */
  userConfirmed?: boolean

  // === 🆕 元数据（用于追溯和 UI 展示）===
  /** 计划来源 */
  source?: 'review' | 'user_request' | 'ai_generated'
  /** 原始审查结果的问题数量 */
  sourceIssueCount?: number
  /** 原始用户请求 */
  originalRequest?: string
}

/**
 * 任务计划更新事件
 */
export interface TaskPlanUpdateEvent {
  type: 'step_started' | 'step_completed' | 'step_failed' | 'plan_completed' | 'plan_failed'
  planId: string
  stepId?: string
  stepIndex?: number
  data?: unknown
}

/**
 * 创建步骤的输入类型（扩展支持新字段）
 */
export interface CreateStepInput {
  description: string
  expectedTools?: string[]
  toolName?: string
  toolArgs?: Record<string, unknown>
  riskLevel?: RiskLevel
  needsConfirmation?: boolean
  estimatedTime?: number
  // 🆕 来源追溯
  sourceIssueId?: string
  sourceIssueText?: string
  issueType?: TaskStep['issueType']
  locationHint?: string
  dependsOn?: string[]
}

/**
 * 创建新的任务计划
 */
export function createTaskPlan(
  messageId: string,
  title: string,
  steps: Array<CreateStepInput>,
  options?: {
    description?: string
    requiresConfirmation?: boolean
    // 🆕 元数据
    source?: TaskPlan['source']
    sourceIssueCount?: number
    originalRequest?: string
  }
): TaskPlan {
  const now = new Date().toISOString()
  const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  return {
    id: planId,
    messageId,
    title,
    description: options?.description,
    status: options?.requiresConfirmation ? 'ready' : 'planning',
    steps: steps.map((step, index) => ({
      id: `${planId}-step-${index + 1}`,
      index: index + 1,
      description: step.description,
      status: 'pending' as TaskStepStatus,
      expectedTools: step.expectedTools,
      toolName: step.toolName,
      toolArgs: step.toolArgs,
      canUndo: false,
      riskLevel: step.riskLevel || 'low' as RiskLevel,
      needsConfirmation: step.needsConfirmation,
      estimatedTime: step.estimatedTime,
      // 🆕 来源追溯字段
      sourceIssueId: step.sourceIssueId,
      sourceIssueText: step.sourceIssueText,
      issueType: step.issueType,
      locationHint: step.locationHint,
      dependsOn: step.dependsOn
    })),
    currentStepIndex: -1,
    totalSteps: steps.length,
    completedSteps: 0,
    createdAt: now,
    updatedAt: now,
    requiresConfirmation: options?.requiresConfirmation,
    userConfirmed: !options?.requiresConfirmation,
    // 🆕 元数据
    source: options?.source,
    sourceIssueCount: options?.sourceIssueCount,
    originalRequest: options?.originalRequest
  }
}

/**
 * 开始执行任务计划
 */
export function startTaskPlan(plan: TaskPlan): TaskPlan {
  const now = new Date().toISOString()
  return {
    ...plan,
    status: 'executing',
    currentStepIndex: 0,
    startedAt: now,
    updatedAt: now,
    steps: plan.steps.map((step, index) => 
      index === 0 
        ? { ...step, status: 'in_progress' as TaskStepStatus, startedAt: now }
        : step
    )
  }
}

/**
 * 完成当前步骤并开始下一步
 */
export function completeCurrentStep(
  plan: TaskPlan,
  result?: { resultSummary?: string; toolCalls?: TaskToolCall[] }
): TaskPlan {
  const currentIndex = plan.currentStepIndex
  const nextIndex = currentIndex + 1
  const now = new Date().toISOString()
  const totalSteps = plan.totalSteps ?? plan.steps.length
  const completedSteps = plan.completedSteps ?? 0
  
  const updatedSteps = plan.steps.map((step, index) => {
    if (index === currentIndex) {
      return {
        ...step,
        status: 'completed' as TaskStepStatus,
        completedAt: now,
        resultSummary: result?.resultSummary,
        toolCalls: result?.toolCalls
      }
    }
    if (index === nextIndex && nextIndex < totalSteps) {
      return {
        ...step,
        status: 'in_progress' as TaskStepStatus,
        startedAt: now
      }
    }
    return step
  })
  
  const isCompleted = nextIndex >= totalSteps
  
  return {
    ...plan,
    steps: updatedSteps,
    currentStepIndex: isCompleted ? currentIndex : nextIndex,
    completedSteps: completedSteps + 1,
    status: isCompleted ? 'completed' : 'executing',
    updatedAt: now,
    completedAt: isCompleted ? now : undefined,
    totalExecutionTime: isCompleted && plan.startedAt 
      ? Date.now() - new Date(plan.startedAt).getTime() 
      : undefined
  }
}

/**
 * 标记当前步骤失败
 */
export function failCurrentStep(plan: TaskPlan, error: string): TaskPlan {
  const currentIndex = plan.currentStepIndex
  const now = new Date().toISOString()
  
  return {
    ...plan,
    status: 'failed',
    updatedAt: now,
    completedAt: now,
    steps: plan.steps.map((step, index) => 
      index === currentIndex 
        ? { ...step, status: 'failed' as TaskStepStatus, error, completedAt: now }
        : step
    ),
    totalExecutionTime: plan.startedAt 
      ? Date.now() - new Date(plan.startedAt).getTime() 
      : undefined
  }
}

/**
 * 获取任务计划的进度百分比
 */
export function getTaskPlanProgress(plan: TaskPlan): number {
  const totalSteps = plan.totalSteps ?? plan.steps.length
  const completedSteps = plan.completedSteps ?? 0
  if (totalSteps === 0) return 0
  return Math.round((completedSteps / totalSteps) * 100)
}

/**
 * 获取当前正在执行的步骤
 */
export function getCurrentStep(plan: TaskPlan): TaskStep | null {
  if (plan.currentStepIndex < 0 || plan.currentStepIndex >= plan.steps.length) {
    return null
  }
  return plan.steps[plan.currentStepIndex]
}
