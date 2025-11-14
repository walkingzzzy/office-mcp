import { IDocumentAdapter, ApiResponse, Change } from '../types';
import { HttpClient } from './HttpClient';

export class PowerPointAdapter implements IDocumentAdapter {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  async getContent(): Promise<string> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      const slideData = [];
      for (const slide of slides.items) {
        slide.shapes.load('items');
        await context.sync();

        const shapes = [];
        for (const shape of slide.shapes.items) {
          if (shape.type === PowerPoint.ShapeType.geometricShape) {
            shape.textFrame.load('textRange/text');
            await context.sync();
            shapes.push({
              id: shape.id,
              type: shape.type,
              text: shape.textFrame.textRange.text
            });
          }
        }
        slideData.push({ id: slide.id, shapes });
      }

      return JSON.stringify(slideData);
    });
  }

  async setContent(content: string): Promise<void> {
    const slideData = JSON.parse(content);
    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      // 清除现有幻灯片
      for (const slide of slides.items) {
        slide.delete();
      }
      await context.sync();

      // 添加新幻灯片
      for (const slideInfo of slideData) {
        const slide = slides.add();
        for (const shapeInfo of slideInfo.shapes) {
          const shape = slide.shapes.addTextBox(shapeInfo.text);
          await context.sync();
        }
      }
    });
  }

  async getSelection(): Promise<string> {
    return PowerPoint.run(async (context) => {
      const selection = context.presentation.getSelectedShapes();
      selection.load('items');
      await context.sync();

      const selectedShapes = [];
      for (const shape of selection.items) {
        if (shape.textFrame) {
          shape.textFrame.load('textRange/text');
          await context.sync();
          selectedShapes.push({
            id: shape.id,
            text: shape.textFrame.textRange.text
          });
        }
      }

      return JSON.stringify(selectedShapes);
    });
  }

  async insertContent(content: string): Promise<void> {
    const data = JSON.parse(content);
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(0);
      const shape = slide.shapes.addTextBox(data.text || content);
      await context.sync();
    });
  }

  async readDocument(): Promise<ApiResponse<{ fileId: string }>> {
    try {
      const presentation = await Office.context.document.getFileAsync(Office.FileType.Compressed);
      const blob = new Blob([presentation.value], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      const formData = new FormData();
      formData.append('file', blob, 'presentation.pptx');

      return await this.httpClient.post<{ fileId: string }>('/files/upload', formData);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: '读取PowerPoint文档失败'
      };
    }
  }

  async updateDocument(content: ArrayBuffer | Blob): Promise<void> {
    const blob = content instanceof ArrayBuffer ? new Blob([content]) : content;
    const arrayBuffer = await blob.arrayBuffer();

    await Office.context.document.setFileAsync(arrayBuffer, {
      fileType: Office.FileType.Compressed
    });
  }

  async highlightRange(change: Change): Promise<void> {
    if (!change.controlId) return;

    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      for (const slide of slides.items) {
        slide.shapes.load('items');
        await context.sync();

        const shape = slide.shapes.getItem(change.controlId);
        if (shape) {
          const color = this.getHighlightColor(change.type);
          shape.fill.setSolidColor(color);
          await context.sync();
          break;
        }
      }
    });
  }

  async removeHighlight(changeId: string): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      for (const slide of slides.items) {
        slide.shapes.load('items');
        await context.sync();

        for (const shape of slide.shapes.items) {
          if (shape.id === changeId) {
            shape.fill.clear();
            await context.sync();
            return;
          }
        }
      }
    });
  }

  async applyChange(change: Change): Promise<void> {
    if (!change.controlId) return;

    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      for (const slide of slides.items) {
        slide.shapes.load('items');
        await context.sync();

        const shape = slide.shapes.getItem(change.controlId);
        if (shape && shape.textFrame) {
          switch (change.type) {
            case 'insert':
            case 'modify':
              shape.textFrame.textRange.text = change.content;
              break;
            case 'delete':
              shape.delete();
              break;
          }

          // 清除高亮
          if (change.type !== 'delete') {
            shape.fill.clear();
          }

          await context.sync();
          break;
        }
      }
    });
  }

  async getSlideCount(): Promise<number> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      return slides.items.length;
    });
  }

  async getCurrentSlideIndex(): Promise<number> {
    return PowerPoint.run(async (context) => {
      const slide = context.presentation.getSelectedSlides().getItemAt(0);
      slide.load('id');
      await context.sync();

      const slides = context.presentation.slides;
      slides.load('items/id');
      await context.sync();

      return slides.items.findIndex(s => s.id === slide.id);
    });
  }

  async goToSlide(index: number): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(index);
      slide.load();
      await context.sync();
      // PowerPoint API 不直接支持导航，需要通过其他方式实现
    });
  }

  async addSlide(layoutType: string = 'blank'): Promise<string> {
    return PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.add();
      slide.load('id');
      await context.sync();

      return slide.id;
    });
  }

  async deleteSlide(index: number): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(index);
      slide.delete();
      await context.sync();
    });
  }

  async addTextBox(slideIndex: number, text: string, left: number = 100, top: number = 100): Promise<string> {
    return PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.addTextBox(text, {
        left: left,
        top: top,
        width: 200,
        height: 50
      });
      shape.load('id');
      await context.sync();

      return shape.id;
    });
  }

  async getShapeText(slideIndex: number, shapeId: string): Promise<string> {
    return PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.getItem(shapeId);
      shape.textFrame.load('textRange/text');
      await context.sync();

      return shape.textFrame.textRange.text;
    });
  }

  async setShapeText(slideIndex: number, shapeId: string, text: string): Promise<void> {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.getItemAt(slideIndex);
      const shape = slide.shapes.getItem(shapeId);
      shape.textFrame.textRange.text = text;
      await context.sync();
    });
  }

  private getHighlightColor(type: string): string {
    switch (type) {
      case 'insert': return '#E8F5E9';
      case 'delete': return '#FFEBEE';
      case 'modify': return '#FFF9C4';
      default: return '#E3F2FD';
    }
  }
}

export default PowerPointAdapter;