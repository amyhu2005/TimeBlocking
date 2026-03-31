import React from 'react';
import { useTimeBlockingStore } from './store';

const BlockBank: React.FC<{ store: ReturnType<typeof useTimeBlockingStore> }> = ({ store }) => {
  if (store.subjects.length === 0) return null;

  return (
    <div className="tb-block-bank">
      <div className="tb-bank-title">Your Bank</div>
      {store.subjects.map(subject => {
        const unplaced = store.getUnplacedHours(subject.id);
        const isActive = store.activeSubjectId === subject.id;
        
        return (
          <div 
            key={subject.id} 
            className={`tb-bank-item ${isActive ? 'active' : ''}`}
            onClick={() => store.setActiveSubjectId(subject.id)}
            style={{ borderLeftColor: subject.color }}
          >
            <div className="tb-subject-dot" style={{ backgroundColor: subject.color }}></div>
            <div className="tb-subject-name">{subject.name}</div>
            <div className="tb-unplaced-badge">{unplaced}</div>
          </div>
        );
      })}
    </div>
  );
};

export default BlockBank;
