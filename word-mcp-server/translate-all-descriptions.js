#!/usr/bin/env node
/**
 * 完整的工具描述翻译脚本
 * 将所有工具的英文描述翻译为中文
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 完整的翻译映射表
const translations = {
  // Formatting tools
  'Apply or remove bold formatting': '应用或移除粗体格式',
  'Apply or remove italic formatting': '应用或移除斜体格式',
  'Apply or remove underline formatting': '应用或移除下划线格式',
  'Apply or remove text highlighting': '应用或移除文本高亮',
  'Apply or remove strikethrough formatting': '应用或移除删除线格式',
  'Apply or remove subscript formatting': '应用或移除下标格式',
  'Apply or remove superscript formatting': '应用或移除上标格式',

  // Table tools
  'Insert table at cursor position': '在光标位置插入表格',
  'Delete table at cursor position': '删除光标位置的表格',
  'Add row to table': '向表格添加行',
  'Add column to table': '向表格添加列',
  'Delete row from table': '从表格删除行',
  'Delete column from table': '从表格删除列',
  'Merge cells in table': '合并表格中的单元格',
  'Split cell in table': '拆分表格中的单元格',
  'Set table cell value': '设置表格单元格的值',
  'Get table cell value': '获取表格单元格的值',
  'Format table with style': '使用样式格式化表格',
  'Apply table style': '应用表格样式',
  'Set table cell border': '设置表格单元格边框',
  'Set table cell shading': '设置表格单元格底纹',

  // Image tools
  'Insert image at cursor': '在光标位置插入图片',
  'Delete image': '删除图片',
  'Resize image': '调整图片大小',
  'Move image': '移动图片',
  'Rotate image': '旋转图片',
  'Set image position': '设置图片位置',
  'Wrap text around image': '设置图片文字环绕',
  'Replace image': '替换图片',

  // Hyperlink tools
  'Insert hyperlink at cursor': '在光标位置插入超链接',
  'Insert hyperlink': '插入超链接',
  'Insert bookmark at cursor': '在光标位置插入书签',
  'Insert cross-reference': '插入交叉引用',
  'Insert footnote at cursor': '在光标位置插入脚注',
  'Insert endnote at cursor': '在光标位置插入尾注',
  'Insert citation': '插入引文',
  'Insert bibliography at cursor': '在光标位置插入参考文献',

  // Advanced tools
  'Insert table of contents at cursor': '在光标位置插入目录',
  'Update table of contents': '更新目录',

  // Canvas tools
  'Insert drawing canvas': '插入绘图画布',
  'Get all drawing canvases': '获取所有绘图画布',
  'Delete drawing canvas': '删除绘图画布',
  'Insert geometric shape into canvas': '在画布中插入几何形状',
  'Add shape to canvas': '向画布添加形状',
  'Get all shapes in canvas': '获取画布中的所有形状',

  // Read tools
  'Read entire document content': '读取整个文档内容',
  'Detect type of current selection': '检测当前选择的类型',
  'Check if document contains images': '检查文档是否包含图片',
  'Check if document contains tables': '检查文档是否包含表格',
  'Get all images in document': '获取文档中的所有图片',
  'Format text with multiple properties at once': '一次性使用多个属性格式化文本',
  'Set font name for selected text': '设置选中文本的字体名称'
};

// 处理单个文件
function processFile(filePath) {
  console.log(`处理文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let count = 0;

  // 替换所有匹配的描述
  for (const [english, chinese] of Object.entries(translations)) {
    const regex = new RegExp(`description: '${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `description: '${chinese}'`);
      modified = true;
      count += matches.length;
      console.log(`  ✓ 翻译 (${matches.length}处): "${english}" -> "${chinese}"`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ 文件已更新，共翻译 ${count} 处`);
  } else {
    console.log(`  - 无需更新`);
  }

  return modified;
}

// 主函数
function main() {
  const toolsDir = path.join(__dirname, 'src', 'tools');

  // 获取所有 .ts 文件
  const files = fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('.ts') && file !== 'types.ts' && file !== 'index.ts');

  let totalModified = 0;
  let totalFiles = 0;

  console.log(`\n开始处理 ${files.length} 个文件...\n`);

  for (const file of files) {
    const filePath = path.join(toolsDir, file);
    if (fs.existsSync(filePath)) {
      totalFiles++;
      if (processFile(filePath)) {
        totalModified++;
      }
    }
  }

  console.log(`\n完成! 共处理 ${totalFiles} 个文件，修改了 ${totalModified} 个文件`);
}

main();
