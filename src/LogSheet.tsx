import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';

interface LogSheetProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  onClose: () => void;
}

const PRESET_COLORS = ['#F87171', '#2DD4BF', '#38BDF8', '#FBBF24', '#C084FC', '#4ADE80', '#F472B6', '#94A3B8'];

const LogSheet: React.FC<LogSheetProps> = ({ store, onClose }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [logHours, setLogHours] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'log' | 'create'>(store.subjects.length > 0 ? 'log' : 'create');

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    store.addSubject(newSubjectName.trim(), selectedColor);
    setNewSubjectName('');
    setActiveTab('log');
  };

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = typeof logHours === 'number' ? logHours : parseFloat(logHours);
    if (store.activeSubjectId && hours > 0) {
      store.logTime(store.activeSubjectId, hours);
      setLogHours('');
      onClose();
    }
  };

  return (
    <div className="tb-bottom-sheet-overlay" onClick={onClose}>
      <div className="tb-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="tb-sheet-handle"></div>
        <button className="tb-modal-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <div className="tb-tabs">
          {store.subjects.length > 0 && (
            <button className={`tb-tab ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>Log Time</button>
          )}
          <button className={`tb-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>New Subject</button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubject} className="tb-form tb-sheet-form">
            <input
              type="text"
              placeholder="Subject Name (e.g. Dance)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="tb-input"
            />
            <div className="tb-color-picker" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(color => (
                <button
                  key={color} type="button"
                  className={`tb-color-btn ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 0 0 2px #E2E8F0', flexShrink: 0 }}>
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{ position: 'absolute', top: '-10px', left: '-10px', width: '50px', height: '50px', cursor: 'pointer', border: 'none' }}
                  title="Custom Color"
                />
              </div>
            </div>
            <button type="submit" className="tb-btn tb-btn-primary" disabled={!newSubjectName.trim()}>Create Subject</button>
          </form>
        ) : (
          <form onSubmit={handleLogTime} className="tb-form tb-sheet-form">
            <select
              value={store.activeSubjectId || ''}
              onChange={(e) => store.setActiveSubjectId(e.target.value)}
              className="tb-select"
            >
              <option value="" disabled>Select Subject</option>
              {store.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="tb-row">
              <input
                type="number" min="0.5" step="0.5"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="tb-input"
                placeholder="0.0"
              />
              <span className="tb-label">Hours</span>
            </div>
            
            <button type="submit" className="tb-btn tb-btn-primary" disabled={!store.activeSubjectId || logHours === '' || logHours <= 0}>
              Log Hours
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LogSheet;
