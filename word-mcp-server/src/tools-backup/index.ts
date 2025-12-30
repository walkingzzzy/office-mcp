/**
 * Word Tools Index - Phase 3 & 4 Implementation
 * Export all 77 Word tools
 */

import type { ToolDefinition } from './types.js'
import { enhanceToolsForDomain } from './utils/teachingContext.js'
// Import advanced tools (4) - Phase 4
import {
  wordInsertPageBreakTool,
  wordInsertSectionBreakTool,
  wordInsertTocTool,
  wordUpdateTocTool
} from './advanced.js'
// Import formatting tools (10)
import {
  wordSetBoldTool,
  wordSetFontColorTool,
  wordSetFontSizeTool,
  wordSetFontTool,
  wordSetHighlightTool,
  wordSetItalicTool,
  wordSetStrikethroughTool,
  wordSetSubscriptTool,
  wordSetSuperscriptTool,
  wordSetUnderlineTool
} from './formatting.js'
// Import hyperlink tools (8) - Phase 4
import {
  wordInsertBibliographyTool,
  wordInsertBookmarkTool,
  wordInsertCitationTool,
  wordInsertCrossReferenceTool,
  wordInsertEndnoteTool,
  wordInsertFootnoteTool,
  wordInsertHyperlinkTool,
  wordRemoveHyperlinkTool
} from './hyperlink.js'
// Import image tools (10) - Phase 4
import {
  wordAddImageCaptionTool,
  wordCompressImagesTool,
  wordDeleteImageTool,
  wordInsertImageTool,
  wordMoveImageTool,
  wordReplaceImageTool,
  wordResizeImageTool,
  wordRotateImageTool,
  wordSetImagePositionTool,
  wordWrapTextAroundImageTool
} from './image.js'
// Import paragraph tools (10)
import {
  wordAddParagraphTool,
  wordDeleteParagraphTool,
  wordGetParagraphsTool,
  wordInsertParagraphAtTool,
  wordMergeParagraphsTool,
  wordMoveParagraphTool,
  wordSetParagraphAlignmentTool,
  wordSetParagraphIndentTool,
  wordSetParagraphSpacingTool,
  wordSplitParagraphTool
} from './paragraph.js'
// Import style tools (10)
import {
  wordApplyListStyleTool,
  wordApplyStyleTool,
  wordApplyThemeTool,
  wordCopyFormatTool,
  wordCreateStyleTool,
  wordListStylesTool,
  wordResetStyleTool,
  wordSetBackgroundColorTool,
  wordSetHeadingTool,
  wordSetLineSpacingTool
} from './styles.js'
// Import table tools (15) - Phase 4
import {
  wordAddColumnTool,
  wordAddRowTool,
  wordDeleteColumnTool,
  wordDeleteRowTool,
  wordDeleteTableTool,
  wordFormatTableTool,
  wordGetCellValueTool,
  wordInsertTableTool,
  wordMergeCellsTool,
  wordSetCellBorderTool,
  wordSetCellShadingTool,
  wordSetCellValueTool,
  wordSetTableStyleTool,
  wordSplitCellTool,
  wordTableToTextTool
} from './table.js'
// Import text tools (10)
import {
  wordClearFormattingTool,
  wordCopyTextTool,
  wordCutTextTool,
  wordDeleteTextTool,
  wordGetSelectedTextTool,
  wordInsertTextTool,
  wordPasteTextTool,
  wordReplaceTextTool,
  wordSearchTextTool,
  wordSelectTextRangeTool
} from './text.js'
// Import header/footer tools (6) - Phase 3
import {
  wordInsertHeaderTool,
  wordInsertFooterTool,
  wordGetHeaderTool,
  wordGetFooterTool,
  wordClearHeaderTool,
  wordClearFooterTool
} from './headerFooter.js'
// Import page setup tools (6) - P0
import {
  wordSetPageMarginsTool,
  wordGetPageMarginsTool,
  wordSetPageOrientationTool,
  wordGetPageOrientationTool,
  wordSetPageSizeTool,
  wordGetPageSizeTool
} from './pageSetup.js'
// Import Education tools (P0/P1/P2)
import {
  wordMailMergeTool,
  wordExamHeaderTool,
  wordQuestionSectionTool,
  wordLessonPlanTool,
  wordOfficialHeaderTool
} from './education.js'
// Import Content Control tools (6) - P0
import {
  wordInsertContentControlTool,
  wordGetContentControlsTool,
  wordSetContentControlValueTool,
  wordGetContentControlValueTool,
  wordDeleteContentControlTool,
  wordClearContentControlTool
} from './contentControl.js'
// Import Save tools (4) - P0
import {
  wordSaveDocumentTool,
  wordSaveAsDocumentTool,
  wordGetSaveStatusTool,
  wordCloseDocumentTool
} from './save.js'
// Import Bookmark tools (6) - P1
import {
  wordCreateBookmarkTool,
  wordDeleteBookmarkTool,
  wordGetBookmarksTool,
  wordGoToBookmarkTool,
  wordUpdateBookmarkTool,
  wordCheckBookmarkTool
} from './bookmark.js'
// Import Comment tools (6) - P1
import {
  wordAddCommentTool,
  wordGetCommentsTool,
  wordReplyCommentTool,
  wordResolveCommentTool,
  wordDeleteCommentTool,
  wordGetCommentDetailTool
} from './comment.js'
// Import Track Changes tools (8) - P1
import {
  wordEnableTrackChangesTool,
  wordDisableTrackChangesTool,
  wordGetTrackChangesStatusTool,
  wordGetTrackChangesTool,
  wordAcceptTrackChangeTool,
  wordRejectTrackChangeTool,
  wordAcceptAllTrackChangesTool,
  wordRejectAllTrackChangesTool
} from './trackChanges.js'
// Import Field tools (8) - P1
import {
  wordInsertFieldTool,
  wordGetFieldsTool,
  wordUpdateFieldTool,
  wordUpdateAllFieldsTool,
  wordDeleteFieldTool,
  wordLockFieldTool,
  wordUnlockFieldTool,
  wordGetFieldResultTool
} from './field.js'
// Import Shape tools (8) - P1
import {
  wordInsertShapeTool,
  wordDeleteShapeTool,
  wordGetShapeTool,
  wordSetShapePropertiesTool,
  wordMoveShapeTool,
  wordResizeShapeTool,
  wordSetShapeFillTool,
  wordSetShapeLineTool
} from './shape.js'
// Import Coauthoring tools (6) - P1
import {
  wordGetCoauthoringStatusTool,
  wordGetCoauthorsTool,
  wordGetCoauthoringLocksTool,
  wordRequestCoauthoringLockTool,
  wordReleaseCoauthoringLockTool,
  wordSyncCoauthoringChangesTool
} from './coauthoring.js'
// Import Annotation tools (6) - P2
import {
  wordAddInkAnnotationTool,
  wordGetInkAnnotationsTool,
  wordGetInkAnnotationDetailTool,
  wordDeleteInkAnnotationTool,
  wordDeleteAllInkAnnotationsTool,
  wordUpdateInkAnnotationTool
} from './annotation.js'
// Import Document tools (8) - P1
import {
  wordOpenDocumentTool,
  wordPrintDocumentTool,
  wordPrintPreviewTool,
  wordClosePrintPreviewTool,
  wordGetDocumentPropertiesTool,
  wordSetDocumentPropertiesTool,
  wordGetDocumentStatisticsTool,
  wordGetDocumentPathTool
} from './document.js'
// Import Conflict tools (7) - P3
import {
  wordGetConflictsTool,
  wordGetConflictDetailTool,
  wordAcceptLocalVersionTool,
  wordAcceptServerVersionTool,
  wordMergeConflictTool,
  wordAcceptAllLocalVersionsTool,
  wordAcceptAllServerVersionsTool
} from './conflict.js'
// Import Canvas tools (6) - P3
import {
  wordInsertCanvasTool,
  wordGetCanvasesTool,
  wordDeleteCanvasTool,
  wordInsertGeometricShapeTool,
  wordAddShapeToCanvasTool,
  wordGetCanvasShapesTool
} from './canvas.js'
// Import Read tools (7) - Plugin compatibility
import {
  wordReadDocumentTool,
  wordDetectSelectionTypeTool,
  wordCheckDocumentHasImagesTool,
  wordCheckDocumentHasTablesTool,
  wordGetImagesTool,
  wordFormatTextTool,
  wordSetFontNameTool
} from './read.js'
// Import Chart tools (2) - P1
import {
  wordInsertChartTool,
  wordGetChartsTool
} from './chart.js'

/**
 * Get all Word tools (160 tools total = 153 base + 7 read/plugin-compatibility tools)
 */
export function getWordTools(): ToolDefinition[] {
  return enhanceToolsForDomain([
    // Paragraph operations (10)
    wordAddParagraphTool,
    wordInsertParagraphAtTool,
    wordDeleteParagraphTool,
    wordGetParagraphsTool,
    wordSetParagraphSpacingTool,
    wordSetParagraphAlignmentTool,
    wordSetParagraphIndentTool,
    wordMergeParagraphsTool,
    wordSplitParagraphTool,
    wordMoveParagraphTool,

    // Text operations (10)
    wordInsertTextTool,
    wordReplaceTextTool,
    wordDeleteTextTool,
    wordSearchTextTool,
    wordGetSelectedTextTool,
    wordSelectTextRangeTool,
    wordClearFormattingTool,
    wordCopyTextTool,
    wordCutTextTool,
    wordPasteTextTool,

    // Formatting operations (10)
    wordSetFontTool,
    wordSetFontSizeTool,
    wordSetFontColorTool,
    wordSetBoldTool,
    wordSetItalicTool,
    wordSetUnderlineTool,
    wordSetHighlightTool,
    wordSetStrikethroughTool,
    wordSetSubscriptTool,
    wordSetSuperscriptTool,

    // Style operations (10)
    wordApplyStyleTool,
    wordCreateStyleTool,
    wordListStylesTool,
    wordSetHeadingTool,
    wordApplyListStyleTool,
    wordSetLineSpacingTool,
    wordSetBackgroundColorTool,
    wordApplyThemeTool,
    wordResetStyleTool,
    wordCopyFormatTool,

    // Table operations (15) - Phase 4
    wordInsertTableTool,
    wordDeleteTableTool,
    wordAddRowTool,
    wordAddColumnTool,
    wordDeleteRowTool,
    wordDeleteColumnTool,
    wordMergeCellsTool,
    wordSplitCellTool,
    wordSetCellValueTool,
    wordGetCellValueTool,
    wordFormatTableTool,
    wordSetTableStyleTool,
    wordSetCellBorderTool,
    wordSetCellShadingTool,
    wordTableToTextTool,

    // Image operations (10) - Phase 4
    wordInsertImageTool,
    wordDeleteImageTool,
    wordResizeImageTool,
    wordMoveImageTool,
    wordRotateImageTool,
    wordSetImagePositionTool,
    wordWrapTextAroundImageTool,
    wordAddImageCaptionTool,
    wordCompressImagesTool,
    wordReplaceImageTool,

    // Hyperlink and reference operations (8) - Phase 4
    wordInsertHyperlinkTool,
    wordRemoveHyperlinkTool,
    wordInsertBookmarkTool,
    wordInsertCrossReferenceTool,
    wordInsertFootnoteTool,
    wordInsertEndnoteTool,
    wordInsertCitationTool,
    wordInsertBibliographyTool,

    // Advanced operations (4) - Phase 4
    wordInsertTocTool,
    wordUpdateTocTool,
    wordInsertPageBreakTool,
    wordInsertSectionBreakTool,

    // Header/Footer operations (6) - P0
    wordInsertHeaderTool,
    wordInsertFooterTool,
    wordGetHeaderTool,
    wordGetFooterTool,
    wordClearHeaderTool,
    wordClearFooterTool,

    // Page Setup operations (6) - P0
    wordSetPageMarginsTool,
    wordGetPageMarginsTool,
    wordSetPageOrientationTool,
    wordGetPageOrientationTool,
    wordSetPageSizeTool,
    wordGetPageSizeTool,

    // Content Control operations (6) - P0
    wordInsertContentControlTool,
    wordGetContentControlsTool,
    wordSetContentControlValueTool,
    wordGetContentControlValueTool,
    wordDeleteContentControlTool,
    wordClearContentControlTool,

    // Education Tools (5 tools) - P0/P1/P2
    wordMailMergeTool,
    wordExamHeaderTool,
    wordQuestionSectionTool,
    wordLessonPlanTool,
    wordOfficialHeaderTool,

    // Save operations (4 tools) - P0
    wordSaveDocumentTool,
    wordSaveAsDocumentTool,
    wordGetSaveStatusTool,
    wordCloseDocumentTool,

    // Bookmark operations (6 tools) - P1
    wordCreateBookmarkTool,
    wordDeleteBookmarkTool,
    wordGetBookmarksTool,
    wordGoToBookmarkTool,
    wordUpdateBookmarkTool,
    wordCheckBookmarkTool,

    // Comment operations (6 tools) - P1
    wordAddCommentTool,
    wordGetCommentsTool,
    wordReplyCommentTool,
    wordResolveCommentTool,
    wordDeleteCommentTool,
    wordGetCommentDetailTool,

    // Track Changes operations (8 tools) - P1
    wordEnableTrackChangesTool,
    wordDisableTrackChangesTool,
    wordGetTrackChangesStatusTool,
    wordGetTrackChangesTool,
    wordAcceptTrackChangeTool,
    wordRejectTrackChangeTool,
    wordAcceptAllTrackChangesTool,
    wordRejectAllTrackChangesTool,

    // Field operations (8 tools) - P1
    wordInsertFieldTool,
    wordGetFieldsTool,
    wordUpdateFieldTool,
    wordUpdateAllFieldsTool,
    wordDeleteFieldTool,
    wordLockFieldTool,
    wordUnlockFieldTool,
    wordGetFieldResultTool,

    // Shape operations (8 tools) - P1
    wordInsertShapeTool,
    wordDeleteShapeTool,
    wordGetShapeTool,
    wordSetShapePropertiesTool,
    wordMoveShapeTool,
    wordResizeShapeTool,
    wordSetShapeFillTool,
    wordSetShapeLineTool,

    // Coauthoring operations (6 tools) - P1
    wordGetCoauthoringStatusTool,
    wordGetCoauthorsTool,
    wordGetCoauthoringLocksTool,
    wordRequestCoauthoringLockTool,
    wordReleaseCoauthoringLockTool,
    wordSyncCoauthoringChangesTool,

    // Annotation operations (6 tools) - P2
    wordAddInkAnnotationTool,
    wordGetInkAnnotationsTool,
    wordGetInkAnnotationDetailTool,
    wordDeleteInkAnnotationTool,
    wordDeleteAllInkAnnotationsTool,
    wordUpdateInkAnnotationTool,

    // Document operations (8 tools) - P1
    wordOpenDocumentTool,
    wordPrintDocumentTool,
    wordPrintPreviewTool,
    wordClosePrintPreviewTool,
    wordGetDocumentPropertiesTool,
    wordSetDocumentPropertiesTool,
    wordGetDocumentStatisticsTool,
    wordGetDocumentPathTool,

    // Conflict operations (7 tools) - P3
    wordGetConflictsTool,
    wordGetConflictDetailTool,
    wordAcceptLocalVersionTool,
    wordAcceptServerVersionTool,
    wordMergeConflictTool,
    wordAcceptAllLocalVersionsTool,
    wordAcceptAllServerVersionsTool,

    // Canvas operations (6 tools) - P3
    wordInsertCanvasTool,
    wordGetCanvasesTool,
    wordDeleteCanvasTool,
    wordInsertGeometricShapeTool,
    wordAddShapeToCanvasTool,
    wordGetCanvasShapesTool,

    // Read & Plugin compatibility tools (7 tools)
    wordReadDocumentTool,
    wordDetectSelectionTypeTool,
    wordCheckDocumentHasImagesTool,
    wordCheckDocumentHasTablesTool,
    wordGetImagesTool,
    wordFormatTextTool,
    wordSetFontNameTool,

    // Chart operations (2 tools) - P1
    wordInsertChartTool,
    wordGetChartsTool
  ], 'word')
}
