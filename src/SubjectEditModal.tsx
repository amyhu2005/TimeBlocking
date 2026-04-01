import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';

interface SubjectEditModalProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  subjectId: string;
  onClose: () => void;
}

const PRESET_COLORS = ['#F87171', '#2DD4BF', '#38BDF8', '#FBBF24', '#C084FC', '#4ADE80', '#F472B6', '#94A3B8'];

const SubjectEditModal: React.FC<SubjectEditModalProps> = ({ store, subjectId, onClose }) => {
  const subject = store.subjects.find(s => s.id === subjectId);
  if (!subject) return null;

  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);
  const [hoursDelta, setHoursDelta] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  const handleSave = () => {
    if (name.trim() !== '' && color !== '') {
      store.updateSubject(subject.id, name.trim(), color);
    }
    if (hoursDelta !== 0) {
      store.adjustUnplacedHours(subject.id, hoursDelta, targetDate);
    }
    onClose();
  };

  const unplaced = store.getUnplacedHours(subject.id);

  return (
    <div className="tb-modal-overlay" onClick={onClose} style={{ zIndex: 150 }}>
      <div className="tb-modal-content" onClick={e => e.stopPropagation()} style={{ borderTop: `6px solid ${color}`, maxWidth: '320px' }}>
        <button className="tb-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="tb-modal-header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--tb-text)' }}>Edit Subject</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--tb-text-muted)', marginBottom: '0.5rem' }}>Title</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="tb-input" 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--tb-text-muted)', marginBottom: '0.5rem' }}>Color</label>
            <div className="tb-color-picker" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`tb-color-btn ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 0 0 2px #E2E8F0', flexShrink: 0 }}>
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  style={{ position: 'absolute', top: '-10px', left: '-10px', width: '50px', height: '50px', cursor: 'pointer', border: 'none' }}
                  title="Custom Color"
                />
              </div>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid var(--tb-border)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--tb-text-muted)', marginBottom: '0.5rem' }}>Adjust Unplaced Hours (Current: {unplaced})</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setHoursDelta(d => Number((d - 0.5).toFixed(1)))}
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '1.4rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >-</button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: hoursDelta === 0 ? 'var(--tb-text)' : (hoursDelta > 0 ? '#10B981' : '#EF4444') }}>
                {hoursDelta > 0 ? `+${hoursDelta}h` : `${hoursDelta}h`}
              </div>
              <button 
                onClick={() => setHoursDelta(d => Number((d + 0.5).toFixed(1)))}
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >+</button>
            </div>
            
            <div style={{ marginTop: '0.8rem' }}>
               <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--tb-text-muted)', marginBottom: '0.3rem' }}>Assign to Date</label>
               <input 
                 type="date"
                 value={targetDate}
                 onChange={(e) => setTargetDate(e.target.value)}
                 className="tb-input"
                 style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
               />
            </div>
            <p style={{ margin: '0.6rem 0 0 0', fontSize: '0.75rem', color: 'var(--tb-text-muted)', lineHeight: 1.4 }}>
              Tip: Accidentally logged an hour? Use the "-" button to quickly balance your bank!
            </p>
          </div>

          <button className="tb-btn tb-btn-primary" onClick={handleSave} style={{ marginTop: '0.5rem' }}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubjectEditModal;
