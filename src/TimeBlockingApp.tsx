import React, { useState } from 'react';
import './TimeBlocking.css';
import GridCanvas from './GridCanvas';
import LogSheet from './LogSheet';
import BlockBank from './BlockBank';
import { useTimeBlockingStore } from './store';

const TimeBlockingApp: React.FC = () => {
  const store = useTimeBlockingStore();
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);

  return (
    <div className="timeblocking-container">
      <div className="timeblocking-main">
        <GridCanvas store={store} />
      </div>
      
      <BlockBank store={store} />

      <button className="tb-fab-log" onClick={() => setIsLogSheetOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span style={{marginLeft: '0.4rem', fontWeight: 600}}>Log Time</span>
      </button>

      {isLogSheetOpen && (
        <LogSheet store={store} onClose={() => setIsLogSheetOpen(false)} />
      )}
    </div>
  );
};

export default TimeBlockingApp;
