import React from 'react';
import { useTimeBlockingStore } from './store';

interface TimeAuditProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  isExpanded: boolean;
  onToggle: () => void;
}

const TimeAudit: React.FC<TimeAuditProps> = ({ store, isExpanded, onToggle }) => {

  const getAuditData = () => {
    let days = 1;
    const now = new Date();
    
    if (store.timeFilter === 'all') {
      if (store.logs.length > 0) {
        const timestamps = store.logs.map(l => new Date(l.date).getTime());
        const start = Math.min(...timestamps);
        const end = Math.max(...timestamps);
        days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      }
    } else if (store.timeFilter === 'week') days = 7;
    else if (store.timeFilter === 'month') days = 30;
    else if (store.timeFilter === 'custom') {
      if (store.customStartDate && store.customEndDate) {
        const start = new Date(store.customStartDate);
        const end = new Date(store.customEndDate);
        days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    const totalHours = days * 24;
    const sleepHours = days * (store.sleepHoursPerDay || 0);
    
    const subjectHours: Record<string, number> = {};
    let totalLogged = 0;
    
    store.logs.forEach(log => {
      const logDate = new Date(log.date);
      let isMatch = false;
      
      if (store.timeFilter === 'all') {
        isMatch = true;
      } else if (store.timeFilter === 'today') {
        isMatch = logDate.toDateString() === now.toDateString();
      } else if (store.timeFilter === 'week') {
        isMatch = (now.getTime() - logDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      } else if (store.timeFilter === 'month') {
        isMatch = (now.getTime() - logDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      } else if (store.timeFilter === 'custom') {
        const y = logDate.getFullYear();
        const m = String(logDate.getMonth() + 1).padStart(2, '0');
        const d = String(logDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        isMatch = (!store.customStartDate || dateStr >= store.customStartDate) && 
                  (!store.customEndDate || dateStr <= store.customEndDate);
      }
      
      if (isMatch) {
        subjectHours[log.subjectId] = (subjectHours[log.subjectId] || 0) + log.hours;
        totalLogged += log.hours;
      }
    });

    const otherHours = Math.max(0, totalHours - sleepHours - totalLogged);
    
    return {
      totalHours,
      sleepHours: Math.round(sleepHours),
      subjectHours,
      totalLogged: Math.round(totalLogged),
      otherHours: Math.round(otherHours)
    };
  };

  const data = getAuditData();
  
  const renderBoxes = () => {
    const boxes: React.ReactNode[] = [];
    const { sleepHours, subjectHours, otherHours } = data;
    
    for (let i = 0; i < sleepHours; i++) {
      boxes.push(<div key={`s-${i}`} style={{ background: '#E2E8F0', width: '10px', height: '10px', borderRadius: '2px' }} />);
    }

    Object.entries(subjectHours).forEach(([subId, hours]) => {
      const subject = store.subjects.find(s => s.id === subId);
      const rounded = Math.round(hours);
      for (let i = 0; i < rounded; i++) {
        boxes.push(<div key={`l-${subId}-${i}`} style={{ background: subject?.color || '#38BDF8', width: '10px', height: '10px', borderRadius: '2px' }} />);
      }
    });

    for (let i = 0; i < otherHours; i++) {
      boxes.push(<div key={`o-${i}`} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', width: '8px', height: '8px', borderRadius: '2px' }} />);
    }
    
    return boxes;
  };

  return (
    <div className="tb-audit-section" style={{ padding: '1rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#334155', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
        {data.otherHours}h Left
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '1rem' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', cursor: 'pointer' }} onClick={onToggle}>
            Time Audit {isExpanded ? '▾' : '▸'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid #F1F5F9', paddingLeft: '0.8rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>avg sleep:</span>
            <input 
              type="number" step="0.5"
              value={store.sleepHoursPerDay || ''}
              onChange={e => store.setSleepHoursPerDay(parseFloat(e.target.value) || 0)}
              style={{ width: '40px', padding: '2px 4px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '0.8rem', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '0.6rem' }}>
            <span>{data.totalHours} Total Hours</span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '6px', height: '6px', background: '#E2E8F0', borderRadius: '1px' }} /> Sleep</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '6px', height: '6px', background: '#38BDF8', borderRadius: '1px' }} /> Logged</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><div style={{ width: '6px', height: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1px' }} /> Other</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxHeight: '150px', overflowY: 'auto' }} className="audit-grid minimal-scrollbar">
            {renderBoxes()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAudit;
