# PowerPoint MCP 服务功能说明文档

## 文档概述

本文档详细说明了 PowerPoint MCP 服务需要实现的功能，基于 Microsoft PowerPoint 在日常工作中的常用操作场景。所有功能将通过 MCP（Model Context Protocol）协议提供给 AI 客户端，实现智能化的演示文稿处理能力。

本文档基于以下深度调研：
- 企业培训与产品发布演示场景
- 销售演示与客户展示需求
- 批量演示文稿生成需求
- 品牌统一与模板标准化需求
- 在线演示与远程演示需求
- 演示录制与视频导出需求

---

## 一、演示文稿基础操作

### 1.1 演示文稿创建与管理

#### 功能列表
- **创建新演示文稿**
  - 创建空白演示文稿
  - 基于模板创建
  - 从现有演示文稿复制

- **演示文稿打开与读取**
  - 打开现有演示文稿
  - 读取演示文稿属性
  - 获取幻灯片列表

- **演示文稿保存**
  - 保存为 PPTX 格式
  - 保存为其他格式（PDF、图片、视频等）
  - 自动保存

#### MCP 工具定义
```typescript
{
  name: "create_presentation",
  description: "创建新的 PowerPoint 演示文稿",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      template: { type: "string", optional: true },
      title: { type: "string", optional: true },
      subtitle: { type: "string", optional: true }
    }
  }
}
```

---

## 二、幻灯片管理

### 2.1 幻灯片操作

#### 功能列表
- **幻灯片创建**
  - 添加新幻灯片
  - 基于布局添加幻灯片
  - 复制幻灯片
  - 从其他演示文稿插入幻灯片

- **幻灯片删除**
  - 删除指定幻灯片
  - 批量删除幻灯片

- **幻灯片排序**
  - 移动幻灯片位置
  - 重新排列幻灯片顺序

#### MCP 工具定义
```typescript
{
  name: "add_slide",
  description: "添加新幻灯片",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      layout: { type: "string", enum: ["title", "title_and_content", "section_header", "two_content", "comparison", "title_only", "blank"] },
      title: { type: "string", optional: true },
      content: { type: "string", optional: true },
      position: { type: "number", optional: true }
    }
  }
}
```

### 2.2 幻灯片布局

#### 功能列表
- **布局类型**
  - 标题幻灯片
  - 标题和内容
  - 节标题
  - 两栏内容
  - 比较布局
  - 仅标题
  - 空白布局

- **布局应用**
  - 更改幻灯片布局
  - 自定义布局

---

## 三、文本处理

### 3.1 文本插入与编辑

#### 功能列表
- **文本插入**
  - 插入标题文本
  - 插入正文文本
  - 插入文本框
  - 插入占位符文本

- **文本编辑**
  - 修改文本内容
  - 删除文本
  - 替换文本

#### MCP 工具定义
```typescript
{
  name: "add_text",
  description: "添加文本",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      text: { type: "string" },
      position: { type: "object" },
      style: { type: "object", optional: true }
    }
  }
}
```

### 3.2 文本格式化

#### 功能列表
- **字符格式**
  - 字体名称
  - 字体大小
  - 字体颜色
  - 加粗、斜体、下划线
  - 文字阴影
  - 文字效果

- **段落格式**
  - 对齐方式（左、中、右、两端对齐）
  - 行距
  - 段落间距
  - 项目符号和编号
  - 多级列表

#### MCP 工具定义
```typescript
{
  name: "format_text",
  description: "格式化文本",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      textElement: { type: "string" },
      format: {
        type: "object",
        properties: {
          fontName: { type: "string" },
          fontSize: { type: "number" },
          bold: { type: "boolean" },
          italic: { type: "boolean" },
          color: { type: "string" },
          alignment: { type: "string" }
        }
      }
    }
  }
}
```

---

## 四、表格操作

### 4.1 表格创建与编辑

#### 功能列表
- **表格创建**
  - 插入表格
  - 指定行列数
  - 设置表格位置和大小

- **表格编辑**
  - 插入行/列
  - 删除行/列
  - 合并单元格
  - 拆分单元格
  - 调整行高/列宽

- **表格数据**
  - 填充表格数据
  - 读取表格数据

#### MCP 工具定义
```typescript
{
  name: "add_table",
  description: "添加表格",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      rows: { type: "number" },
      cols: { type: "number" },
      data: { type: "array", items: { type: "array" } },
      position: { type: "object" },
      style: { type: "object", optional: true }
    }
  }
}
```

### 4.2 表格格式化

#### 功能列表
- **表格样式**
  - 应用内置表格样式
  - 自定义表格边框
  - 设置表格填充
  - 表头样式

- **单元格格式**
  - 单元格对齐
  - 单元格填充
  - 单元格边框

---

## 五、图片与多媒体

### 5.1 图片操作

#### 功能列表
- **图片插入**
  - 从文件插入图片
  - 从 URL 插入图片
  - 插入图片占位符

- **图片编辑**
  - 调整图片大小
  - 裁剪图片
  - 图片旋转
  - 图片位置调整
  - 图片样式应用

- **图片格式**
  - 图片亮度/对比度
  - 图片艺术效果
  - 图片压缩

#### MCP 工具定义
```typescript
{
  name: "add_image",
  description: "添加图片",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      imagePath: { type: "string" },
      position: { type: "object" },
      size: { type: "object", optional: true },
      style: { type: "object", optional: true }
    }
  }
}
```

### 5.2 音频与视频

#### 功能列表
- **音频插入**
  - 插入音频文件
  - 设置音频播放选项
  - 音频图标设置

- **视频插入**
  - 插入视频文件
  - 设置视频播放选项
  - 视频预览图

#### MCP 工具定义
```typescript
{
  name: "add_media",
  description: "添加音频或视频",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      mediaPath: { type: "string" },
      mediaType: { type: "string", enum: ["audio", "video"] },
      position: { type: "object" },
      autoplay: { type: "boolean", optional: true }
    }
  }
}
```

---

## 六、形状与 SmartArt

### 6.1 形状操作

#### 功能列表
- **形状插入**
  - 基本形状（矩形、圆形、箭头等）
  - 线条和连接符
  - 流程图形状
  - 标注和文本框

- **形状编辑**
  - 调整形状大小
  - 旋转形状
  - 形状填充和轮廓
  - 形状效果

#### MCP 工具定义
```typescript
{
  name: "add_shape",
  description: "添加形状",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      shapeType: { type: "string", enum: ["rectangle", "rounded_rectangle", "oval", "triangle", "arrow", "line"] },
      position: { type: "object" },
      size: { type: "object" },
      fill: { type: "object", optional: true },
      outline: { type: "object", optional: true },
      text: { type: "string", optional: true }
    }
  }
}
```

### 6.2 SmartArt 图形

#### 功能列表
- **SmartArt 插入**
  - 插入 SmartArt 图形
  - 选择 SmartArt 类型
  - 编辑 SmartArt 内容

- **SmartArt 格式化**
  - 更改颜色
  - 更改样式
  - 更改布局

---

## 七、图表操作

### 7.1 图表创建

#### 功能列表
- **图表类型**
  - 柱状图
  - 折线图
  - 饼图
  - 条形图
  - 面积图
  - 散点图
  - 组合图

- **图表数据**
  - 设置图表数据源
  - 编辑图表数据
  - 切换行列

#### MCP 工具定义
```typescript
{
  name: "add_chart",
  description: "添加图表",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      chartType: { type: "string", enum: ["column", "line", "pie", "bar", "area", "scatter"] },
      data: { type: "array", items: { type: "array" } },
      position: { type: "object" },
      title: { type: "string", optional: true }
    }
  }
}
```

### 7.2 图表格式化

#### 功能列表
- **图表元素**
  - 图表标题
  - 坐标轴
  - 图例
  - 数据标签
  - 网格线

- **图表样式**
  - 图表样式
  - 颜色方案
  - 图表布局

---

## 八、主题与设计

### 8.1 主题应用

#### 功能列表
- **内置主题**
  - 应用内置主题
  - 更改主题颜色
  - 更改主题字体
  - 更改主题效果

- **自定义主题**
  - 创建自定义主题
  - 保存主题

#### MCP 工具定义
```typescript
{
  name: "apply_theme",
  description: "应用主题",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      themeName: { type: "string" },
      colorScheme: { type: "string", optional: true },
      fontScheme: { type: "string", optional: true }
    }
  }
}
```

### 8.2 背景设置

#### 功能列表
- **背景格式**
  - 纯色背景
  - 渐变背景
  - 图片背景
  - 图案背景

- **背景应用**
  - 应用到当前幻灯片
  - 应用到所有幻灯片

---

## 九、动画与过渡

### 9.1 动画效果

#### 功能列表
- **进入动画**
  - 淡入
  - 飞入
  - 擦除
  - 缩放
  - 其他进入效果

- **强调动画**
  - 脉冲
  - 颜色脉冲
  - 陀螺旋
  - 其他强调效果

- **退出动画**
  - 淡出
  - 飞出
  - 其他退出效果

- **路径动画**
  - 直线路径
  - 曲线路径
  - 自定义路径

#### MCP 工具定义
```typescript
{
  name: "add_animation",
  description: "添加动画",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      objectId: { type: "string" },
      animationType: { type: "string", enum: ["fade", "fly", "wipe", "zoom"] },
      effect: { type: "string", enum: ["in", "out", "emphasis"] },
      duration: { type: "number", optional: true },
      delay: { type: "number", optional: true }
    }
  }
}
```

### 9.2 过渡效果

#### 功能列表
- **过渡类型**
  - 淡出
  - 推进
  - 擦除
  - 分割
  - 其他过渡效果

- **过渡设置**
  - 过渡持续时间
  - 自动换片时间
  - 声音效果

#### MCP 工具定义
```typescript
{
  name: "set_transition",
  description: "设置幻灯片过渡效果",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      transitionType: { type: "string", enum: ["fade", "push", "wipe", "split"] },
      duration: { type: "number", optional: true },
      sound: { type: "string", optional: true }
    }
  }
}
```

---

## 十、母版视图

### 10.1 幻灯片母版

#### 功能列表
- **母版编辑**
  - 编辑幻灯片母版
  - 编辑标题母版
  - 编辑版式

- **母版元素**
  - 母版背景
  - 母版占位符
  - 母版文本样式
  - 母版页眉页脚

---

## 十一、备注与批注

### 11.1 演讲者备注

#### 功能列表
- **备注添加**
  - 添加备注内容
  - 编辑备注
  - 删除备注

#### MCP 工具定义
```typescript
{
  name: "add_speaker_notes",
  description: "添加演讲者备注",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      notes: { type: "string" }
    }
  }
}
```

### 11.2 批注功能

#### 功能列表
- **批注管理**
  - 添加批注
  - 查看批注
  - 回复批注
  - 删除批注

---

## 十二、超链接与动作

### 12.1 超链接

#### 功能列表
- **链接类型**
  - 链接到网页
  - 链接到幻灯片
  - 链接到文件
  - 链接到电子邮件

#### MCP 工具定义
```typescript
{
  name: "add_hyperlink",
  description: "添加超链接",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      slideIndex: { type: "number" },
      text: { type: "string" },
      url: { type: "string" },
      linkType: { type: "string", enum: ["url", "slide", "file", "email"] }
    }
  }
}
```

### 12.2 动作按钮

#### 功能列表
- **动作设置**
  - 鼠标悬停动作
  - 鼠标单击动作
  - 链接到幻灯片
  - 运行程序
  - 运行宏

---

## 十三、页眉页脚

### 13.1 页眉页脚设置

#### 功能列表
- **页眉页脚元素**
  - 日期和时间
  - 幻灯片编号
  - 页脚文本
  - 页眉文本（备注和讲义）

- **应用范围**
  - 应用到所有幻灯片
  - 应用到当前幻灯片
  - 标题幻灯片不显示

#### MCP 工具定义
```typescript
{
  name: "set_header_footer",
  description: "设置页眉页脚",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      showDate: { type: "boolean", optional: true },
      showSlideNumber: { type: "boolean", optional: true },
      footerText: { type: "string", optional: true },
      applyToAll: { type: "boolean", default: true }
    }
  }
}
```

---

## 十四、幻灯片放映

### 14.1 放映设置

#### 功能列表
- **放映类型**
  - 演讲者放映
  - 观众自行浏览
  - 在展台浏览

- **放映选项**
  - 循环放映
  - 不使用动画
  - 不使用过渡
  - 旁白和激光笔

---

## 十五、导出与打印

### 15.1 导出功能

#### 功能列表
- **导出格式**
  - 导出为 PDF
  - 导出为图片（每张幻灯片一张图片）
  - 导出为视频
  - 导出为大纲（RTF）

#### MCP 工具定义
```typescript
{
  name: "export_presentation",
  description: "导出演示文稿",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      outputFormat: { type: "string", enum: ["pdf", "images", "video"] },
      outputPath: { type: "string" },
      options: { type: "object", optional: true }
    }
  }
}
```

### 15.2 打印设置

#### 功能列表
- **打印选项**
  - 打印全部幻灯片
  - 打印当前幻灯片
  - 打印选定幻灯片
  - 打印范围

- **打印版式**
  - 整页幻灯片
  - 备注页
  - 大纲
  - 讲义（每页多张幻灯片）

---

## 十六、协作功能

### 16.1 共享与协作

#### 功能列表
- **批注**
  - 添加批注
  - 查看批注
  - 回复批注

- **版本控制**
  - 查看版本历史
  - 恢复版本

---

## 十七、内容提取

### 17.1 信息提取

#### 功能列表
- **内容提取**
  - 提取所有文本
  - 提取幻灯片标题
  - 提取备注内容
  - 提取图片列表
  - 提取超链接

#### MCP 工具定义
```typescript
{
  name: "extract_content",
  description: "提取演示文稿内容",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      contentType: { type: "string", enum: ["text", "titles", "notes", "images", "links"] }
    }
  }
}
```

---

## 十八、批量操作

### 18.1 批量处理

#### 功能列表
- **批量操作**
  - 批量应用主题
  - 批量添加页眉页脚
  - 批量设置过渡效果
  - 批量插入内容

#### MCP 工具定义
```typescript
{
  name: "batch_process",
  description: "批量处理幻灯片",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      operation: { type: "string" },
      slideIndices: { type: "array", items: { type: "number" }, optional: true },
      parameters: { type: "object" }
    }
  }
}
```

---

## 十八、企业级演示功能

### 18.1 品牌模板管理

#### 功能列表
- **模板操作**
  - 创建企业品牌模板
  - 保存当前演示为模板
  - 基于模板创建演示
  - 管理模板库
  - 模板版本控制

- **品牌元素**
  - Logo自动插入
  - 品牌配色方案
  - 标准字体设置
  - 品牌图形元素

#### MCP 工具定义
```typescript
{
  name: "apply_brand_template",
  description: "应用品牌模板",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      templateName: { type: "string" },
      includeLogo: { type: "boolean", default: true },
      applyToAll: { type: "boolean", default: true }
    }
  }
}
```

### 18.2 批量演示文稿生成

#### 功能列表
- **批量创建**
  - 基于数据源批量生成
  - 模板变量替换
  - 批量格式统一
  - 批量导出

#### MCP 工具定义
```typescript
{
  name: "batch_generate_presentations",
  description: "批量生成演示文稿",
  inputSchema: {
    type: "object",
    properties: {
      templateFile: { type: "string" },
      dataSource: { type: "string" },
      outputDirectory: { type: "string" },
      variables: { type: "object" }
    }
  }
}
```

### 18.3 演示录制与视频导出

#### 功能列表
- **录制功能**
  - 录制幻灯片放映
  - 录制旁白
  - 录制激光笔轨迹
  - 录制计时

- **视频导出**
  - 导出为MP4视频
  - 设置视频质量
  - 设置视频分辨率
  - 添加水印

#### MCP 工具定义
```typescript
{
  name: "record_and_export",
  description: "录制演示并导出为视频",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      outputFile: { type: "string" },
      includeNarration: { type: "boolean", default: true },
      videoQuality: { type: "string", enum: ["low", "medium", "high"] }
    }
  }
}
```

### 18.4 在线演示支持

#### 功能列表
- **演示设置**
  - 设置自动播放
  - 设置演示计时
  - 准备在线演示
  - 生成演示链接

- **远程演示**
  - 屏幕共享支持
  - 演示者视图
  - 观众互动工具

### 18.5 多语言支持

#### 功能列表
- **语言处理**
  - 多语言演示生成
  - 自动翻译（如果支持）
  - 语言切换
  - 保持格式一致

### 18.6 演示分析

#### 功能列表
- **使用统计**
  - 幻灯片使用统计
  - 动画使用分析
  - 内容分析
  - 优化建议

---

## 功能优先级说明

### 高优先级（核心功能）
1. 演示文稿创建、打开、保存
2. 幻灯片添加、删除、管理
3. 文本插入与格式化
4. 图片插入
5. 表格创建
6. 主题应用
7. 动画效果
8. 过渡效果

### 中优先级（常用功能）
1. 形状插入
2. 图表创建
3. 备注添加
4. 导出为 PDF
5. 品牌模板应用
6. 演示录制
7. 批量生成

### 低优先级（高级功能）
1. SmartArt 图形
2. 音频视频插入
3. 母版编辑
4. 超链接与动作
5. 协作功能
6. 多语言支持
7. 演示分析

---

## 使用场景示例

### 场景1：创建产品发布演示
```
用户: "创建一个名为'product_launch.pptx'的演示文稿，标题是'2025新品发布'，副标题'创新引领未来'，然后添加三张幻灯片：产品特性、市场分析、定价策略"
```

### 场景2：添加表格
```
用户: "在第二张幻灯片添加一个4行3列的表格，表头为：特性、旧版本、新版本"
```

### 场景3：插入图片
```
用户: "在第三张幻灯片插入图片'product_image.jpg'，位置居中，宽度设为6英寸"
```

### 场景4：应用动画
```
用户: "为第一张幻灯片的标题添加淡入动画效果"
```

### 场景5：添加备注
```
用户: "为第一张幻灯片添加备注：重点强调创新和性价比"
```

### 场景6：批量演示文稿生成（企业场景）
```
用户: "基于'产品数据.xlsx'，为每个产品自动生成一份产品介绍演示文稿"
```

### 场景7：品牌模板应用
```
用户: "为所有幻灯片应用公司品牌模板，包括Logo、配色方案和字体"
```

### 场景8：演示录制
```
用户: "录制演示文稿，包含旁白和激光笔轨迹，导出为视频文件"
```

### 场景9：在线演示准备
```
用户: "准备在线演示，设置自动播放时间，并生成演示者备注文档"
```

### 场景10：多语言演示文稿
```
用户: "基于中文演示文稿，自动生成英文版本，保持格式和布局一致"
```

---

## 技术实现建议

1. **使用 `pptxgenjs` 库**：Node.js 中最成熟的 PowerPoint 处理库
2. **动画支持**：注意库的动画支持程度，可能需要扩展
3. **多媒体处理**：图片、音频、视频的处理和嵌入
4. **性能优化**：处理大量幻灯片时注意性能
5. **格式兼容性**：确保生成的 PPTX 文件与 Microsoft PowerPoint 完全兼容

---

## 总结

本文档列出了 PowerPoint MCP 服务需要实现的主要功能，涵盖了演示文稿管理、幻灯片操作、文本处理、表格、图片、形状、图表、主题、动画、过渡、备注、导出等各个方面。这些功能基于 Microsoft PowerPoint 在日常工作中的实际使用场景，确保 MCP 服务能够满足用户的实际需求。

