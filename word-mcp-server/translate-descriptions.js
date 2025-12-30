#!/usr/bin/env node
/**
 * 批量翻译工具描述脚本
 * 将所有工具的英文描述翻译为中文
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 翻译映射表
const translations = {
  // Formatting tools
  'Set font family for selected text or range': '设置选中文本或范围的字体',
  'Set font size for selected text or range': '设置选中文本或范围的字号',
  'Set font color for selected text or range': '设置选中文本或范围的字体颜色',
  'Set bold formatting for selected text or range': '设置选中文本或范围为粗体',
  'Set italic formatting for selected text or range': '设置选中文本或范围为斜体',
  'Set underline formatting for selected text or range': '设置选中文本或范围的下划线',
  'Set highlight color for selected text or range': '设置选中文本或范围的高亮颜色',
  'Set strikethrough formatting for selected text or range': '设置选中文本或范围的删除线',
  'Set subscript formatting for selected text or range': '设置选中文本或范围为下标',
  'Set superscript formatting for selected text or range': '设置选中文本或范围为上标',

  // Style tools
  'Apply a style to selected text or paragraph': '将样式应用于选中文本或段落',
  'Create a new custom style': '创建新的自定义样式',
  'List all available styles in document': '列出文档中所有可用样式',
  'Set heading level for paragraph': '设置段落的标题级别',
  'Apply list style (bullet or numbered)': '应用列表样式（项目符号或编号）',
  'Set line spacing for paragraph': '设置段落的行间距',
  'Set background color for selected text or range': '设置选中文本或范围的背景颜色',
  'Apply a theme to the document': '将主题应用于文档',
  'Reset formatting to default style': '将格式重置为默认样式',
  'Copy formatting from one location to another': '从一个位置复制格式到另一个位置',

  // Table tools
  'Insert a table into the document': '在文档中插入表格',
  'Delete a table from the document': '从文档中删除表格',
  'Add a row to table': '向表格添加行',
  'Add a column to table': '向表格添加列',
  'Delete a row from table': '从表格删除行',
  'Delete a column from table': '从表格删除列',
  'Merge selected cells in table': '合并表格中的选中单元格',
  'Split a cell in table': '拆分表格中的单元格',
  'Set value of a table cell': '设置表格单元格的值',
  'Get value of a table cell': '获取表格单元格的值',
  'Format table with borders and shading': '使用边框和底纹格式化表格',
  'Apply a style to table': '将样式应用于表格',
  'Set border style for table cell': '设置表格单元格的边框样式',
  'Set shading color for table cell': '设置表格单元格的底纹颜色',
  'Convert table to text': '将表格转换为文本',

  // Image tools
  'Insert an image into the document': '在文档中插入图片',
  'Delete an image from the document': '从文档中删除图片',
  'Resize an image': '调整图片大小',
  'Move an image to a different position': '将图片移动到不同位置',
  'Rotate an image': '旋转图片',
  'Set image position (inline or floating)': '设置图片位置（嵌入式或浮动）',
  'Set text wrapping style for image': '设置图片的文字环绕样式',
  'Add caption to image': '为图片添加标题',
  'Compress images in document': '压缩文档中的图片',
  'Replace an existing image': '替换现有图片',

  // Hyperlink tools
  'Insert a hyperlink': '插入超链接',
  'Remove hyperlink from text': '从文本中删除超链接',
  'Insert a bookmark': '插入书签',
  'Insert a cross-reference': '插入交叉引用',
  'Insert a footnote': '插入脚注',
  'Insert an endnote': '插入尾注',
  'Insert a citation': '插入引文',
  'Insert bibliography': '插入参考文献',

  // Advanced tools
  'Insert table of contents': '插入目录',
  'Update table of contents': '更新目录',
  'Insert page break': '插入分页符',
  'Insert section break': '插入分节符',

  // Header/Footer tools
  'Insert header content': '插入页眉内容',
  'Insert footer content': '插入页脚内容',
  'Get header content': '获取页眉内容',
  'Get footer content': '获取页脚内容',
  'Clear header content': '清除页眉内容',
  'Clear footer content': '清除页脚内容',

  // Page Setup tools
  'Set page margins': '设置页边距',
  'Get page margins': '获取页边距',
  'Set page orientation': '设置页面方向',
  'Get page orientation': '获取页面方向',
  'Set page size': '设置页面大小',
  'Get page size': '获取页面大小',

  // Content Control tools
  'Insert a content control': '插入内容控件',
  'Get all content controls': '获取所有内容控件',
  'Set value of a content control': '设置内容控件的值',
  'Get value of a content control': '获取内容控件的值',
  'Delete a content control': '删除内容控件',
  'Clear content control value': '清除内容控件的值',

  // Save tools
  'Save the current document': '保存当前文档',
  'Save document with a new name': '用新名称保存文档',
  'Get document save status': '获取文档保存状态',
  'Close the current document': '关闭当前文档',

  // Bookmark tools
  'Create a bookmark': '创建书签',
  'Delete a bookmark': '删除书签',
  'Get all bookmarks': '获取所有书签',
  'Navigate to a bookmark': '导航到书签',
  'Update bookmark content': '更新书签内容',
  'Check if bookmark exists': '检查书签是否存在',

  // Comment tools
  'Add a comment': '添加批注',
  'Get all comments': '获取所有批注',
  'Reply to a comment': '回复批注',
  'Resolve a comment': '解决批注',
  'Delete a comment': '删除批注',
  'Get comment details': '获取批注详情',

  // Track Changes tools
  'Enable track changes': '启用修订',
  'Disable track changes': '禁用修订',
  'Get track changes status': '获取修订状态',
  'Get all tracked changes': '获取所有修订',
  'Accept a tracked change': '接受修订',
  'Reject a tracked change': '拒绝修订',
  'Accept all tracked changes': '接受所有修订',
  'Reject all tracked changes': '拒绝所有修订',

  // Field tools
  'Insert a field': '插入域',
  'Get all fields': '获取所有域',
  'Update a field': '更新域',
  'Update all fields': '更新所有域',
  'Delete a field': '删除域',
  'Lock a field': '锁定域',
  'Unlock a field': '解锁域',
  'Get field result': '获取域结果',

  // Shape tools
  'Insert a shape': '插入形状',
  'Delete a shape': '删除形状',
  'Get shape properties': '获取形状属性',
  'Set shape properties': '设置形状属性',
  'Move a shape': '移动形状',
  'Resize a shape': '调整形状大小',
  'Set shape fill color': '设置形状填充颜色',
  'Set shape line style': '设置形状线条样式',

  // Coauthoring tools
  'Get coauthoring status': '获取协作状态',
  'Get list of coauthors': '获取协作者列表',
  'Get coauthoring locks': '获取协作锁定',
  'Request coauthoring lock': '请求协作锁定',
  'Release coauthoring lock': '释放协作锁定',
  'Sync coauthoring changes': '同步协作更改',

  // Annotation tools
  'Add ink annotation': '添加墨迹批注',
  'Get all ink annotations': '获取所有墨迹批注',
  'Get ink annotation details': '获取墨迹批注详情',
  'Delete ink annotation': '删除墨迹批注',
  'Delete all ink annotations': '删除所有墨迹批注',
  'Update ink annotation': '更新墨迹批注',

  // Document tools
  'Open a document': '打开文档',
  'Print the document': '打印文档',
  'Show print preview': '显示打印预览',
  'Close print preview': '关闭打印预览',
  'Get document properties': '获取文档属性',
  'Set document properties': '设置文档属性',
  'Get document statistics': '获取文档统计信息',
  'Get document path': '获取文档路径',

  // Conflict tools
  'Get all conflicts': '获取所有冲突',
  'Get conflict details': '获取冲突详情',
  'Accept local version': '接受本地版本',
  'Accept server version': '接受服务器版本',
  'Merge conflict manually': '手动合并冲突',
  'Accept all local versions': '接受所有本地版本',
  'Accept all server versions': '接受所有服务器版本',

  // Canvas tools
  'Insert a canvas': '插入画布',
  'Get all canvases': '获取所有画布',
  'Delete a canvas': '删除画布',
  'Insert geometric shape': '插入几何形状',
  'Add shape to canvas': '向画布添加形状',
  'Get shapes in canvas': '获取画布中的形状',

  // Read tools
  'Read document content': '读取文档内容',
  'Detect selection type': '检测选择类型',
  'Check if document has images': '检查文档是否包含图片',
  'Check if document has tables': '检查文档是否包含表格',
  'Get all images in document': '获取文档中的所有图片',
  'Format text with multiple properties': '使用多个属性格式化文本',
  'Set font name for text': '设置文本的字体名称',

  // Chart tools
  'Insert a chart': '插入图表',
  'Get all charts': '获取所有图表',

  // Education tools
  'Perform mail merge': '执行邮件合并',
  'Insert exam header': '插入考试页眉',
  'Insert question section': '插入题目部分',
  'Insert lesson plan': '插入教案',
  'Insert official document header': '插入公文页眉'
};

// 处理单个文件
function processFile(filePath) {
  console.log(`处理文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 替换所有匹配的描述
  for (const [english, chinese] of Object.entries(translations)) {
    const regex = new RegExp(`description: '${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `description: '${chinese}'`);
      modified = true;
      console.log(`  ✓ 翻译: "${english}" -> "${chinese}"`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ 文件已更新`);
  } else {
    console.log(`  - 无需更新`);
  }

  return modified;
}

// 主函数
function main() {
  const toolsDir = path.join(__dirname, 'src', 'tools');
  const files = [
    'formatting.ts',
    'styles.ts',
    'table.ts',
    'image.ts',
    'hyperlink.ts',
    'advanced.ts',
    'headerFooter.ts',
    'pageSetup.ts',
    'contentControl.ts',
    'save.ts',
    'bookmark.ts',
    'comment.ts',
    'trackChanges.ts',
    'field.ts',
    'shape.ts',
    'coauthoring.ts',
    'annotation.ts',
    'document.ts',
    'conflict.ts',
    'canvas.ts',
    'read.ts',
    'chart.ts',
    'education.ts'
  ];

  let totalModified = 0;

  for (const file of files) {
    const filePath = path.join(toolsDir, file);
    if (fs.existsSync(filePath)) {
      if (processFile(filePath)) {
        totalModified++;
      }
    } else {
      console.log(`警告: 文件不存在 ${filePath}`);
    }
  }

  console.log(`\n完成! 共修改了 ${totalModified} 个文件`);
}

main();
