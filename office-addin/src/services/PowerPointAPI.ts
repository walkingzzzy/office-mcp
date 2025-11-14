import { IDocumentAdapter } from '../types';

/**
 * PowerPoint API封装
 */
export class PowerPointAPI implements IDocumentAdapter {
  /**
   * 获取文档内容(所有幻灯片的文本)
   */
  async getContent(): Promise<string> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      const slideContents: string[] = [];
      for (let i = 0; i < slides.items.length; i++) {
        const slide = slides.items[i];
        const shapes = slide.shapes;
        shapes.load('items');
        await context.sync();

        const textItems: string[] = [];
        shapes.items.forEach((shape) => {
          if (shape.textFrame) {
            textItems.push(shape.textFrame.textRange.text);
          }
        });

        slideContents.push(`Slide ${i + 1}: ${textItems.join(' ')}`);
      }

      return slideContents.join('\n');
    });
  }

  /**
   * 设置文档内容(不推荐,PPT应该操作特定幻灯片)
   */
  async setContent(content: string): Promise<void> {
    throw new Error('PowerPoint不支持setContent,请使用addSlide或updateShape');
  }

  /**
   * 获取选中的内容(当前选中的形状)
   */
  async getSelection(): Promise<string> {
    return PowerPoint.run(async (context) => {
      const selection = context.presentation.getSelectedShapes();
      selection.load('items');
      await context.sync();

      const textItems: string[] = [];
      selection.items.forEach((shape) => {
        if (shape.textFrame) {
          textItems.push(shape.textFrame.textRange.text);
        }
      });

      return textItems.join(' ');
    });
  }

  /**
   * 插入内容(在当前幻灯片添加文本框)
   */
  async insertContent(content: string): Promise<void> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      const slide = slides.getItemAt(0); // 获取第一张幻灯片
      const textBox = slide.shapes.addTextBox(content);
      textBox.left = 100;
      textBox.top = 100;
      textBox.height = 200;
      textBox.width = 400;

      await context.sync();
    });
  }

  /**
   * 添加新幻灯片
   */
  async addSlide(layoutType: PowerPoint.SlideLayoutType = PowerPoint.SlideLayoutType.blank): Promise<void> {
    return PowerPoint.run(async (context) => {
      context.presentation.slides.add(layoutType);
      await context.sync();
    });
  }

  /**
   * 在幻灯片添加标题
   */
  async addTitle(slideIndex: number, title: string): Promise<void> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      const slide = slides.getItemAt(slideIndex);
      const textBox = slide.shapes.addTextBox(title);

      // 设置标题样式
      textBox.left = 50;
      textBox.top = 50;
      textBox.height = 80;
      textBox.width = 600;
      textBox.textFrame.textRange.font.size = 32;
      textBox.textFrame.textRange.font.bold = true;

      await context.sync();
    });
  }

  /**
   * 添加文本框
   */
  async addTextBox(
    slideIndex: number,
    text: string,
    options?: {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
    }
  ): Promise<void> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      const slide = slides.getItemAt(slideIndex);
      const textBox = slide.shapes.addTextBox(text);

      textBox.left = options?.left ?? 100;
      textBox.top = options?.top ?? 100;
      textBox.height = options?.height ?? 100;
      textBox.width = options?.width ?? 400;

      await context.sync();
    });
  }

  /**
   * 创建形状高亮(添加半透明覆盖形状)
   */
  async createHighlight(
    slideIndex: number,
    shapeId: string,
    color: string
  ): Promise<void> {
    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      const slide = slides.getItemAt(slideIndex);
      const targetShape = slide.shapes.getItem(shapeId);
      targetShape.load('left, top, height, width');
      await context.sync();

      // 创建半透明矩形覆盖
      const highlight = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle);
      highlight.left = targetShape.left;
      highlight.top = targetShape.top;
      highlight.height = targetShape.height;
      highlight.width = targetShape.width;
      highlight.fill.setSolidColor(color);
      highlight.fill.transparency = 0.5;

      await context.sync();
    });
  }

  /**
   * 获取演示文稿文件
   */
  async getDocumentFile(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      Office.context.document.getFileAsync(
        Office.FileType.Compressed,
        { sliceSize: 4194304 },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const file = result.value;
            const sliceCount = file.sliceCount;
            const slices: any[] = [];

            const getSlice = (sliceIndex: number) => {
              file.getSliceAsync(sliceIndex, (sliceResult) => {
                if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
                  slices[sliceIndex] = sliceResult.value.data;

                  if (sliceIndex < sliceCount - 1) {
                    getSlice(sliceIndex + 1);
                  } else {
                    file.closeAsync();
                    const blob = new Blob(slices, {
                      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    });
                    resolve(blob);
                  }
                } else {
                  file.closeAsync();
                  reject(new Error(sliceResult.error.message));
                }
              });
            };

            getSlice(0);
          } else {
            reject(new Error(result.error.message));
          }
        }
      );
    });
  }
}

export default new PowerPointAPI();
