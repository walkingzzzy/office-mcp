/**
 * PowerPoint Tools Index - Phase 6 Complete Implementation
 * Export all 36 PowerPoint tools
 */

import type { ToolDefinition } from './types.js'
import { enhanceToolsForDomain } from './utils/teachingContext.js'
import {
  pptAddAnimationTool,
  pptEndSlideshowTool,
  pptPreviewAnimationTool,
  pptRemoveAnimationTool,
  pptSetAnimationTimingTool,
  pptSetAnimationTriggerTool,
  pptSetSlideTimingTool,
  pptStartSlideshowTool
} from './animations.js'
import {
  pptCompressMediaTool,
  pptCropImageTool,
  pptInsertAudioTool,
  pptInsertImageTool,
  pptInsertVideoTool,
  pptSetImageEffectsTool
} from './content.js'
import {
  pptAddShapeTool,
  pptAddTextBoxTool,
  pptAlignShapesTool,
  pptDeleteShapeTool,
  pptGroupShapesTool,
  pptMoveShapeTool,
  pptResizeShapeTool,
  pptRotateShapeTool,
  pptSetShapeFillTool,
  pptSetShapeOutlineTool,
  pptSetTextFormatTool,
  pptUngroupShapesTool
} from './shapes.js'
// Import all PowerPoint tool modules
import {
  pptAddSlideTool,
  pptDeleteSlideTool,
  pptDuplicateSlideTool,
  pptGetSlideCountTool,
  pptHideSlideTool,
  pptMoveSlideTool,
  pptNavigateToSlideTool,
  pptSetSlideLayoutTool,
  pptSetSlideTransitionTool,
  pptUnhideSlideTool
} from './slides.js'
// Import Education tools (P1)
import {
  pptLessonSlidesTool,
  pptExerciseSlideTool
} from './education.js'
// Import Slide Master tools (6) - P0
import {
  pptGetSlideMastersTool,
  pptGetMasterLayoutsTool,
  pptApplySlideMasterTool,
  pptCopySlideMasterTool,
  pptDeleteSlideMasterTool,
  pptRenameSlideMasterTool
} from './master.js'
// Import Notes tools (5) - P1
import {
  pptAddSlideNotesTool,
  pptGetSlideNotesTool,
  pptUpdateSlideNotesTool,
  pptDeleteSlideNotesTool,
  pptGetAllSlideNotesTool
} from './notes.js'
// Import Hyperlink tools (5) - P1
import {
  pptAddHyperlinkToShapeTool,
  pptAddHyperlinkToTextTool,
  pptGetHyperlinksTool,
  pptRemoveHyperlinkTool,
  pptUpdateHyperlinkTool
} from './hyperlink.js'
// Import Export tools (3) - P1
import {
  pptExportToPdfTool,
  pptExportSlidesToImagesTool,
  pptExportToVideoTool
} from './export.js'
// Import Media Enhancement tools (4) - P2
import {
  pptSetMediaPlaybackTool,
  pptGetMediaInfoTool,
  pptDeleteMediaTool,
  pptSetMediaTimelineTool
} from './media.js'
// Import Comment tools (9) - P2
import {
  pptAddCommentTool,
  pptGetCommentsTool,
  pptGetCommentDetailTool,
  pptReplyCommentTool,
  pptResolveCommentTool,
  pptReopenCommentTool,
  pptDeleteCommentTool,
  pptDeleteCommentReplyTool,
  pptDeleteAllCommentsTool
} from './comment.js'
// Import Custom Layout tools (7) - P2
import {
  pptCreateCustomLayoutTool,
  pptGetCustomLayoutsTool,
  pptGetCustomLayoutDetailTool,
  pptAddPlaceholderToLayoutTool,
  pptDeleteCustomLayoutTool,
  pptRenameCustomLayoutTool,
  pptApplyCustomLayoutTool
} from './customLayout.js'
// Import SlideShow Settings tools (10) - P2
import {
  pptGetSlideShowSettingsTool,
  pptSetSlideShowLoopTool,
  pptSetSlideShowRangeTool,
  pptSetSlideAdvanceModeTool,
  pptSetPresenterViewTool,
  pptSetKioskModeTool,
  pptSetAnimationAndNarrationTool,
  pptSetSlideShowResolutionTool,
  pptSetSlideShowDisplayTool,
  pptResetSlideShowSettingsTool
} from './slideShowSettings.js'

/**
 * Get all PowerPoint tools (87 tools total = 44 + 5 notes + 5 hyperlink + 3 export + 4 media_enhancement + 9 comment + 7 custom_layout + 10 slideshow_settings)
 */
export function getPowerPointTools(): ToolDefinition[] {
  return enhanceToolsForDomain([
    // Slide Operations (10 tools)
    pptAddSlideTool,
    pptDeleteSlideTool,
    pptDuplicateSlideTool,
    pptMoveSlideTool,
    pptSetSlideLayoutTool,
    pptGetSlideCountTool,
    pptNavigateToSlideTool,
    pptHideSlideTool,
    pptUnhideSlideTool,
    pptSetSlideTransitionTool,

    // Shapes and Text Tools (12 tools)
    pptAddTextBoxTool,
    pptAddShapeTool,
    pptDeleteShapeTool,
    pptMoveShapeTool,
    pptResizeShapeTool,
    pptSetShapeFillTool,
    pptSetShapeOutlineTool,
    pptSetTextFormatTool,
    pptAlignShapesTool,
    pptGroupShapesTool,
    pptUngroupShapesTool,
    pptRotateShapeTool,

    // Images and Media Tools (6 tools)
    pptInsertImageTool,
    pptInsertVideoTool,
    pptInsertAudioTool,
    pptCropImageTool,
    pptCompressMediaTool,
    pptSetImageEffectsTool,

    // Animation and Transition Tools (8 tools)
    pptAddAnimationTool,
    pptRemoveAnimationTool,
    pptSetAnimationTimingTool,
    pptSetAnimationTriggerTool,
    pptPreviewAnimationTool,
    pptSetSlideTimingTool,
    pptStartSlideshowTool,
    pptEndSlideshowTool,

    // Education Tools (2 tools) - P1
    pptLessonSlidesTool,
    pptExerciseSlideTool,

    // Slide Master Tools (6 tools) - P0
    pptGetSlideMastersTool,
    pptGetMasterLayoutsTool,
    pptApplySlideMasterTool,
    pptCopySlideMasterTool,
    pptDeleteSlideMasterTool,
    pptRenameSlideMasterTool,

    // Notes Tools (5 tools) - P1
    pptAddSlideNotesTool,
    pptGetSlideNotesTool,
    pptUpdateSlideNotesTool,
    pptDeleteSlideNotesTool,
    pptGetAllSlideNotesTool,

    // Hyperlink Tools (5 tools) - P1
    pptAddHyperlinkToShapeTool,
    pptAddHyperlinkToTextTool,
    pptGetHyperlinksTool,
    pptRemoveHyperlinkTool,
    pptUpdateHyperlinkTool,

    // Export Tools (3 tools) - P1
    pptExportToPdfTool,
    pptExportSlidesToImagesTool,
    pptExportToVideoTool,

    // Media Enhancement Tools (4 tools) - P2
    pptSetMediaPlaybackTool,
    pptGetMediaInfoTool,
    pptDeleteMediaTool,
    pptSetMediaTimelineTool,

    // Comment Tools (9 tools) - P2
    pptAddCommentTool,
    pptGetCommentsTool,
    pptGetCommentDetailTool,
    pptReplyCommentTool,
    pptResolveCommentTool,
    pptReopenCommentTool,
    pptDeleteCommentTool,
    pptDeleteCommentReplyTool,
    pptDeleteAllCommentsTool,

    // Custom Layout Tools (7 tools) - P2
    pptCreateCustomLayoutTool,
    pptGetCustomLayoutsTool,
    pptGetCustomLayoutDetailTool,
    pptAddPlaceholderToLayoutTool,
    pptDeleteCustomLayoutTool,
    pptRenameCustomLayoutTool,
    pptApplyCustomLayoutTool,

    // SlideShow Settings Tools (10 tools) - P2
    pptGetSlideShowSettingsTool,
    pptSetSlideShowLoopTool,
    pptSetSlideShowRangeTool,
    pptSetSlideAdvanceModeTool,
    pptSetPresenterViewTool,
    pptSetKioskModeTool,
    pptSetAnimationAndNarrationTool,
    pptSetSlideShowResolutionTool,
    pptSetSlideShowDisplayTool,
    pptResetSlideShowSettingsTool
  ], 'powerpoint')
}
