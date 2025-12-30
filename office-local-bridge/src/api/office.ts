/**
 * Office 环境检测和插件管理 API
 * 提供 Office 环境信息查询和插件管理功能
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createLogger } from '../utils/logger.js';
import { OfficeDetector } from '../office/OfficeDetector.js';
import { PluginManager } from '../office/PluginManager.js';
import type { PluginInstallRequest } from '../office/types.js';

const logger = createLogger('OfficeAPI');
const router = Router();

/**
 * GET /api/office/environment
 * 获取 Office 环境信息
 */
router.get('/environment', async (_req: Request, res: Response) => {
  try {
    const detector = OfficeDetector.getInstance();
    const environment = await detector.detectEnvironment();
    res.json({ success: true, data: environment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to detect Office environment', { error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to detect Office environment' });
  }
});

/**
 * GET /api/office/apps
 * 获取已安装的 Office 应用列表
 */
router.get('/apps', async (_req: Request, res: Response) => {
  try {
    const detector = OfficeDetector.getInstance();
    const apps = await detector.getInstalledApps();
    res.json({ success: true, data: apps });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get installed Office apps', { error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to get installed Office apps' });
  }
});

/**
 * GET /api/office/plugins
 * 获取所有已安装插件列表
 */
router.get('/plugins', async (_req: Request, res: Response) => {
  try {
    const pluginManager = PluginManager.getInstance();
    const plugins = await pluginManager.listPlugins();
    res.json({ success: true, data: plugins });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to list plugins', { error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to list plugins' });
  }
});

/**
 * GET /api/office/plugins/:id
 * 获取指定插件详情
 */
router.get('/plugins/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pluginManager = PluginManager.getInstance();
    const plugin = await pluginManager.getPlugin(id);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin not found: ${id}`
      });
    }

    res.json({ success: true, data: plugin });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get plugin details', { pluginId: id, error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to get plugin details' });
  }
});

/**
 * POST /api/office/plugins/install
 * 安装插件
 * 请求体: { manifestPath?: string, manifestUrl?: string }
 */
router.post('/plugins/install', async (req: Request, res: Response) => {
  const { manifestPath, manifestUrl } = req.body as PluginInstallRequest;

  // 验证请求参数
  if (!manifestPath && !manifestUrl) {
    return res.status(400).json({
      success: false,
      error: 'Either manifestPath or manifestUrl is required'
    });
  }

  // 目前仅支持本地安装
  if (manifestUrl && !manifestPath) {
    return res.status(400).json({
      success: false,
      error: 'Remote manifest URL installation is not yet supported. Please use manifestPath for local installation.'
    });
  }

  try {
    const pluginManager = PluginManager.getInstance();
    
    logger.info('Installing plugin', { manifestPath, manifestUrl });
    const plugin = await pluginManager.installPlugin(manifestPath!);

    res.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to install plugin', { manifestPath, manifestUrl, error: errorMessage });
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * DELETE /api/office/plugins/:id
 * 卸载插件
 */
router.delete('/plugins/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pluginManager = PluginManager.getInstance();

    // 先检查插件是否存在
    const plugin = await pluginManager.getPlugin(id);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin not found: ${id}`
      });
    }

    logger.info('Uninstalling plugin', { pluginId: id });
    const success = await pluginManager.uninstallPlugin(id);

    if (success) {
      res.json({
        success: true,
        message: `Plugin uninstalled successfully: ${id}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to uninstall plugin: ${id}`
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to uninstall plugin', { pluginId: id, error: errorMessage });
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * GET /api/office/plugins/:id/logs
 * 获取插件日志
 * 支持查询参数: limit (返回的最大日志条数)
 */
router.get('/plugins/:id/logs', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  try {
    const pluginManager = PluginManager.getInstance();

    // 解析 limit 参数
    let logLimit: number | undefined;
    if (limit) {
      logLimit = parseInt(limit as string, 10);
      if (isNaN(logLimit) || logLimit <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter. Must be a positive integer.'
        });
      }
    }

    const logs = pluginManager.getLogs(id, logLimit);

    res.json({
      success: true,
      data: {
        pluginId: id,
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get plugin logs', { pluginId: id, error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to get plugin logs' });
  }
});

/**
 * DELETE /api/office/plugins/:id/logs
 * 清除插件日志
 */
router.delete('/plugins/:id/logs', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const pluginManager = PluginManager.getInstance();

    logger.info('Clearing plugin logs', { pluginId: id });
    pluginManager.clearLogs(id);

    res.json({
      success: true,
      message: `Plugin logs cleared: ${id}`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to clear plugin logs', { pluginId: id, error: errorMessage });
    res.status(500).json({ success: false, error: 'Failed to clear plugin logs' });
  }
});

export default router;
