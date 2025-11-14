import React, { Suspense, lazy } from 'react';

// 懒加载组件包装器
export const LazyLoader = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <div>加载中...</div>
) => {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// 懒加载的组件
export const LazyExcelDiffViewer = LazyLoader(
  () => import('../components/ExcelDiffViewer'),
  <div className="loading-spinner">加载Excel对比器...</div>
);

export const LazyPowerPointDiffViewer = LazyLoader(
  () => import('../components/PowerPointDiffViewer'),
  <div className="loading-spinner">加载PowerPoint对比器...</div>
);

// 预加载函数
export const preloadComponent = (importFunc: () => Promise<any>) => {
  const componentImport = importFunc();
  return componentImport;
};

// 预加载关键组件
export const preloadCriticalComponents = () => {
  // 在应用启动时预加载关键组件
  preloadComponent(() => import('../components/ExcelDiffViewer'));
  preloadComponent(() => import('../components/PowerPointDiffViewer'));
};