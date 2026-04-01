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

  const [editingBarKey, setEditingBarKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');

  if (!block || !subject) return null;

  const subjectLogs = store.logs.filter(l => l.subjectId === subject.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalHoursLogged = subjectLogs.reduce((acc, l) => acc + l.hours, 0);
  const totalBlocksPlaced = store.placedBlocks.filter(b => b.subjectId === subject.id).length;

  const dailyTotals: Record<string, { displayStr: string, hours: number, rawDateStr: string }> = {};
  subjectLogs.forEach(log => {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const displayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    if (!dailyTotals[key]) {
      dailyTotals[key] = { displayStr, hours: 0, rawDateStr: log.date };
    }
    dailyTotals[key].hours += log.hours;
  });

  const chartData = Object.entries(dailyTotals).map(([key, data]) => ({ key, ...data }));
  const maxHours = Math.max(...chartData.map(d => d.hours), 1);

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

        {chartData.length > 0 && (
          <div className="tb-chart-container">
            <h3 className="tb-history-title">Time Series</h3>
            <div style={{ marginTop: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '2px solid #F1F5F9' }}>
              <div style={{ position: 'relative', width: Math.max(320, chartData.length * 60) + 'px', height: '140px', margin: '0 auto' }}>
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                  {(() => {
                    const svgHeight = 140;
                    const paddingY = 25;
                    const paddingX = Math.max(320, chartData.length * 60) <= 320 ? 40 : 30;
                    const svgWidth = Math.max(320, chartData.length * 60);
                    
                    const getPoints = () => {
                      if (chartData.length === 1) return `${svgWidth / 2},${svgHeight - paddingY - (chartData[0].hours / maxHours) * (svgHeight - paddingY * 2)}`;
                      return chartData.map((data, i) => {
                        const x = paddingX + (i / (chartData.length - 1)) * (svgWidth - paddingX * 2);
                        const y = svgHeight - paddingY - (data.hours / maxHours) * (svgHeight - paddingY * 2);
                        return `${x},${y}`;
                      }).join(' ');
                    };
                    
                    return (
                      <>
                        <polyline 
                          fill="none" 
                          stroke={subject.color} 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          points={getPoints()}
                          style={{ filter: `drop-shadow(0 4px 6px ${subject.color}40)` }}
                        />
                        {chartData.map((data, i) => {
                          const x = chartData.length === 1 ? (svgWidth / 2) : paddingX + (i / (chartData.length - 1)) * (svgWidth - paddingX * 2);
                          const y = svgHeight - paddingY - (data.hours / maxHours) * (svgHeight - paddingY * 2);
                          
                          return (
                            <g key={data.key}>
                              <circle 
                                cx={x} cy={y} r="18" 
                                fill="transparent" 
                                cursor="pointer" 
                                onClick={() => {
                                  setEditingBarKey(data.key);
                                  setEditValue(data.hours.toString());
                                }}
                              />
                              <circle cx={x} cy={y} r="5" fill="white" stroke={subject.color} strokeWidth="2.5" style={{ pointerEvents: 'none' }} />
                              <text x={x} y={y - 14} fontSize="11" fill="#475569" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{data.hours}h</text>
                              <text x={x} y={svgHeight - 2} fontSize="10" fill="#94A3B8" fontWeight="600" textAnchor="middle" style={{ pointerEvents: 'none' }}>{data.displayStr}</text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* Edit Overlay Input */}
                {editingBarKey && (() => {
                    const svgHeight = 140;
                    const paddingY = 25;
                    const paddingX = Math.max(320, chartData.length * 60) <= 320 ? 40 : 30;
                    const svgWidth = Math.max(320, chartData.length * 60);
                    
                    return (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {chartData.map((data, i) => {
                           if (editingBarKey !== data.key) return null;
                           const x = chartData.length === 1 ? (svgWidth / 2) : paddingX + (i / (chartData.length - 1)) * (svgWidth - paddingX * 2);
                           const y = svgHeight - paddingY - (data.hours / maxHours) * (svgHeight - paddingY * 2);
                           return (
                             <input 
                               key="edit"
                               autoFocus
                               type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)}
                               onBlur={() => {
                                 const val = parseFloat(editValue);
                                 if (!isNaN(val) && val >= 0) store.updateDailyLogHours(subject.id, data.key, val);
                                 setEditingBarKey(null);
                               }}
                               onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                               style={{ position: 'absolute', left: x - 25, top: Math.max(0, y - 45), width: '50px', pointerEvents: 'auto', textAlign: 'center', fontSize: '0.85rem', padding: '4px', borderRadius: '6px', border: `2px solid ${subject.color}`, outline: 'none', background: 'white', color: '#0F172A', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                             />
                           );
                        })}
                      </div>
                    );
                })()}

              </div>
            </div>
          </div>
        )}

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
