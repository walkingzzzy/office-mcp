/**
 * Excel Tools Index - Phase 5 Complete Implementation
 * Export all 97 Excel tools
 */

import type { ToolDefinition } from './types.js'
import { enhanceToolsForDomain } from './utils/teachingContext.js'
// Import all Excel tool modules
import {
  excelAutofitColumnsTool,
  excelClearRangeTool,
  excelCopyRangeTool,
  excelCutRangeTool,
  excelDeleteCellsTool,
  excelFilterRangeTool,
  excelFindCellTool,
  excelFreezePanesTool,
  excelGetCellValueTool,
  excelGetRangeValuesTool,
  excelInsertCellsTool,
  excelMergeCellsTool,
  excelPasteRangeTool,
  excelReplaceCellTool,
  excelSetCellValueTool,
  excelSetColumnWidthTool,
  excelSetRangeValuesTool,
  excelSetRowHeightTool,
  excelSortRangeTool,
  excelUnmergeCellsTool
} from './cell.js'
import {
  excelAddChartSeriesTool,
  excelDeleteChartTool,
  excelExportChartTool,
  excelFormatChartTool,
  excelInsertChartTool,
  excelMoveChartTool,
  excelSetAxisTitleTool,
  excelSetChartTitleTool,
  excelSetChartTypeTool,
  excelUpdateChartTool
} from './chart.js'
import {
  excelConnectDatabaseTool,
  excelCorrelationTool,
  excelExportCsvTool,
  excelExportJsonTool,
  excelExportXmlTool,
  excelForecastTool,
  excelGroupDataTool,
  excelHistogramTool,
  excelImportCsvTool,
  excelImportJsonTool,
  excelImportXmlTool,
  excelPivotDataTool,
  excelRefreshDataTool,
  excelRegressionTool,
  excelTTestTool
} from './data.js'
import {
  excelClearFormatTool,
  excelConditionalFormatTool,
  excelCopyFormatTool,
  excelHideColumnsTool,
  excelProtectSheetTool,
  excelSetAlignmentTool,
  excelSetBorderTool,
  excelSetCellFormatTool,
  excelSetDateFormatTool,
  excelSetFillColorTool,
  excelSetFontTool,
  excelSetNumberFormatTool,
  excelSetWrapTextTool,
  excelUnhideColumnsTool,
  excelUnprotectSheetTool
} from './format.js'
import {
  excelArrayFormulaTool,
  excelCalculateTool,
  excelDataValidationTool,
  excelDefineNameTool,
  excelGetFormulaTool,
  excelInsertAverageTool,
  excelInsertCountTool,
  excelInsertIfTool,
  excelInsertPivotTableTool,
  excelInsertSumTool,
  excelInsertVlookupTool,
  excelRefreshPivotTool,
  excelRemoveDuplicatesTool,
  excelSetFormulaTool,
  excelUseNamedRangeTool
} from './formula.js'
import {
  excelActivateWorksheetTool,
  excelAddWorksheetTool,
  excelCopyWorksheetTool,
  excelCreateWorksheetTool,
  excelDeleteWorksheetTool,
  excelGetSheetNamesTool,
  excelHideWorksheetTool,
  excelMoveWorksheetTool,
  excelProtectWorkbookTool,
  excelProtectWorksheetTool,
  excelRenameWorksheetTool,
  excelShowWorksheetTool,
  excelUnhideWorksheetTool,
  excelUnprotectWorksheetTool
} from './worksheet.js'
// Import Education tools (P0/P1/P2)
import {
  excelClassStatsTool,
  excelGenerateRankingTool,
  excelAttendanceStatsTool
} from './education.js'
// Import Image tools (6) - P0
import {
  excelInsertImageTool,
  excelDeleteImageTool,
  excelResizeImageTool,
  excelMoveImageTool,
  excelGetImagesTool,
  excelSetImagePropertiesTool
} from './image.js'
// Import Table Enhanced tools (14) - P1
import {
  excelCreateTableEnhancedTool,
  excelGetTableInfoTool,
  excelAddTableColumnTool,
  excelDeleteTableColumnTool,
  excelAddTableRowTool,
  excelDeleteTableRowTool,
  excelSetTableStyleTool,
  excelConvertTableToRangeTool,
  excelGetTableDataTool,
  excelClearTableFilterTool,
  excelShowTableTotalsTool,
  excelSetTableTotalFunctionTool,
  excelGetTableTotalsStatusTool
} from './tableEnhanced.js'
// Import Slicer tools (8) - P2
import {
  excelAddSlicerTool,
  excelGetSlicersTool,
  excelGetSlicerDetailTool,
  excelUpdateSlicerTool,
  excelSetSlicerSelectionTool,
  excelClearSlicerSelectionTool,
  excelDeleteSlicerTool,
  excelGetSlicerItemsTool
} from './slicer.js'
// Import Shape tools (9) - P2
import {
  excelAddShapeTool,
  excelGetShapesTool,
  excelGetShapeDetailTool,
  excelUpdateShapeTool,
  excelSetShapeFillTool,
  excelSetShapeLineTool,
  excelAddShapeTextTool,
  excelDeleteShapeTool
} from './shape.js'
// Import Comment tools (8) - P1
import {
  excelAddCommentTool,
  excelGetCommentsTool,
  excelReplyCommentTool,
  excelResolveCommentTool,
  excelDeleteCommentTool,
  excelGetCommentDetailTool,
  excelEditCommentTool,
  excelGetCellCommentTool
} from './comment.js'
// Import Conditional Format tools (9) - P1
import {
  excelAddColorScaleFormatTool,
  excelAddDataBarFormatTool,
  excelAddIconSetFormatTool,
  excelAddCellValueFormatTool,
  excelAddTextContainsFormatTool,
  excelAddTopBottomFormatTool,
  excelGetConditionalFormatsTool,
  excelDeleteConditionalFormatTool,
  excelClearConditionalFormatsTool
} from './conditionalFormat.js'
// Import PivotTable Enhanced tools (12) - P1
import {
  excelCreatePivotTableTool,
  excelAddPivotRowFieldTool,
  excelAddPivotColumnFieldTool,
  excelAddPivotDataFieldTool,
  excelAddPivotFilterFieldTool,
  excelRefreshPivotTableTool,
  excelDeletePivotTableTool,
  excelGetPivotTableInfoTool,
  excelSetPivotTableStyleTool,
  excelRemovePivotFieldTool,
  excelGetAllPivotTablesTool,
  excelSetPivotTableLayoutTool
} from './pivotTableEnhanced.js'
// Import Data Validation tools (8) - P2
import {
  excelAddDataValidationTool,
  excelGetDataValidationTool,
  excelRemoveDataValidationTool,
  excelClearInvalidDataTool,
  excelSetInputMessageTool,
  excelSetErrorAlertTool,
  excelGetInvalidCellsTool,
  excelBatchSetValidationTool
} from './dataValidation.js'
// Import PivotHierarchy tools (8) - P2
import {
  excelGetPivotHierarchiesTool,
  excelGetPivotHierarchyItemsTool,
  excelAddPivotHierarchyTool,
  excelRemovePivotHierarchyTool,
  excelExpandPivotHierarchyTool,
  excelCollapsePivotHierarchyTool,
  excelMovePivotHierarchyTool,
  excelSetPivotHierarchySortTool
} from './pivotHierarchy.js'

/**
 * Get all Excel tools (162 tools total = 97 + 6 image + 3 education + 11 table_enhanced + 8 comment + 9 conditional_format + 12 pivot_table + 8 data_validation + 8 pivot_hierarchy)
 */
export function getExcelTools(): ToolDefinition[] {
  return enhanceToolsForDomain([
    // Cell Operations (20 tools)
    excelSetCellValueTool,
    excelGetCellValueTool,
    excelSetRangeValuesTool,
    excelGetRangeValuesTool,
    excelClearRangeTool,
    excelInsertCellsTool,
    excelDeleteCellsTool,
    excelMergeCellsTool,
    excelUnmergeCellsTool,
    excelCopyRangeTool,
    excelCutRangeTool,
    excelPasteRangeTool,
    excelFindCellTool,
    excelReplaceCellTool,
    excelSortRangeTool,
    excelFilterRangeTool,
    excelAutofitColumnsTool,
    excelSetColumnWidthTool,
    excelSetRowHeightTool,
    excelFreezePanesTool,

    // Format Tools (15 tools)
    excelSetCellFormatTool,
    excelSetFontTool,
    excelSetFillColorTool,
    excelSetBorderTool,
    excelSetNumberFormatTool,
    excelSetDateFormatTool,
    excelConditionalFormatTool,
    excelClearFormatTool,
    excelCopyFormatTool,
    excelSetAlignmentTool,
    excelSetWrapTextTool,
    excelProtectSheetTool,
    excelUnprotectSheetTool,
    excelHideColumnsTool,
    excelUnhideColumnsTool,

    // Formula Tools (15 tools)
    excelSetFormulaTool,
    excelGetFormulaTool,
    excelCalculateTool,
    excelInsertSumTool,
    excelInsertAverageTool,
    excelInsertCountTool,
    excelInsertIfTool,
    excelInsertVlookupTool,
    excelInsertPivotTableTool,
    excelRefreshPivotTool,
    excelDefineNameTool,
    excelUseNamedRangeTool,
    excelArrayFormulaTool,
    excelDataValidationTool,
    excelRemoveDuplicatesTool,

    // Chart Tools (10 tools)
    excelInsertChartTool,
    excelUpdateChartTool,
    excelDeleteChartTool,
    excelSetChartTypeTool,
    excelSetChartTitleTool,
    excelSetAxisTitleTool,
    excelAddChartSeriesTool,
    excelFormatChartTool,
    excelMoveChartTool,
    excelExportChartTool,

    // Worksheet Tools (14 tools)
    excelAddWorksheetTool,
    excelCreateWorksheetTool,
    excelDeleteWorksheetTool,
    excelRenameWorksheetTool,
    excelCopyWorksheetTool,
    excelMoveWorksheetTool,
    excelHideWorksheetTool,
    excelUnhideWorksheetTool,
    excelShowWorksheetTool,
    excelProtectWorkbookTool,
    excelProtectWorksheetTool,
    excelUnprotectWorksheetTool,
    excelGetSheetNamesTool,
    excelActivateWorksheetTool,

    // Data Analysis Tools (15 tools)
    excelImportCsvTool,
    excelExportCsvTool,
    excelImportJsonTool,
    excelExportJsonTool,
    excelImportXmlTool,
    excelExportXmlTool,
    excelConnectDatabaseTool,
    excelRefreshDataTool,
    excelGroupDataTool,
    excelCorrelationTool,
    excelRegressionTool,
    excelHistogramTool,
    excelForecastTool,
    excelPivotDataTool,
    excelTTestTool,

    // Image Tools (6 tools) - P0
    excelInsertImageTool,
    excelDeleteImageTool,
    excelResizeImageTool,
    excelMoveImageTool,
    excelGetImagesTool,
    excelSetImagePropertiesTool,

    // Education Tools (3 tools) - P0/P1/P2
    excelClassStatsTool,
    excelGenerateRankingTool,
    excelAttendanceStatsTool,

    // Table Enhanced Tools (11 tools) - P1
    excelCreateTableEnhancedTool,
    excelGetTableInfoTool,
    excelAddTableColumnTool,
    excelDeleteTableColumnTool,
    excelAddTableRowTool,
    excelDeleteTableRowTool,
    excelSetTableStyleTool,
    excelConvertTableToRangeTool,
    excelGetTableDataTool,
    excelClearTableFilterTool,

    // Comment Tools (8 tools) - P1
    excelAddCommentTool,
    excelGetCommentsTool,
    excelReplyCommentTool,
    excelResolveCommentTool,
    excelDeleteCommentTool,
    excelGetCommentDetailTool,
    excelEditCommentTool,
    excelGetCellCommentTool,

    // Conditional Format Tools (9 tools) - P1
    excelAddColorScaleFormatTool,
    excelAddDataBarFormatTool,
    excelAddIconSetFormatTool,
    excelAddCellValueFormatTool,
    excelAddTextContainsFormatTool,
    excelAddTopBottomFormatTool,
    excelGetConditionalFormatsTool,
    excelDeleteConditionalFormatTool,
    excelClearConditionalFormatsTool,

    // PivotTable Enhanced Tools (12 tools) - P1
    excelCreatePivotTableTool,
    excelAddPivotRowFieldTool,
    excelAddPivotColumnFieldTool,
    excelAddPivotDataFieldTool,
    excelAddPivotFilterFieldTool,
    excelRefreshPivotTableTool,
    excelDeletePivotTableTool,
    excelGetPivotTableInfoTool,
    excelSetPivotTableStyleTool,
    excelRemovePivotFieldTool,
    excelGetAllPivotTablesTool,
    excelSetPivotTableLayoutTool,

    // Data Validation Tools (8 tools) - P2
    excelAddDataValidationTool,
    excelGetDataValidationTool,
    excelRemoveDataValidationTool,
    excelClearInvalidDataTool,
    excelSetInputMessageTool,
    excelSetErrorAlertTool,
    excelGetInvalidCellsTool,
    excelBatchSetValidationTool,

    // Table Totals Tools (3 tools) - P2
    excelShowTableTotalsTool,
    excelSetTableTotalFunctionTool,
    excelGetTableTotalsStatusTool,

    // Slicer Tools (8 tools) - P2
    excelAddSlicerTool,
    excelGetSlicersTool,
    excelGetSlicerDetailTool,
    excelUpdateSlicerTool,
    excelSetSlicerSelectionTool,
    excelClearSlicerSelectionTool,
    excelDeleteSlicerTool,
    excelGetSlicerItemsTool,

    // Shape Tools (8 tools) - P2
    excelAddShapeTool,
    excelGetShapesTool,
    excelGetShapeDetailTool,
    excelUpdateShapeTool,
    excelSetShapeFillTool,
    excelSetShapeLineTool,
    excelAddShapeTextTool,
    excelDeleteShapeTool,

    // PivotHierarchy Tools (8 tools) - P2
    excelGetPivotHierarchiesTool,
    excelGetPivotHierarchyItemsTool,
    excelAddPivotHierarchyTool,
    excelRemovePivotHierarchyTool,
    excelExpandPivotHierarchyTool,
    excelCollapsePivotHierarchyTool,
    excelMovePivotHierarchyTool,
    excelSetPivotHierarchySortTool
  ], 'excel')
}
