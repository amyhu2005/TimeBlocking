import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';
import SubjectEditModal from './SubjectEditModal';

const BlockBank: React.FC<{ store: ReturnType<typeof useTimeBlockingStore> }> = ({ store }) => {
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(0); // 0: Idle, 1: Sure?, 2: REALLY sure?
  const [isExpanded, setIsExpanded] = useState(true);

  if (store.subjects.length === 0) return null;

  const executeClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const keys = ['tb_subjects', 'tb_logs', 'tb_blocks', 'tb_timefilt', 'tb_cstart', 'tb_cend', 'tb_sleep'];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const handleStep1 = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmStep(1);
  };

  return (
    <>
      <div className="tb-block-bank" onClick={e => e.stopPropagation()} style={{ 
        width: '260px',
        maxHeight: isExpanded ? '500px' : '48px', 
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        background: 'white',
        border: '1px solid #F1F5F9',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        boxSizing: 'border-box'
      }}>
        <div className="tb-bank-title" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'relative', 
          pointerEvents: 'auto',
          cursor: 'pointer',
          padding: '0.8rem 0.6rem',
          margin: '-0.4rem -0.2rem 0 -0.2rem',
          borderRadius: '8px',
          userSelect: 'none'
        }} onClick={() => setIsExpanded(!isExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem' }}>Your Bank</span>
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleStep1(e); }}
            title="Erase all data"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#EF4444', 
              padding: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              opacity: 0.5 
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          
          {confirmStep === 1 && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.2rem', borderRadius: '8px', zIndex: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #FCCAca', pointerEvents: 'auto' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setConfirmStep(2); }} 
                style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
              >Clear All</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setConfirmStep(0); }} 
                style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
              >No</button>
            </div>
          )}

          {confirmStep === 2 && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.2rem', borderRadius: '8px', zIndex: 30, boxShadow: '0 4px 12px rgba(220,38,38,0.1)', border: '1px solid #FCA5A5', pointerEvents: 'auto' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); executeClear(e); }} 
                style={{ background: '#B91C1C', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
              >ERASE</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setConfirmStep(0); }} 
                style={{ background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
              >BACK</button>
            </div>
          )}
        </div>

        <div className="tb-bank-list" style={{ 
          marginTop: '0.5rem',
          maxHeight: '235px', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.4rem',
          padding: '0 0.6rem 0.8rem 0.6rem',
          boxSizing: 'border-box',
          pointerEvents: 'auto'
        }}>
          {store.subjects.map(subject => {
            const unplaced = store.getUnplacedHours(subject.id);
            const isActive = store.activeSubjectId === subject.id;
            
            return (
              <div 
                key={subject.id} 
                className={`tb-bank-item ${isActive ? 'active' : ''}`}
                title={isActive ? "Click again to edit" : "Select Subject"}
                onClick={() => {
                  if (isActive) {
                    setEditingSubjectId(subject.id);
                  } else {
                    store.setActiveSubjectId(subject.id);
                  }
                }}
                style={{ 
                  borderLeftColor: subject.color, 
                  padding: '0.6rem 0.8rem', 
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                <div style={{ position: 'relative', width: '12px', height: '12px', borderRadius: '3px', overflow: 'hidden', backgroundColor: subject.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="color" 
                    defaultValue={subject.color}
                    onBlur={(e) => store.updateSubject(subject.id, subject.name, e.target.value)}
                    style={{ position: 'absolute', top: -10, left: -10, width: 40, height: 40, opacity: 0, cursor: 'pointer' }}
                    title="Change Color"
                  />
                </div>
                <div className="tb-subject-name" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject.name}</div>
                <div className="tb-unplaced-badge" style={{ fontSize: '0.75rem' }}>{unplaced}</div>
              </div>
            );
          })}
        </div>
      </div>


      {editingSubjectId && (
        <SubjectEditModal 
          store={store} 
          subjectId={editingSubjectId} 
          onClose={() => setEditingSubjectId(null)} 
        />
      )}
    </>
  );
};

export default BlockBank;
