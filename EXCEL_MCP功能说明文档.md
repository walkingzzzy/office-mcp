# Excel MCP 服务功能说明文档

## 文档概述

本文档详细说明了 Excel MCP 服务需要实现的功能，基于 Microsoft Excel 在日常工作中的常用操作场景。所有功能将通过 MCP（Model Context Protocol）协议提供给 AI 客户端，实现智能化的电子表格处理能力。

本文档基于以下深度调研：
- 企业级数据分析与报表自动化需求
- 财务、销售、运营等业务场景
- 大数据处理与性能优化需求
- 数据可视化与商业智能需求
- 数据安全与合规性要求
- 批量数据处理与工作流集成

---

## 一、工作簿与工作表管理

### 1.1 工作簿操作

#### 功能列表
- **创建新工作簿**
  - 创建空白工作簿
  - 基于模板创建
  - 从现有工作簿复制

- **工作簿打开与读取**
  - 打开现有工作簿
  - 读取工作簿属性
  - 获取工作表列表

- **工作簿保存**
  - 保存为 XLSX 格式
  - 保存为其他格式（CSV、PDF、HTML 等）
  - 自动保存

#### MCP 工具定义
```typescript
{
  name: "create_excel_workbook",
  description: "创建新的 Excel 工作簿",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheets: { type: "array", items: { type: "string" } }
    }
  }
}
```

### 1.2 工作表操作

#### 功能列表
- **工作表管理**
  - 创建新工作表
  - 删除工作表
  - 重命名工作表
  - 复制工作表
  - 移动工作表位置

- **工作表保护**
  - 保护工作表
  - 取消保护
  - 设置保护密码

#### MCP 工具定义
```typescript
{
  name: "manage_worksheets",
  description: "管理工作表",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      operation: { type: "string", enum: ["create", "delete", "rename", "copy", "move"] },
      sheetName: { type: "string" },
      newName: { type: "string", optional: true }
    }
  }
}
```

---

## 二、数据输入与编辑

### 2.1 单元格数据操作

#### 功能列表
- **数据输入**
  - 单个单元格写入
  - 批量单元格写入
  - 数据类型设置（文本、数字、日期、公式）

- **数据读取**
  - 读取单个单元格
  - 读取单元格范围
  - 读取整行/整列

- **数据编辑**
  - 修改单元格内容
  - 清除单元格内容
  - 删除单元格（向上/向左移动）

#### MCP 工具定义
```typescript
{
  name: "write_cell",
  description: "写入单元格数据",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      cell: { type: "string" },
      value: { type: ["string", "number", "boolean"] },
      dataType: { type: "string", enum: ["text", "number", "date", "formula"] }
    }
  }
}
```

### 2.2 范围操作

#### 功能列表
- **范围写入**
  - 写入二维数组数据
  - 从指定位置开始写入
  - 批量填充数据

- **范围读取**
  - 读取指定范围
  - 读取整表数据
  - 读取非空数据范围

#### MCP 工具定义
```typescript
{
  name: "write_range",
  description: "批量写入数据范围",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      data: { type: "array", items: { type: "array" } }
    }
  }
}
```

### 2.3 数据填充

#### 功能列表
- **自动填充**
  - 序列填充（数字序列、日期序列）
  - 复制填充
  - 公式填充

---

## 三、公式与函数

### 3.1 公式操作

#### 功能列表
- **公式输入**
  - 插入公式
  - 编辑公式
  - 复制公式

- **公式计算**
  - 计算单元格公式
  - 重新计算工作簿
  - 公式结果获取

#### MCP 工具定义
```typescript
{
  name: "insert_formula",
  description: "插入公式",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      cell: { type: "string" },
      formula: { type: "string" }
    }
  }
}
```

### 3.2 常用函数

#### 功能列表
- **数学函数**
  - SUM（求和）
  - AVERAGE（平均值）
  - MAX/MIN（最大值/最小值）
  - COUNT（计数）

- **文本函数**
  - CONCATENATE（连接）
  - LEFT/RIGHT/MID（提取）
  - UPPER/LOWER（大小写转换）

- **逻辑函数**
  - IF（条件判断）
  - AND/OR（逻辑运算）

- **查找函数**
  - VLOOKUP（垂直查找）
  - HLOOKUP（水平查找）
  - INDEX/MATCH（索引匹配）

- **日期函数**
  - TODAY（今天）
  - NOW（当前时间）
  - YEAR/MONTH/DAY（日期提取）

#### MCP 工具定义
```typescript
{
  name: "apply_function",
  description: "应用常用函数",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      cell: { type: "string" },
      functionName: { type: "string" },
      parameters: { type: "array" }
    }
  }
}
```

---

## 四、数据格式化

### 4.1 单元格格式化

#### 功能列表
- **数字格式**
  - 常规格式
  - 数值格式（小数位数）
  - 货币格式
  - 百分比格式
  - 日期时间格式
  - 自定义格式

- **字体格式**
  - 字体名称
  - 字体大小
  - 字体颜色
  - 加粗、斜体、下划线

- **对齐方式**
  - 水平对齐（左、中、右）
  - 垂直对齐（上、中、下）
  - 文本换行
  - 合并单元格

- **边框与填充**
  - 单元格边框
  - 背景颜色
  - 图案填充

#### MCP 工具定义
```typescript
{
  name: "format_cell",
  description: "格式化单元格",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      cell: { type: "string" },
      format: {
        type: "object",
        properties: {
          numberFormat: { type: "string" },
          font: { type: "object" },
          alignment: { type: "object" },
          border: { type: "object" },
          fill: { type: "object" }
        }
      }
    }
  }
}
```

### 4.2 条件格式

#### 功能列表
- **条件格式规则**
  - 突出显示单元格规则
  - 数据条
  - 色阶
  - 图标集
  - 自定义公式规则

#### MCP 工具定义
```typescript
{
  name: "apply_conditional_formatting",
  description: "应用条件格式",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      rule: {
        type: "object",
        properties: {
          type: { type: "string" },
          condition: { type: "string" },
          format: { type: "object" }
        }
      }
    }
  }
}
```

---

## 五、数据排序与筛选

### 5.1 数据排序

#### 功能列表
- **排序操作**
  - 单列排序
  - 多列排序
  - 自定义排序顺序
  - 按颜色排序

#### MCP 工具定义
```typescript
{
  name: "sort_data",
  description: "排序数据",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      sortBy: { type: "array", items: { type: "object" } },
      order: { type: "string", enum: ["asc", "desc"] }
    }
  }
}
```

### 5.2 数据筛选

#### 功能列表
- **自动筛选**
  - 启用自动筛选
  - 按值筛选
  - 按条件筛选
  - 自定义筛选

- **高级筛选**
  - 多条件筛选
  - 复制筛选结果

#### MCP 工具定义
```typescript
{
  name: "filter_data",
  description: "筛选数据",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      criteria: { type: "object" }
    }
  }
}
```

---

## 六、图表创建与编辑

### 6.1 图表类型

#### 功能列表
- **柱状图**
  - 簇状柱状图
  - 堆积柱状图
  - 百分比堆积柱状图

- **折线图**
  - 折线图
  - 面积图
  - 堆积面积图

- **饼图**
  - 饼图
  - 圆环图

- **其他图表**
  - 散点图
  - 条形图
  - 组合图

#### MCP 工具定义
```typescript
{
  name: "create_chart",
  description: "创建图表",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      chartType: { type: "string", enum: ["column", "line", "pie", "bar", "area", "scatter"] },
      dataRange: { type: "string" },
      title: { type: "string" },
      xAxisTitle: { type: "string" },
      yAxisTitle: { type: "string" },
      position: { type: "string" }
    }
  }
}
```

### 6.2 图表格式化

#### 功能列表
- **图表元素**
  - 图表标题
  - 坐标轴标题
  - 图例
  - 数据标签

- **图表样式**
  - 图表样式
  - 颜色方案
  - 图表布局

---

## 七、数据透视表

### 7.1 数据透视表创建

#### 功能列表
- **创建数据透视表**
  - 从数据范围创建
  - 设置行字段
  - 设置列字段
  - 设置值字段
  - 设置筛选字段

- **数据透视表更新**
  - 刷新数据
  - 更改数据源

#### MCP 工具定义
```typescript
{
  name: "create_pivot_table",
  description: "创建数据透视表",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sourceSheet: { type: "string" },
      sourceRange: { type: "string" },
      targetSheet: { type: "string" },
      targetCell: { type: "string" },
      rows: { type: "array" },
      columns: { type: "array" },
      values: { type: "array" }
    }
  }
}
```

---

## 八、数据验证

### 8.1 验证规则

#### 功能列表
- **验证类型**
  - 整数验证
  - 小数验证
  - 列表验证（下拉列表）
  - 日期验证
  - 时间验证
  - 文本长度验证
  - 自定义公式验证

- **输入消息与错误提示**
  - 设置输入提示
  - 设置错误警告

#### MCP 工具定义
```typescript
{
  name: "set_data_validation",
  description: "设置数据验证",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      validationType: { type: "string" },
      criteria: { type: "object" },
      inputMessage: { type: "string", optional: true },
      errorMessage: { type: "string", optional: true }
    }
  }
}
```

---

## 九、表格样式

### 9.1 表格格式化

#### 功能列表
- **表格创建**
  - 将范围转换为表格
  - 应用表格样式

- **表格样式**
  - 内置表格样式
  - 自定义表格样式
  - 表格选项（标题行、汇总行、第一列、最后一列）

#### MCP 工具定义
```typescript
{
  name: "create_table",
  description: "创建表格",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      tableName: { type: "string" },
      style: { type: "string" },
      hasHeaders: { type: "boolean" }
    }
  }
}
```

---

## 十、行与列操作

### 10.1 行列管理

#### 功能列表
- **行操作**
  - 插入行
  - 删除行
  - 隐藏/显示行
  - 调整行高
  - 复制行
  - 移动行

- **列操作**
  - 插入列
  - 删除列
  - 隐藏/显示列
  - 调整列宽
  - 复制列
  - 移动列

#### MCP 工具定义
```typescript
{
  name: "manage_rows_columns",
  description: "管理行或列",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      operation: { type: "string", enum: ["insert", "delete", "hide", "show", "resize", "copy", "move"] },
      type: { type: "string", enum: ["row", "column"] },
      index: { type: "number" },
      count: { type: "number", optional: true }
    }
  }
}
```

---

## 十一、单元格合并与拆分

### 11.1 合并操作

#### 功能列表
- **合并单元格**
  - 合并单元格
  - 取消合并
  - 跨列合并
  - 跨行合并

#### MCP 工具定义
```typescript
{
  name: "merge_cells",
  description: "合并或取消合并单元格",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string" },
      merge: { type: "boolean" }
    }
  }
}
```

---

## 十二、数据导入与导出

### 12.1 数据导入

#### 功能列表
- **导入格式**
  - 从 CSV 导入
  - 从 JSON 导入
  - 从数据库导入（如果支持）
  - 从文本文件导入

#### MCP 工具定义
```typescript
{
  name: "import_data",
  description: "导入数据",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      sourceFile: { type: "string" },
      sourceFormat: { type: "string", enum: ["csv", "json", "txt"] },
      startCell: { type: "string" }
    }
  }
}
```

### 12.2 数据导出

#### 功能列表
- **导出格式**
  - 导出为 CSV
  - 导出为 JSON
  - 导出为 PDF
  - 导出为 HTML

#### MCP 工具定义
```typescript
{
  name: "export_data",
  description: "导出数据",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      sheetName: { type: "string" },
      range: { type: "string", optional: true },
      outputFile: { type: "string" },
      outputFormat: { type: "string", enum: ["csv", "json", "pdf", "html"] }
    }
  }
}
```

---

## 十三、打印设置

### 13.1 打印配置

#### 功能列表
- **页面设置**
  - 页面方向（横向/纵向）
  - 纸张大小
  - 页边距
  - 缩放比例

- **打印区域**
  - 设置打印区域
  - 清除打印区域
  - 打印标题行/列

- **分页**
  - 插入分页符
  - 删除分页符
  - 预览分页

---

## 十四、数据分析工具

### 14.1 分析功能

#### 功能列表
- **统计分析**
  - 描述性统计
  - 相关性分析
  - 回归分析（如果支持）

- **假设分析**
  - 单变量求解
  - 方案管理器（如果支持）
  - 数据表（如果支持）

---

## 十五、宏与自动化

### 15.1 宏支持

#### 功能列表
- **宏操作**
  - 执行宏（如果支持）
  - 记录操作序列

---

## 十六、协作功能

### 16.1 共享与协作

#### 功能列表
- **批注**
  - 添加批注
  - 查看批注
  - 删除批注

- **共享工作簿**
  - 启用共享
  - 查看更改历史

---

## 十六、企业级数据分析功能

### 16.1 高级数据分析工具

#### 功能列表
- **假设分析**
  - 单变量求解
  - 数据表（单变量/双变量）
  - 方案管理器
  - 目标搜索

- **统计分析**
  - 描述性统计
  - 相关性分析
  - 回归分析
  - 方差分析

- **预测分析**
  - 趋势分析
  - 移动平均
  - 指数平滑
  - 预测工作表

#### MCP 工具定义
```typescript
{
  name: "perform_analysis",
  description: "执行数据分析",
  inputSchema: {
    type: "object",
    properties: {
      filename: { type: "string" },
      analysisType: { type: "string", enum: ["goal_seek", "scenario", "regression", "forecast"] },
      parameters: { type: "object" }
    }
  }
}
```

### 16.2 Power Query 集成（如果支持）

#### 功能列表
- **数据获取**
  - 从数据库获取数据
  - 从网页获取数据
  - 从文件获取数据
  - 从API获取数据

- **数据转换**
  - 数据清洗
  - 数据合并
  - 数据透视
  - 自定义列

### 16.3 数据建模

#### 功能列表
- **关系管理**
  - 创建表关系
  - 管理数据模型
  - DAX公式支持（如果支持）

- **Power Pivot集成**
  - 创建数据模型
  - 添加计算字段
  - 创建KPI

### 16.4 报表自动化

#### 功能列表
- **模板报表**
  - 创建报表模板
  - 基于模板生成报表
  - 定时报表生成

- **数据刷新**
  - 自动刷新数据连接
  - 定时刷新
  - 刷新通知

#### MCP 工具定义
```typescript
{
  name: "generate_report",
  description: "自动生成报表",
  inputSchema: {
    type: "object",
    properties: {
      templateFile: { type: "string" },
      dataSource: { type: "string" },
      outputFile: { type: "string" },
      refreshData: { type: "boolean", default: true }
    }
  }
}
```

### 16.5 批量数据处理

#### 功能列表
- **批量操作**
  - 批量格式统一
  - 批量公式应用
  - 批量数据验证
  - 批量图表生成
  - 批量导出

#### MCP 工具定义
```typescript
{
  name: "batch_process_workbooks",
  description: "批量处理工作簿",
  inputSchema: {
    type: "object",
    properties: {
      files: { type: "array", items: { type: "string" } },
      operation: { type: "string" },
      parameters: { type: "object" }
    }
  }
}
```

### 16.6 数据安全与合规

#### 功能列表
- **数据保护**
  - 工作簿加密
  - 工作表保护
  - 单元格锁定
  - 隐藏公式

- **权限管理**
  - 用户权限设置
  - 编辑权限控制
  - 查看权限控制
  - 审计日志

- **数据脱敏**
  - 敏感数据标记
  - 数据脱敏处理
  - 合规性检查

---

## 功能优先级说明

### 高优先级（核心功能）
1. 工作簿创建、打开、保存
2. 单元格数据读写
3. 基本格式化
4. 公式与函数
5. 图表创建
6. 数据排序与筛选
7. 数据透视表
8. 条件格式

### 中优先级（常用功能）
1. 数据验证
2. 表格样式
3. 数据导入导出
4. 批量处理
5. 报表自动化
6. 数据分析工具
7. 协作功能

### 低优先级（高级功能）
1. 打印设置
2. 宏支持
3. Power Query集成
4. 数据建模
5. 高级统计分析

---

## 使用场景示例

### 场景1：创建销售报表
```
用户: "创建一个名为'sales_report.xlsx'的工作簿，包含'月度销售'工作表，添加表头：产品、1月、2月、3月，然后添加三行数据"
```

### 场景2：计算汇总
```
用户: "在B5单元格计算B2到B4的求和"
```

### 场景3：创建图表
```
用户: "基于A1:D4的数据创建一个柱状图，标题为'季度销售对比'"
```

### 场景4：数据筛选
```
用户: "筛选出销售额大于10000的产品"
```

### 场景5：应用条件格式
```
用户: "将销售额大于15000的单元格标为绿色"
```

### 场景6：数据透视表分析（企业场景）
```
用户: "基于销售数据创建数据透视表，按地区和产品类别汇总销售额，并生成数据透视图"
```

### 场景7：批量数据处理
```
用户: "批量处理'月度报表'文件夹下的所有Excel文件，统一格式，并合并到一个工作簿中"
```

### 场景8：自动化报表生成
```
用户: "基于数据库查询结果，自动生成包含图表和汇总数据的月度销售报表"
```

### 场景9：数据验证与清洗
```
用户: "对客户数据表进行验证，检查邮箱格式、电话号码格式，并标记异常数据"
```

### 场景10：财务模型构建
```
用户: "创建财务预测模型，包含收入预测、成本分析、利润计算，并生成可视化图表"
```

---

## 技术实现建议

1. **使用 `exceljs` 库**：Node.js 中最强大的 Excel 处理库
2. **公式计算**：考虑集成公式计算引擎或调用外部服务
3. **大文件处理**：使用流式处理处理大文件
4. **内存管理**：注意内存使用，特别是处理大量数据时
5. **格式兼容性**：确保生成的 Excel 文件与 Microsoft Excel 完全兼容

---

## 总结

本文档列出了 Excel MCP 服务需要实现的主要功能，涵盖了工作簿管理、数据操作、公式函数、格式化、图表、数据透视表、数据验证、导入导出等各个方面。这些功能基于 Microsoft Excel 在日常工作中的实际使用场景，确保 MCP 服务能够满足用户的实际需求。

