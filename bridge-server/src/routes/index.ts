import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, requirePermissions, toolWhitelistMiddleware, validateToolArgs } from '../middleware/authMiddleware';
import * as healthController from '../controllers/healthController';
import * as toolController from '../controllers/toolController';
import * as fileController from '../controllers/fileController';
import * as aiController from '../controllers/aiController';
import * as authController from '../controllers/authController';
import * as batchController from '../controllers/batchController';
import * as historyController from '../controllers/historyController';

const router = Router();

// 确保临时目录存在
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// 配置Multer文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize * 1024 * 1024, // MB转字节
  },
  fileFilter: (req, file, cb) => {
    // 允许的Office文件类型
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

/**
 * 健康检查路由
 */
router.get('/health', asyncHandler(healthController.healthCheck));
router.get('/server/info', asyncHandler(healthController.getServerInfo));

/**
 * 工具相关路由 (需要认证和白名单验证)
 */
router.get('/tools/list', asyncHandler(toolController.listTools));
router.post('/tools/call',
  authMiddleware,
  toolWhitelistMiddleware,
  validateToolArgs,
  asyncHandler(toolController.callTool)
);

/**
 * 文件相关路由
 */
router.post('/files/upload', upload.single('file'), asyncHandler(fileController.uploadFile));
router.get('/files/:filename', asyncHandler(fileController.downloadFile));
router.delete('/files/:filename', asyncHandler(fileController.deleteFile));

/**
 * 文档会话路由
 */
router.post('/sessions', asyncHandler(fileController.createSession));
router.get('/sessions/:sessionId', asyncHandler(fileController.getSession));

/**
 * 文档差异计算路由
 */
router.post('/documents/diff', asyncHandler(fileController.calculateDiff));

/**
 * 分片传输路由
 */
const memoryUpload = multer({ storage: multer.memoryStorage() });
router.post('/files/chunks/upload', memoryUpload.single('chunk'), asyncHandler(fileController.uploadChunk));
router.post('/files/chunks/merge', asyncHandler(fileController.mergeChunks));
router.get('/files/chunks/:fileId/:chunkIndex', asyncHandler(fileController.downloadChunk));

/**
 * AI相关路由
 */
router.post('/ai/conversations', asyncHandler(aiController.createConversation));
router.get('/ai/conversations/:conversationId', asyncHandler(aiController.getConversation));
router.post('/ai/chat', asyncHandler(aiController.sendMessage));
router.post('/ai/stream', asyncHandler(aiController.streamChat));
router.get('/ai/tools', asyncHandler(aiController.getAvailableTools));
router.post('/ai/tools/execute', asyncHandler(aiController.executeTool));
router.post('/ai/config/apikey', asyncHandler(aiController.configureAPIKey));
router.get('/ai/status', asyncHandler(aiController.getSystemStatus));

/**
 * 认证相关路由
 */
router.post('/auth/token', asyncHandler(authController.generateToken));
router.post('/auth/refresh', authMiddleware, asyncHandler(authController.refreshToken));
router.post('/auth/revoke', authMiddleware, asyncHandler(authController.revokeToken));

/**
 * 批量操作路由
 */
router.post('/batch/execute', authMiddleware, asyncHandler(batchController.executeBatch));
router.post('/batch/estimate', asyncHandler(batchController.estimateBatchTime));

/**
 * 操作历史路由
 */
router.get('/history/:sessionId', authMiddleware, asyncHandler(historyController.getHistory));
router.post('/history/:sessionId/undo', authMiddleware, asyncHandler(historyController.undoOperation));
router.get('/history/:sessionId/stats', asyncHandler(historyController.getStats));

export default router;
