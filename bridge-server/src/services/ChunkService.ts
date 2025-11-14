import { FileChunk } from '../types';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * 文件分片服务
 */
export class ChunkService {
  private chunks: Map<string, FileChunk[]> = new Map();
  private readonly chunkSize: number;
  private tempDir: string;

  constructor(chunkSize: number = 1024 * 1024, tempDir: string = 'temp') { // 1MB chunks
    this.chunkSize = chunkSize;
    this.tempDir = tempDir;
  }

  /**
   * 将文件分片
   */
  async splitFile(filePath: string, fileId: string): Promise<FileChunk[]> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const totalSize = fileBuffer.length;
      const totalChunks = Math.ceil(totalSize / this.chunkSize);
      const chunks: FileChunk[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, totalSize);
        const chunkData = fileBuffer.slice(start, end);

        const chunk: FileChunk = {
          chunkId: this.generateChunkId(fileId, i),
          fileId,
          chunkIndex: i,
          totalChunks,
          data: chunkData,
          size: chunkData.length,
        };

        chunks.push(chunk);
      }

      this.chunks.set(fileId, chunks);
      logger.info(`文件分片完成: ${fileId}, 共${totalChunks}个分片`);
      return chunks;
    } catch (error: any) {
      logger.error(`文件分片失败: ${fileId}`, error);
      throw new Error(`分片失败: ${error.message}`);
    }
  }

  /**
   * 获取文件分片
   */
  getChunk(fileId: string, chunkIndex: number): FileChunk | null {
    const chunks = this.chunks.get(fileId);
    if (!chunks || chunkIndex >= chunks.length) {
      return null;
    }
    return chunks[chunkIndex];
  }

  /**
   * 获取文件的所有分片信息（不包含数据）
   */
  getChunkInfo(fileId: string): Array<{
    chunkId: string;
    chunkIndex: number;
    totalChunks: number;
    size: number;
  }> | null {
    const chunks = this.chunks.get(fileId);
    if (!chunks) {
      return null;
    }

    return chunks.map(chunk => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      size: chunk.size,
    }));
  }

  /**
   * 接收分片上传
   */
  receiveChunk(fileId: string, chunkIndex: number, totalChunks: number, chunkData: Buffer): boolean {
    try {
      if (!this.chunks.has(fileId)) {
        this.chunks.set(fileId, new Array(totalChunks));
      }

      const chunks = this.chunks.get(fileId)!;
      const chunk: FileChunk = {
        chunkId: this.generateChunkId(fileId, chunkIndex),
        fileId,
        chunkIndex,
        totalChunks,
        data: chunkData,
        size: chunkData.length,
      };

      chunks[chunkIndex] = chunk;
      logger.debug(`接收分片: ${fileId}[${chunkIndex}/${totalChunks}]`);
      return true;
    } catch (error: any) {
      logger.error(`接收分片失败: ${fileId}[${chunkIndex}]`, error);
      return false;
    }
  }

  /**
   * 检查文件是否完整
   */
  isFileComplete(fileId: string): boolean {
    const chunks = this.chunks.get(fileId);
    if (!chunks) {
      return false;
    }

    return chunks.every(chunk => chunk !== undefined && chunk !== null);
  }

  /**
   * 合并分片为完整文件
   */
  async mergeChunks(fileId: string, outputPath?: string): Promise<string> {
    const chunks = this.chunks.get(fileId);
    if (!chunks || !this.isFileComplete(fileId)) {
      throw new Error(`文件不完整或不存在: ${fileId}`);
    }

    try {
      // 按索引排序
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      // 合并数据
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const mergedBuffer = Buffer.alloc(totalSize);
      let offset = 0;

      for (const chunk of chunks) {
        chunk.data.copy(mergedBuffer, offset);
        offset += chunk.size;
      }

      // 写入文件
      const filePath = outputPath || path.join(this.tempDir, `${fileId}_merged`);
      fs.writeFileSync(filePath, mergedBuffer);

      logger.info(`文件合并完成: ${fileId} -> ${filePath}`);
      return filePath;
    } catch (error: any) {
      logger.error(`文件合并失败: ${fileId}`, error);
      throw new Error(`合并失败: ${error.message}`);
    }
  }

  /**
   * 清理分片数据
   */
  clearChunks(fileId: string): boolean {
    const deleted = this.chunks.delete(fileId);
    if (deleted) {
      logger.info(`清理分片数据: ${fileId}`);
    }
    return deleted;
  }

  /**
   * 获取分片进度
   */
  getProgress(fileId: string): {
    received: number;
    total: number;
    percentage: number;
  } | null {
    const chunks = this.chunks.get(fileId);
    if (!chunks) {
      return null;
    }

    const received = chunks.filter(chunk => chunk !== undefined && chunk !== null).length;
    const total = chunks.length;
    const percentage = total > 0 ? Math.round((received / total) * 100) : 0;

    return { received, total, percentage };
  }

  /**
   * 生成分片ID
   */
  private generateChunkId(fileId: string, chunkIndex: number): string {
    return crypto.createHash('md5').update(`${fileId}_${chunkIndex}`).digest('hex');
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalFiles: number;
    totalChunks: number;
    memoryUsage: number;
  } {
    let totalChunks = 0;
    let memoryUsage = 0;

    for (const chunks of this.chunks.values()) {
      totalChunks += chunks.length;
      for (const chunk of chunks) {
        if (chunk) {
          memoryUsage += chunk.data.length;
        }
      }
    }

    return {
      totalFiles: this.chunks.size,
      totalChunks,
      memoryUsage,
    };
  }

  /**
   * 清理所有分片数据
   */
  clearAll(): void {
    this.chunks.clear();
    logger.info('清理所有分片数据');
  }
}

// 导出单例
export default new ChunkService();