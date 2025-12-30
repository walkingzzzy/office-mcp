/**
 * PowerPoint 幻灯片播放设置工具
 * 使用 PowerPointApi 1.2+ 实现播放设置管理
 * P2 阶段功能
 */

import { sendIPCCommand } from '@office-mcp/shared'
import type { ToolDefinition } from './types.js'

/**
 * 获取幻灯片播放设置
 */
export const pptGetSlideShowSettingsTool: ToolDefinition = {
  name: 'ppt_get_slideshow_settings',
  description: '获取 PowerPoint 演示文稿的幻灯片播放设置',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_get_slideshow_settings', args),
  examples: [
    {
      description: '获取播放设置',
      input: {},
      output: {
        success: true,
        message: '成功获取幻灯片播放设置',
        data: {
          loopContinuously: false,
          showWithNarration: true,
          showWithAnimation: true,
          advanceMode: 'manual',
          slideRange: {
            start: 1,
            end: 10
          },
          presenterView: true,
          kioskMode: false
        }
      }
    }
  ]
}

/**
 * 设置幻灯片播放循环
 */
export const pptSetSlideShowLoopTool: ToolDefinition = {
  name: 'ppt_set_slideshow_loop',
  description: '设置 PowerPoint 幻灯片播放是否循环',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      loopContinuously: {
        type: 'boolean',
        description: '是否循环播放'
      }
    },
    required: ['loopContinuously']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slideshow_loop', args),
  examples: [
    {
      description: '启用循环播放',
      input: {
        loopContinuously: true
      },
      output: {
        success: true,
        message: '成功设置幻灯片循环播放'
      }
    }
  ]
}

/**
 * 设置幻灯片播放范围
 */
export const pptSetSlideShowRangeTool: ToolDefinition = {
  name: 'ppt_set_slideshow_range',
  description: '设置 PowerPoint 幻灯片播放范围',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      rangeType: {
        type: 'string',
        description: '范围类型（all: 全部幻灯片，custom: 自定义范围，current: 当前幻灯片）',
        enum: ['all', 'custom', 'current']
      },
      startSlide: {
        type: 'number',
        description: '起始幻灯片索引（rangeType 为 custom 时必需）'
      },
      endSlide: {
        type: 'number',
        description: '结束幻灯片索引（rangeType 为 custom 时必需）'
      }
    },
    required: ['rangeType']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slideshow_range', args),
  examples: [
    {
      description: '设置播放范围为第3到第8张幻灯片',
      input: {
        rangeType: 'custom',
        startSlide: 3,
        endSlide: 8
      },
      output: {
        success: true,
        message: '成功设置幻灯片播放范围'
      }
    }
  ]
}

/**
 * 设置幻灯片切换方式
 */
export const pptSetSlideAdvanceModeTool: ToolDefinition = {
  name: 'ppt_set_slide_advance_mode',
  description: '设置 PowerPoint 幻灯片切换方式',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      advanceMode: {
        type: 'string',
        description: '切换方式（manual: 手动切换，auto: 自动切换，both: 两者都可）',
        enum: ['manual', 'auto', 'both']
      },
      autoAdvanceTime: {
        type: 'number',
        description: '自动切换时间（秒，advanceMode 为 auto 或 both 时必需）'
      }
    },
    required: ['advanceMode']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slide_advance_mode', args),
  examples: [
    {
      description: '设置为自动切换，每5秒切换一次',
      input: {
        advanceMode: 'auto',
        autoAdvanceTime: 5
      },
      output: {
        success: true,
        message: '成功设置幻灯片切换方式'
      }
    }
  ]
}

/**
 * 设置演示者视图
 */
export const pptSetPresenterViewTool: ToolDefinition = {
  name: 'ppt_set_presenter_view',
  description: '设置 PowerPoint 演示者视图选项',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: '是否启用演示者视图'
      },
      showNotes: {
        type: 'boolean',
        description: '是否显示备注',
        default: true
      },
      showTimer: {
        type: 'boolean',
        description: '是否显示计时器',
        default: true
      },
      showNextSlide: {
        type: 'boolean',
        description: '是否显示下一张幻灯片预览',
        default: true
      }
    },
    required: ['enabled']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_presenter_view', args),
  examples: [
    {
      description: '启用演示者视图并显示所有辅助信息',
      input: {
        enabled: true,
        showNotes: true,
        showTimer: true,
        showNextSlide: true
      },
      output: {
        success: true,
        message: '成功设置演示者视图'
      }
    }
  ]
}

/**
 * 设置信息亭模式
 */
export const pptSetKioskModeTool: ToolDefinition = {
  name: 'ppt_set_kiosk_mode',
  description: '设置 PowerPoint 信息亭（自助浏览）模式',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: '是否启用信息亭模式'
      },
      restartDelay: {
        type: 'number',
        description: '无操作后重新开始的延迟时间（秒）',
        default: 300
      }
    },
    required: ['enabled']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_kiosk_mode', args),
  examples: [
    {
      description: '启用信息亭模式，5分钟无操作后重新开始',
      input: {
        enabled: true,
        restartDelay: 300
      },
      output: {
        success: true,
        message: '成功设置信息亭模式'
      }
    }
  ]
}

/**
 * 设置动画和旁白选项
 */
export const pptSetAnimationAndNarrationTool: ToolDefinition = {
  name: 'ppt_set_animation_and_narration',
  description: '设置 PowerPoint 播放时的动画和旁白选项',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      showAnimation: {
        type: 'boolean',
        description: '是否播放动画'
      },
      showNarration: {
        type: 'boolean',
        description: '是否播放旁白'
      },
      showMediaControls: {
        type: 'boolean',
        description: '是否显示媒体控制条',
        default: true
      }
    },
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_animation_and_narration', args),
  examples: [
    {
      description: '禁用动画但保留旁白',
      input: {
        showAnimation: false,
        showNarration: true,
        showMediaControls: true
      },
      output: {
        success: true,
        message: '成功设置动画和旁白选项'
      }
    }
  ]
}

/**
 * 设置幻灯片播放分辨率
 */
export const pptSetSlideShowResolutionTool: ToolDefinition = {
  name: 'ppt_set_slideshow_resolution',
  description: '设置 PowerPoint 幻灯片播放分辨率',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      resolutionType: {
        type: 'string',
        description: '分辨率类型（auto: 自动，custom: 自定义）',
        enum: ['auto', 'custom']
      },
      width: {
        type: 'number',
        description: '宽度（像素，resolutionType 为 custom 时必需）'
      },
      height: {
        type: 'number',
        description: '高度（像素，resolutionType 为 custom 时必需）'
      }
    },
    required: ['resolutionType']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slideshow_resolution', args),
  examples: [
    {
      description: '设置为1920x1080分辨率',
      input: {
        resolutionType: 'custom',
        width: 1920,
        height: 1080
      },
      output: {
        success: true,
        message: '成功设置幻灯片播放分辨率'
      }
    }
  ]
}

/**
 * 设置幻灯片播放显示器
 */
export const pptSetSlideShowDisplayTool: ToolDefinition = {
  name: 'ppt_set_slideshow_display',
  description: '设置 PowerPoint 幻灯片播放的显示器',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {
      displayType: {
        type: 'string',
        description: '显示器类型（primary: 主显示器，secondary: 副显示器，auto: 自动选择）',
        enum: ['primary', 'secondary', 'auto']
      },
      displayIndex: {
        type: 'number',
        description: '显示器索引（从1开始，displayType 为 auto 时可选）'
      }
    },
    required: ['displayType']
  },
  handler: async (args: any) => sendIPCCommand('ppt_set_slideshow_display', args),
  examples: [
    {
      description: '设置在副显示器上播放',
      input: {
        displayType: 'secondary'
      },
      output: {
        success: true,
        message: '成功设置幻灯片播放显示器'
      }
    }
  ]
}

/**
 * 重置幻灯片播放设置
 */
export const pptResetSlideShowSettingsTool: ToolDefinition = {
  name: 'ppt_reset_slideshow_settings',
  description: '重置 PowerPoint 幻灯片播放设置为默认值',
  category: 'slideshow',
  application: 'powerpoint',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: any) => sendIPCCommand('ppt_reset_slideshow_settings', args),
  examples: [
    {
      description: '重置播放设置',
      input: {},
      output: {
        success: true,
        message: '成功重置幻灯片播放设置'
      }
    }
  ]
}
