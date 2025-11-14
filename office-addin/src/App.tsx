import { useState, useEffect } from 'react';
import { MainInterface } from './components/MainInterface';
import { ChangeManager } from './services/ChangeManager';
import { HighlightManager } from './services/HighlightManager';
import './styles/App.css';

interface AppProps {
  hostType: Office.HostType;
}

function App({ hostType }: AppProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [changeManager] = useState(() => new ChangeManager());
  const [highlightManager] = useState(() => new HighlightManager());

  useEffect(() => {
    // 初始化Office.js
    Office.onReady(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <MainInterface
        changeManager={changeManager}
        highlightManager={highlightManager}
      />
    </div>
  );
}

export default App;
