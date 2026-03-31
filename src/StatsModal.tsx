import React from 'react';
import { useTimeBlockingStore } from './store';

interface StatsModalProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  blockId: string;
  onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ store, blockId, onClose }) => {
  const block = store.placedBlocks.find(b => b.id === blockId);
  const subject = block ? store.subjects.find(s => s.id === block.subjectId) : null;

  if (!block || !subject) return null;

  const subjectLogs = store.logs.filter(l => l.subjectId === subject.id);
  const totalHoursLogged = subjectLogs.reduce((acc, l) => acc + l.hours, 0);
  const totalBlocksPlaced = store.placedBlocks.filter(b => b.subjectId === subject.id).length;

  const handleRemoveBlock = () => {
    store.removeBlock(blockId);
    onClose();
  };

  return (
    <div className="tb-modal-overlay" onClick={onClose}>
      <div 
        className="tb-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ borderTop: `6px solid ${subject.color}` }}
      >
        <button className="tb-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="tb-modal-header">
          <h2 style={{ color: subject.color }}>{subject.name} Highlights</h2>
          <p className="tb-modal-subtitle">Block History & Trends</p>
        </div>

        <div className="tb-stats-grid">
          <div className="tb-stat-card">
            <div className="tb-stat-value">{totalHoursLogged}</div>
            <div className="tb-stat-label">Total Hrs Logged</div>
          </div>
          <div className="tb-stat-card">
            <div className="tb-stat-value">{totalBlocksPlaced}</div>
            <div className="tb-stat-label">Blocks Placed</div>
          </div>
        </div>

        <div className="tb-history-list">
          <h3 className="tb-history-title">Recent Logs</h3>
          {subjectLogs.slice().reverse().slice(0, 5).map(log => (
            <div key={log.id} className="tb-history-item">
              <div className="tb-history-date">
                {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="tb-history-hours">
                +{log.hours} {log.hours === 1 ? 'hr' : 'hrs'}
              </div>
            </div>
          ))}
          {subjectLogs.length === 0 && (
            <div className="tb-history-empty">No logs yet...</div>
          )}
        </div>

        <div className="tb-modal-actions">
          <button className="tb-btn tb-btn-danger" onClick={handleRemoveBlock}>
            Remove Block from Grid
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
