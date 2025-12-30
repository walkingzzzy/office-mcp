/**
 * 首次使用引导组件
 * 引导用户完成初始配置
 */

import React, { useState } from 'react'

interface Step {
  title: string
  description: string
  content: React.ReactNode
}

interface FirstTimeGuideProps {
  onComplete: () => void
  onSkip?: () => void
}

export function FirstTimeGuide({ onComplete, onSkip }: FirstTimeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps: Step[] = [
    {
      title: '欢迎使用 Office AI 助手',
      description: '让我们快速配置您的 AI 助手',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <p className="text-gray-600">
            Office AI 助手可以帮助您更高效地处理文档、表格和演示文稿。
          </p>
        </div>
      )
    },
    {
      title: '配置 AI 提供商',
      description: '选择您的 AI 服务提供商',
      content: (
        <div>
          <p className="text-gray-600 mb-4">
            您需要配置至少一个 AI 提供商才能使用 AI 功能。
          </p>
          <div className="space-y-2">
            <div className="p-3 border rounded-md">
              <div className="font-medium">OpenAI</div>
              <div className="text-sm text-gray-500">GPT-4, GPT-3.5</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="font-medium">Azure OpenAI</div>
              <div className="text-sm text-gray-500">企业级 AI 服务</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="font-medium">Anthropic</div>
              <div className="text-sm text-gray-500">Claude 系列模型</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '启动本地服务',
      description: '确保 Office Local Bridge 正在运行',
      content: (
        <div>
          <p className="text-gray-600 mb-4">
            Office Local Bridge 是连接插件和 AI 服务的桥梁。
          </p>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            <div>cd office-local-bridge</div>
            <div>npm start</div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            服务将在 http://localhost:3001 启动
          </p>
        </div>
      )
    },
    {
      title: '开始使用',
      description: '一切准备就绪！',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-600">
            您已完成所有配置，现在可以开始使用 AI 助手了！
          </p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        {/* 进度指示器 */}
        <div className="flex justify-between mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 mx-1 rounded ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 内容 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
          <p className="text-gray-500 mb-6">{currentStepData.description}</p>
          <div className="min-h-[200px]">{currentStepData.content}</div>
        </div>

        {/* 按钮 */}
        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            跳过引导
          </button>
          <div className="space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {currentStep < steps.length - 1 ? '下一步' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
