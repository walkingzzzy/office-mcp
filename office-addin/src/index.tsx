import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// 确保Office.js已加载
Office.onReady((info) => {
  console.log('Office已就绪:', info);

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App hostType={info.host} />);
  }
});
