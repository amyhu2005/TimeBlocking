import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';

interface LogSheetProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  onClose: () => void;
}

const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#9B59B6', '#FF8ED4', '#55E6C1'];

const LogSheet: React.FC<LogSheetProps> = ({ store, onClose }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [logHours, setLogHours] = useState(1);
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
    if (store.activeSubjectId && logHours > 0) {
      store.logTime(store.activeSubjectId, logHours);
      setLogHours(1);
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
            <div className="tb-color-picker">
              {PRESET_COLORS.map(color => (
                <button
                  key={color} type="button"
                  className={`tb-color-btn ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
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
                type="number" min="1" step="1"
                value={logHours}
                onChange={(e) => setLogHours(parseInt(e.target.value) || 1)}
                className="tb-input"
              />
              <span className="tb-label">Hours</span>
            </div>
            <button type="submit" className="tb-btn tb-btn-primary" disabled={!store.activeSubjectId || logHours < 1}>
              Log Hours
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LogSheet;
