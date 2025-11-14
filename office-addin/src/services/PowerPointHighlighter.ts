import { Change, HighlightOptions } from '../types';

export interface PowerPointHighlight {
  id: string;
  slideIndex: number;
  shapeId: string;
  type: 'insert' | 'delete' | 'modify' | 'format';
  color: string;
  originalColor?: string;
  timestamp: number;
}

export class PowerPointHighlighter {
  private highlights = new Map<string, PowerPointHighlight>();
  private colorMap = {
    insert: '#E8F5E9',
    delete: '#FFEBEE',
    modify: '#FFF9C4',
    format: '#E3F2FD'
  };

  async highlightShape(slideIndex: number, shapeId: string, change: Change, options?: HighlightOptions): Promise<void> {
    const highlight: PowerPointHighlight = {
      id: change.id,
      slideIndex,
      shapeId,
      type: change.type,
      color: options?.color || this.colorMap[change.type],
      timestamp: Date.now()
    };

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.getItem(shapeId);

      // 保存原始颜色
      shape.fill.load('color');
      await context.sync();
      highlight.originalColor = shape.fill.color;

      // 设置高亮颜色
      shape.fill.setSolidColor(highlight.color);

      // 添加边框
      shape.line.color = '#FF0000';
      shape.line.weight = 2;

      await context.sync();
    });

    this.highlights.set(change.id, highlight);
  }

  async removeHighlight(changeId: string): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(highlight.slideIndex);
      const shape = slide.shapes.getItem(highlight.shapeId);

      // 恢复原始颜色
      if (highlight.originalColor) {
        shape.fill.setSolidColor(highlight.originalColor);
      } else {
        shape.fill.clear();
      }

      // 清除边框
      shape.line.color = 'transparent';
      shape.line.weight = 0;

      await context.sync();
    });

    this.highlights.delete(changeId);
  }

  async highlightTextRange(slideIndex: number, shapeId: string, startIndex: number, length: number, change: Change): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.getItem(shapeId);

      if (shape.textFrame) {
        const textRange = shape.textFrame.textRange.getSubstring(startIndex, length);
        textRange.font.highlightColor = this.colorMap[change.type];
        await context.sync();
      }
    });

    const highlight: PowerPointHighlight = {
      id: change.id,
      slideIndex,
      shapeId: `${shapeId}_text_${startIndex}_${length}`,
      type: change.type,
      color: this.colorMap[change.type],
      timestamp: Date.now()
    };

    this.highlights.set(change.id, highlight);
  }

  async highlightSlide(slideIndex: number, change: Change): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      slide.shapes.load('items');
      await context.sync();

      // 为幻灯片上的所有形状添加边框
      for (const shape of slide.shapes.items) {
        shape.line.color = this.colorMap[change.type];
        shape.line.weight = 3;
      }

      await context.sync();
    });

    const highlight: PowerPointHighlight = {
      id: change.id,
      slideIndex,
      shapeId: 'slide_border',
      type: change.type,
      color: this.colorMap[change.type],
      timestamp: Date.now()
    };

    this.highlights.set(change.id, highlight);
  }

  async clearAllHighlights(): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      for (const slide of slides.items) {
        slide.shapes.load('items');
        await context.sync();

        for (const shape of slide.shapes.items) {
          // 清除填充高亮
          shape.fill.clear();

          // 清除边框
          shape.line.color = 'transparent';
          shape.line.weight = 0;

          // 清除文本高亮
          if (shape.textFrame) {
            shape.textFrame.textRange.font.highlightColor = 'transparent';
          }
        }
      }

      await context.sync();
    });

    this.highlights.clear();
  }

  async blinkHighlight(changeId: string, duration: number = 2000): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    const blinkColor = '#FFFF00';

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(highlight.slideIndex);
      const shape = slide.shapes.getItem(highlight.shapeId);

      let isOriginalColor = true;
      const blinkInterval = setInterval(async () => {
        if (isOriginalColor) {
          shape.fill.setSolidColor(blinkColor);
        } else {
          shape.fill.setSolidColor(highlight.color);
        }
        isOriginalColor = !isOriginalColor;
        await context.sync();
      }, 300);

      setTimeout(() => {
        clearInterval(blinkInterval);
        shape.fill.setSolidColor(highlight.color);
        context.sync();
      }, duration);
    });
  }

  async addAnimationHighlight(slideIndex: number, shapeId: string, animationType: string = 'emphasis'): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.getItem(shapeId);

      // PowerPoint API 对动画的支持有限，这里使用基本的强调效果
      shape.line.color = '#FF6B35';
      shape.line.weight = 4;

      // 模拟动画效果
      setTimeout(async () => {
        shape.line.color = 'transparent';
        shape.line.weight = 0;
        await context.sync();
      }, 1000);

      await context.sync();
    });
  }

  async highlightByContent(content: string, change: Change): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      for (let i = 0; i < slides.items.length; i++) {
        const slide = slides.items[i];
        slide.shapes.load('items');
        await context.sync();

        for (const shape of slide.shapes.items) {
          if (shape.textFrame) {
            shape.textFrame.load('textRange/text');
            await context.sync();

            if (shape.textFrame.textRange.text.includes(content)) {
              await this.highlightShape(i, shape.id, change);
            }
          }
        }
      }
    });
  }

  async updateHighlightColor(changeId: string, color: string): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    highlight.color = color;

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(highlight.slideIndex);
      const shape = slide.shapes.getItem(highlight.shapeId);
      shape.fill.setSolidColor(color);
      await context.sync();
    });
  }

  async getHighlightedShapes(): Promise<PowerPointHighlight[]> {
    return Array.from(this.highlights.values());
  }

  async navigateToHighlight(changeId: string): Promise<void> {
    const highlight = this.highlights.get(changeId);
    if (!highlight) return;

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(highlight.slideIndex);
      // PowerPoint API 不直接支持导航，但可以选中形状
      const shape = slide.shapes.getItem(highlight.shapeId);
      shape.select();
      await context.sync();
    });
  }

  async groupHighlights(changeIds: string[]): Promise<string> {
    const groupId = `group_${Date.now()}`;
    const highlights = changeIds.map(id => this.highlights.get(id)).filter(Boolean);

    if (highlights.length === 0) return groupId;

    // 为组内所有高亮设置相同的颜色
    const groupColor = '#FFE082';

    for (const highlight of highlights) {
      if (highlight) {
        await this.updateHighlightColor(highlight.id, groupColor);
      }
    }

    return groupId;
  }

  getHighlightStats(): {
    total: number;
    byType: Record<string, number>;
    bySlide: Record<number, number>;
    oldest: number | null;
    newest: number | null;
  } {
    const highlights = Array.from(this.highlights.values());
    const byType: Record<string, number> = {};
    const bySlide: Record<number, number> = {};

    for (const highlight of highlights) {
      byType[highlight.type] = (byType[highlight.type] || 0) + 1;
      bySlide[highlight.slideIndex] = (bySlide[highlight.slideIndex] || 0) + 1;
    }

    const timestamps = highlights.map(h => h.timestamp);

    return {
      total: highlights.length,
      byType,
      bySlide,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  async exportHighlights(): Promise<string> {
    const highlights = Array.from(this.highlights.values());
    return JSON.stringify(highlights, null, 2);
  }

  async importHighlights(data: string): Promise<void> {
    const highlights: PowerPointHighlight[] = JSON.parse(data);

    for (const highlight of highlights) {
      this.highlights.set(highlight.id, highlight);

      // 重新应用高亮
      await PowerPoint.run(async (context) => {
        const slide = context.presentation.slides.getItemAt(highlight.slideIndex);
        const shape = slide.shapes.getItem(highlight.shapeId);
        shape.fill.setSolidColor(highlight.color);
        await context.sync();
      });
    }
  }
}

export default PowerPointHighlighter;