import React, { useRef, useState } from 'react';
import { useTimeBlockingStore } from './store';
import html2canvas from 'html2canvas';

// Helper to format date
const formatDate = (date: Date) => date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

interface ShareCardProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ store, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FCFCFC',
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `TimeBlocking-Export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
    setIsExporting(false);
  };

  // Determine time range bounds based on filter
  let startDate = new Date();
  let endDate = new Date();
  
  if (store.timeFilter === 'all') {
    if (store.logs.length > 0) {
      const timestamps = store.logs.map(l => new Date(l.date).getTime());
      startDate = new Date(Math.min(...timestamps));
      endDate = new Date(Math.max(...timestamps));
      // Ensure at least a 2-day span realistically
      if (startDate.toDateString() === endDate.toDateString()) {
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() + 1);
      }
    } else {
      startDate.setDate(startDate.getDate() - 6); // default 1 week fallback
    }
  } else if (store.timeFilter === 'week') {
    startDate.setDate(startDate.getDate() - 6);
  } else if (store.timeFilter === 'month') {
    startDate.setDate(startDate.getDate() - 29);
  } else if (store.timeFilter === 'custom' && store.customStartDate && store.customEndDate) {
    const [sy, sm, sd] = store.customStartDate.split('-');
    startDate = new Date(parseInt(sy, 10), parseInt(sm, 10)-1, parseInt(sd, 10));
    const [ey, em, ed] = store.customEndDate.split('-');
    endDate = new Date(parseInt(ey, 10), parseInt(em, 10)-1, parseInt(ed, 10));
  } else {
    // Default 'today' handled automatically since startDate and endDate init to today
  }
  
  startDate.setHours(0,0,0,0);
  endDate.setHours(23,59,59,999);

  // SVG Line Graph Dimensions
  const svgWidth = 600;
  const svgHeight = 200;
  const padding = 35;

  // Trend Analysis Date Range (Matches active filter scope)
  const daysInRange = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const trendStartDate = new Date(startDate);
  const trendDaysInRange = daysInRange;
  const trendDates = Array.from({ length: trendDaysInRange }, (_, i) => {
    const d = new Date(trendStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Calculate daily totals for line graph
  let maxHours = 1; // minimum 1 for scale
  const subjectData = store.subjects.map(subject => {
    const dailyHours = trendDates.map(d => {
      const dayY = d.getFullYear(); const dayM = d.getMonth(); const dayD = d.getDate();
      const logsForDay = store.logs.filter(l => {
        if (l.subjectId !== subject.id) return false;
        const ld = new Date(l.date);
        return ld.getFullYear() === dayY && ld.getMonth() === dayM && ld.getDate() === dayD;
      });
      const sum = logsForDay.reduce((a, b) => a + b.hours, 0);
      if (sum > maxHours) maxHours = sum;
      return sum;
    });
    return { subject, dailyHours };
  });

  // Calculate Points for Polyline
  const getPoints = (hoursArray: number[]) => {
    return hoursArray.map((hours, i) => {
      const x = padding + (i / Math.max(1, trendDaysInRange - 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (hours / maxHours) * (svgHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  };

  // Grid Preview bounds
  const validBlocks = store.placedBlocks.filter(b => {
    if (!b.date) return store.timeFilter === 'all';
    const bd = new Date(b.date);
    return bd >= startDate && bd <= endDate;
  });

  let minX = 0; let minY = 0; let maxX = 0; let maxY = 0;
  if (validBlocks.length > 0) {
    minX = Math.min(...validBlocks.map(b => b.gridX)) - 4;
    maxX = Math.max(...validBlocks.map(b => b.gridX)) + 4;
    minY = Math.min(...validBlocks.map(b => b.gridY)) - 4;
    maxY = Math.max(...validBlocks.map(b => b.gridY)) + 4;
  }
  const gridW = Math.max(1, maxX - minX + 1);
  const gridH = Math.max(1, maxY - minY + 1);
  const cellPreview = Math.min(400 / gridW, 300 / gridH, 30); // max 30px per cell

  return (
    <div className="tb-modal-overlay tb-share-overlay" onClick={onClose} style={{zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="tb-share-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', width: '95%', maxWidth: '750px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        
        <div className="tb-share-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{margin:0, fontSize: '1.4rem', color: 'var(--tb-text)', fontWeight: 800}}>Export Graphic</h2>
          <div style={{display: 'flex', gap: '0.8rem'}}>
            <button className="tb-btn tb-btn-primary" onClick={handleExport} disabled={isExporting} style={{padding: '0.6rem 1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}}>
              {isExporting ? 'Generating PNG...' : 'Download Image'}
            </button>
            <button className="tb-modal-close" style={{position: 'static', background: '#F1F5F9'}} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          This graphic captures your currently selected time range filter ({store.timeFilter}). 
        </p>
        
        {/* The Card to actually capture */}
        <div className="tb-share-card-wrapper" style={{ overflow: 'auto', maxHeight: '65vh', background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div ref={cardRef} id="share-card" className="tb-share-card" style={{
            width: '680px',
            background: 'white',
            borderRadius: '24px',
            padding: '3rem',
            margin: '0 auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
            color: '#2D3748',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
          }}>
            
            {/* Header */}
            <div style={{ borderBottom: '2px solid #F1F5F9', paddingBottom: '1.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>Time Log Summary</h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748B', fontSize: '1.2rem', fontWeight: 600 }}>
                {formatDate(startDate)} — {formatDate(endDate)}
              </p>
            </div>

            {/* Grid Map Preview & Totals Key Sidebar */}
            {validBlocks.length > 0 ? (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1.5px', fontWeight: 700 }}>
                  Activity Grid <span style={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>(1 Block = 1 Hour)</span>
                </h3>
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
                  
                  <div style={{
                    position: 'relative',
                    width: `${gridW * cellPreview}px`,
                    height: `${gridH * cellPreview}px`,
                    margin: '0',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
                      backgroundSize: `${cellPreview}px ${cellPreview}px`, opacity: 0.5
                    }}/>
                    {validBlocks.map(block => {
                      const sub = store.subjects.find(s => s.id === block.subjectId);
                      return (
                        <div key={block.id} style={{
                          position: 'absolute',
                          left: (block.gridX - minX) * cellPreview,
                          top: (block.gridY - minY) * cellPreview,
                          width: cellPreview,
                          height: cellPreview,
                          backgroundColor: sub?.color || '#CBD5E1',
                          borderRadius: `${Math.max(2, cellPreview * 0.15)}px`,
                          boxShadow: `0 2px 8px ${(sub?.color || '#000000')}30`
                        }}/>
                      );
                    })}
                  </div>

                  {/* Totals Key Sidebar */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Hours</h4>
                    {store.subjects.map(s => {
                      const hoursForSubject = store.logs
                        .filter(l => l.subjectId === s.id)
                        .filter(l => {
                          const d = new Date(l.date);
                          return d >= startDate && d <= endDate;
                        })
                        .reduce((sum, l) => sum + l.hours, 0);

                      if (hoursForSubject === 0) return null;

                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: s.color }} />
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{hoursForSubject}h</span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: '#94A3B8', fontWeight: 500 }}>
                  No blocks placed in this time range.
                </div>
            )}

            {/* SVG Line Graph */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1.5px', fontWeight: 700 }}>Trend Analysis (Hours)</h3>
              <div style={{ position: 'relative' }}>
                  <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible', background: 'white' }}>
                    {/* Y Axis Grid lines */}
                    {[0, 0.5, 1].map(ratio => {
                      const yPos = padding + ratio * (svgHeight - padding*2);
                      const labelVal = Math.round(maxHours * (1 - ratio));
                      return (
                        <g key={ratio}>
                          <line x1={padding} y1={yPos} x2={svgWidth - padding} y2={yPos} stroke="#F1F5F9" strokeWidth="2" strokeDasharray="4 4" />
                          {ratio !== 1 && <text x={padding - 5} y={yPos + 4} fontSize="11" fill="#94A3B8" textAnchor="end" fontWeight="500">{labelVal}h</text>}
                        </g>
                      );
                    })}
                    
                    {/* Lines */}
                    {subjectData.map((data) => (
                      <polyline 
                        key={data.subject.id} 
                        fill="none" 
                        stroke={data.subject.color} 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        points={getPoints(data.dailyHours)}
                        style={{ filter: `drop-shadow(0 4px 6px ${data.subject.color}33)` }}
                      />
                    ))}

                    {/* X Axis Labels */}
                    {trendDates.map((d, i) => {
                      const showLabel = trendDaysInRange <= 14 
                        ? true 
                        : (i === 0 || i === trendDates.length - 1 || i === Math.floor(trendDates.length / 2));
                      if (showLabel) {
                        return <text key={i} x={padding + (i / Math.max(1, trendDaysInRange - 1)) * (svgWidth - padding * 2)} y={svgHeight - padding + 22} fontSize="11" fill="#94A3B8" textAnchor="middle" fontWeight="500">{formatDate(d)}</text>;
                      }
                      return null;
                    })}
                  </svg>
              </div>
            </div>

            {/* Footer Logo */}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                  <rect width="64" height="64" rx="20" fill="white" />
                  <rect x="2" y="2" width="60" height="60" rx="18" fill="white" stroke="#F1F5F9" strokeWidth="2"/>
                  <rect x="14" y="14" width="14" height="14" rx="4" fill="#F87171" style={{filter: 'drop-shadow(0px 2px 3px rgba(248,113,113,0.4))'}} />
                  <rect x="36" y="14" width="14" height="14" rx="4" fill="#2DD4BF" style={{filter: 'drop-shadow(0px 2px 3px rgba(45,212,191,0.4))'}} />
                  <rect x="14" y="36" width="14" height="14" rx="4" fill="#38BDF8" style={{filter: 'drop-shadow(0px 2px 3px rgba(56,189,248,0.4))'}} />
                  <rect x="36" y="36" width="14" height="14" rx="4" fill="#FBBF24" style={{filter: 'drop-shadow(0px 2px 3px rgba(251,191,36,0.4))'}} />
                </svg>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#000000', letterSpacing: '-0.3px' }}>TimeBlock</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ShareCard;
