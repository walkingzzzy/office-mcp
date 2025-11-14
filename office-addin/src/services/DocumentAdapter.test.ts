import DocumentAdapter from './DocumentAdapter';

describe('DocumentAdapter单元测试', () => {
  beforeEach(() => {
    // 重置单例实例
    (DocumentAdapter as any).instance = null;
  });

  describe('getInstance', () => {
    test('应该为Word返回WordAPI实例', () => {
      (global.Office as any).context = { host: Office.HostType.Word };

      const instance = DocumentAdapter.getInstance();
      expect(instance).toBeDefined();
      expect(DocumentAdapter.getInstance()).toBe(instance); // 验证单例模式
    });

    test('应该为Excel返回ExcelAPI实例', () => {
      (global.Office as any).context = { host: Office.HostType.Excel };
      (DocumentAdapter as any).instance = null;

      const instance = DocumentAdapter.getInstance();
      expect(instance).toBeDefined();
    });

    test('应该为PowerPoint返回PowerPointAPI实例', () => {
      (global.Office as any).context = { host: Office.HostType.PowerPoint };
      (DocumentAdapter as any).instance = null;

      const instance = DocumentAdapter.getInstance();
      expect(instance).toBeDefined();
    });

    test('应该抛出错误对于不支持的应用类型', () => {
      (global.Office as any).context = { host: 'Unknown' };
      (DocumentAdapter as any).instance = null;

      expect(() => {
        DocumentAdapter.getInstance();
      }).toThrow('不支持的Office应用类型');
    });

    test('应该返回相同的实例(单例模式)', () => {
      (global.Office as any).context = { host: Office.HostType.Word };
      (DocumentAdapter as any).instance = null;

      const instance1 = DocumentAdapter.getInstance();
      const instance2 = DocumentAdapter.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('isSupported', () => {
    test('应该返回true对于Word', () => {
      (global.Office as any).context = { host: Office.HostType.Word };
      expect(DocumentAdapter.isSupported()).toBe(true);
    });

    test('应该返回true对于Excel', () => {
      (global.Office as any).context = { host: Office.HostType.Excel };
      expect(DocumentAdapter.isSupported()).toBe(true);
    });

    test('应该返回true对于PowerPoint', () => {
      (global.Office as any).context = { host: Office.HostType.PowerPoint };
      expect(DocumentAdapter.isSupported()).toBe(true);
    });

    test('应该返回false对于不支持的应用', () => {
      (global.Office as any).context = { host: 'Outlook' };
      expect(DocumentAdapter.isSupported()).toBe(false);
    });
  });

  describe('getHostName', () => {
    test('应该返回"Word"对于Word应用', () => {
      (global.Office as any).context = { host: Office.HostType.Word };
      expect(DocumentAdapter.getHostName()).toBe('Word');
    });

    test('应该返回"Excel"对于Excel应用', () => {
      (global.Office as any).context = { host: Office.HostType.Excel };
      expect(DocumentAdapter.getHostName()).toBe('Excel');
    });

    test('应该返回"PowerPoint"对于PowerPoint应用', () => {
      (global.Office as any).context = { host: Office.HostType.PowerPoint };
      expect(DocumentAdapter.getHostName()).toBe('PowerPoint');
    });

    test('应该返回"未知"对于未知应用', () => {
      (global.Office as any).context = { host: 'Unknown' };
      expect(DocumentAdapter.getHostName()).toBe('未知');
    });
  });
});
