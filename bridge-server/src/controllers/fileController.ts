import { Request, Response } from 'express';
import { ApiResponse, FileUploadInfo, DocumentDiff, DocumentSession } from '../types';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';
import documentService from '../services/DocumentService';
import chunkService from '../services/ChunkService';

/**
 * 处理文件上传
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: '没有上传文件',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const file = req.file;
    const fileInfo: FileUploadInfo = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };

    logger.info('文件上传成功', fileInfo);

    const response: ApiResponse = {
      success: true,
      data: fileInfo,
      message: '文件上传成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('文件上传失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '文件上传失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 下载文件
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      const response: ApiResponse = {
        success: false,
        error: '缺少filename参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const filePath = path.join(process.cwd(), 'temp', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      const response: ApiResponse = {
        success: false,
        error: '文件不存在',
        message: '文件未找到',
      };
      return res.status(404).json(response);
    }

    logger.info(`下载文件: ${filename}`);

    res.download(filePath, (err) => {
      if (err) {
        logger.error('文件下载失败', err);
        if (!res.headersSent) {
          const response: ApiResponse = {
            success: false,
            error: err.message,
            message: '文件下载失败',
          };
          res.status(500).json(response);
        }
      }
    });
  } catch (error: any) {
    logger.error('文件下载失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '文件下载失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 删除文件
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      const response: ApiResponse = {
        success: false,
        error: '缺少filename参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const filePath = path.join(process.cwd(), 'temp', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      const response: ApiResponse = {
        success: false,
        error: '文件不存在',
        message: '文件未找到',
      };
      return res.status(404).json(response);
    }

    // 删除文件
    fs.unlinkSync(filePath);
    logger.info(`删除文件: ${filename}`);

    const response: ApiResponse = {
      success: true,
      message: '文件删除成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('文件删除失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '文件删除失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 创建文档会话
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      const response: ApiResponse = {
        success: false,
        error: '缺少fileId参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    if (!documentService.fileExists(fileId)) {
      const response: ApiResponse = {
        success: false,
        error: '文件不存在',
        message: '文件未找到',
      };
      return res.status(404).json(response);
    }

    const session = documentService.createSession(fileId);

    const response: ApiResponse<DocumentSession> = {
      success: true,
      data: session,
      message: '会话创建成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('创建会话失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '创建会话失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 获取文档会话
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = documentService.getSession(sessionId);
    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: '会话不存在',
        message: '会话未找到',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<DocumentSession> = {
      success: true,
      data: session,
      message: '获取会话成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('获取会话失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '获取会话失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 计算文档差异
 */
export const calculateDiff = async (req: Request, res: Response) => {
  try {
    const { originalFileId, modifiedFileId } = req.body;

    if (!originalFileId || !modifiedFileId) {
      const response: ApiResponse = {
        success: false,
        error: '缺少文件ID参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const originalPath = documentService.getFilePath(originalFileId);
    const modifiedPath = documentService.getFilePath(modifiedFileId);

    if (!fs.existsSync(originalPath) || !fs.existsSync(modifiedPath)) {
      const response: ApiResponse = {
        success: false,
        error: '文件不存在',
        message: '文件未找到',
      };
      return res.status(404).json(response);
    }

    const diff = await documentService.calculateDiff(originalPath, modifiedPath);

    const response: ApiResponse<DocumentDiff> = {
      success: true,
      data: diff,
      message: '差异计算成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('计算差异失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '计算差异失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 分片上传
 */
export const uploadChunk = async (req: Request, res: Response) => {
  try {
    const { fileId, chunkIndex, totalChunks } = req.body;
    const chunkData = req.file?.buffer;

    if (!fileId || chunkIndex === undefined || !totalChunks || !chunkData) {
      const response: ApiResponse = {
        success: false,
        error: '缺少必要参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const success = chunkService.receiveChunk(
      fileId,
      parseInt(chunkIndex),
      parseInt(totalChunks),
      chunkData
    );

    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: '分片上传失败',
        message: '分片处理失败',
      };
      return res.status(500).json(response);
    }

    const progress = chunkService.getProgress(fileId);

    const response: ApiResponse = {
      success: true,
      data: progress,
      message: '分片上传成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('分片上传失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '分片上传失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 合并分片
 */
export const mergeChunks = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      const response: ApiResponse = {
        success: false,
        error: '缺少fileId参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    if (!chunkService.isFileComplete(fileId)) {
      const response: ApiResponse = {
        success: false,
        error: '文件不完整',
        message: '部分分片缺失',
      };
      return res.status(400).json(response);
    }

    const filePath = await chunkService.mergeChunks(fileId);
    chunkService.clearChunks(fileId);

    const response: ApiResponse = {
      success: true,
      data: { filePath, fileId },
      message: '文件合并成功',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('合并分片失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '合并分片失败',
    };

    res.status(500).json(response);
  }
};

/**
 * 下载分片
 */
export const downloadChunk = async (req: Request, res: Response) => {
  try {
    const { fileId, chunkIndex } = req.params;

    if (!fileId || chunkIndex === undefined) {
      const response: ApiResponse = {
        success: false,
        error: '缺少参数',
        message: '请求参数错误',
      };
      return res.status(400).json(response);
    }

    const chunk = chunkService.getChunk(fileId, parseInt(chunkIndex));
    if (!chunk) {
      const response: ApiResponse = {
        success: false,
        error: '分片不存在',
        message: '分片未找到',
      };
      return res.status(404).json(response);
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': chunk.size.toString(),
      'X-Chunk-Index': chunk.chunkIndex.toString(),
      'X-Total-Chunks': chunk.totalChunks.toString(),
    });

    res.send(chunk.data);
  } catch (error: any) {
    logger.error('下载分片失败', error);

    const response: ApiResponse = {
      success: false,
      error: error.message,
      message: '下载分片失败',
    };

    res.status(500).json(response);
  }
};
