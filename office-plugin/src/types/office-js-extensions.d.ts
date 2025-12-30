/**
 * Office.js 类型扩展
 * 补充 @types/office-js 中缺失或过时的类型定义
 */

declare namespace PowerPoint {
  /**
   * 填充类型枚举
   */
  enum FillType {
    /** 无填充 */
    noFill = 'NoFill',
    /** 纯色填充 */
    solid = 'Solid',
    /** 渐变填充 */
    gradient = 'Gradient',
    /** 图案填充 */
    pattern = 'Pattern',
    /** 图片或纹理填充 */
    pictureAndTexture = 'PictureAndTexture',
    /** 幻灯片背景填充 */
    slideBackground = 'SlideBackground'
  }

  /**
   * 图表类型枚举
   */
  enum ChartType {
    /** 柱形图 */
    columnClustered = 'ColumnClustered',
    /** 堆积柱形图 */
    columnStacked = 'ColumnStacked',
    /** 百分比堆积柱形图 */
    columnStacked100 = 'ColumnStacked100',
    /** 条形图 */
    barClustered = 'BarClustered',
    /** 堆积条形图 */
    barStacked = 'BarStacked',
    /** 百分比堆积条形图 */
    barStacked100 = 'BarStacked100',
    /** 折线图 */
    line = 'Line',
    /** 带数据标记的折线图 */
    lineMarkers = 'LineMarkers',
    /** 堆积折线图 */
    lineStacked = 'LineStacked',
    /** 百分比堆积折线图 */
    lineStacked100 = 'LineStacked100',
    /** 饼图 */
    pie = 'Pie',
    /** 圆环图 */
    doughnut = 'Doughnut',
    /** 散点图 */
    xyscatter = 'XYScatter',
    /** 面积图 */
    area = 'Area',
    /** 堆积面积图 */
    areaStacked = 'AreaStacked',
    /** 百分比堆积面积图 */
    areaStacked100 = 'AreaStacked100'
  }

  /**
   * 幻灯片接口扩展
   */
  interface Slide {
    /**
     * 幻灯片背景
     */
    background?: {
      /**
       * 填充类型
       */
      fill: {
        type: FillType
        foregroundColor?: string
        backgroundColor?: string
      }
    }
  }

  /**
   * 文本范围格式接口扩展
   */
  interface TextRangeFormat {
    /**
     * 字体名称
     */
    fontName?: string

    /**
     * 字体大小（磅）
     */
    fontSize?: number

    /**
     * 字体颜色（十六进制格式，如 "#FF0000"）
     */
    fontColor?: string
  }
}
