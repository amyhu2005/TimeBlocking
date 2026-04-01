import React, { useState } from 'react';
import './TimeBlocking.css';
import GridCanvas from './GridCanvas';
import LogSheet from './LogSheet';
import BlockBank from './BlockBank';
import AuthModal from './AuthModal';
import ShareCard from './ShareCard';
import TimeAudit from './TimeAudit';
import FriendsModal from './FriendsModal';
import HelpModal from './HelpModal';
import { useTimeBlockingStore } from './store';

const TimeBlockingApp: React.FC = () => {
  const store = useTimeBlockingStore();
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showHomePrompt, setShowHomePrompt] = useState(false);

  const isAnyModalOpen = isLogSheetOpen || isShareOpen || isFriendsOpen || isHelpOpen || isAuthOpen || !!selectedBlockId;

  React.useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('hasSeenHomePrompt');
    if (!hasSeenPrompt && window.innerWidth < 600) {
      setShowHomePrompt(true);
    }
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem('hasSeenHomePrompt', 'true');
    setShowHomePrompt(false);
  };

  const downloadDataTxt = () => {
    const groupedByDate: Record<string, Record<string, number>> = {};
    store.logs.forEach(l => {
      const dateStr = l.date.split('T')[0];
      if (!groupedByDate[dateStr]) groupedByDate[dateStr] = {};
      const subName = store.subjects.find(s => s.id === l.subjectId)?.name || l.subjectId;
      groupedByDate[dateStr][subName] = (groupedByDate[dateStr][subName] || 0) + l.hours;
    });

    const sortedDates = Object.keys(groupedByDate).sort();
    let txtContent = "TimeBlocking Data Export\n========================\n\n";

    sortedDates.forEach(date => {
      txtContent += `${date}:\n`;
      const subjectsForDate = groupedByDate[date];
      Object.entries(subjectsForDate).forEach(([sub, hours]) => {
        txtContent += `  - ${sub}: ${hours}h\n`;
      });
      txtContent += `\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TimeBlocking-Data-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="timeblocking-container">
      <div className="timeblocking-main">
        <GridCanvas
          store={store}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />
      </div>



      {store.timeFilter === 'custom' && !isAnyModalOpen && isSearchExpanded && (
        <div className="tb-custom-date-picker">
          <div className="tb-date-input-group">
            <label>From</label>
            <input
              type="date"
              value={store.customStartDate}
              onChange={e => store.setCustomStartDate(e.target.value)}
              className="tb-date-input"
            />
          </div>
          <div className="tb-date-input-group">
            <label>To</label>
            <input
              type="date"
              value={store.customEndDate}
              onChange={e => store.setCustomEndDate(e.target.value)}
              className="tb-date-input"
            />
          </div>
        </div>
      )}

      {!isAnyModalOpen && (
        <BlockBank store={store} />
      )}

      {!isAnyModalOpen && (
        <div className="tb-sidebar-tools">
          <button className="tb-fab-account" onClick={() => setIsAuthOpen(true)} title="Account" style={{ width: '42px', height: '42px', borderRadius: '12px', background: store.isLoggedIn ? 'var(--tb-text)' : 'white', color: store.isLoggedIn ? 'white' : '#334155', border: '1.5px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {store.isLoggedIn ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{store.currentUser?.user_metadata?.username?.[0].toUpperCase() || 'U'}</span>
              </div>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            )}
          </button>

          <button className="tb-fab-share" onClick={() => setIsShareOpen(true)} title="Export Chart" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'white', border: '1.5px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>

          <button className="tb-fab-friends" onClick={() => store.isLoggedIn ? setIsFriendsOpen(true) : setIsAuthOpen(true)} title="Friends" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'white', border: '1.5px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={store.isLoggedIn ? "#334155" : "#CBD5E1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            {!store.isLoggedIn && <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', borderRadius: '50%', background: '#F87171', border: '2px solid white' }} />}
          </button>

          <button className="tb-fab-help" onClick={() => setIsHelpOpen(true)} title="How to Use" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'white', border: '1.5px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
            ?
          </button>

          <div className="tb-search-container" 
            style={{ 
              width: isSearchExpanded ? '320px' : '42px', 
              height: '42px', 
              overflow: 'hidden', 
              borderRadius: '12px',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'white',
              border: '1.5px solid #F1F5F9',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              cursor: isSearchExpanded ? 'default' : 'pointer',
              boxSizing: 'border-box'
            }} 
            onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', position: 'relative' }}>
              {isSearchExpanded && (
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '0.8rem', paddingRight: '42px', width: 'calc(100% - 42px)' }}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={store.searchQuery}
                    onChange={e => store.setSearchQuery(e.target.value)}
                    autoFocus
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid #F1F5F9', paddingLeft: '0.8rem', marginLeft: '0.8rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Filter:</span>
                    <select
                      value={store.timeFilter}
                      onChange={e => store.setTimeFilter(e.target.value as any)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="custom">Select Time Range</option>
                    </select>
                  </div>
                </div>
              )}
              <div style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 0 }}>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  onClick={(e) => { if (isSearchExpanded) { e.stopPropagation(); setIsSearchExpanded(false); } }}
                >
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
          </div>
          {showHomePrompt && (
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', color: '#1E293B', padding: '2rem', borderRadius: '24px', zIndex: 2000, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)', width: '85%', maxWidth: '320px', textAlign: 'center', fontWeight: 800 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
              <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>for optimal mobile usage: add to homescreen</p>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, lineHeight: '1.4' }}>
                press share icon <span style={{ fontSize: '1.1rem', verticalAlign: 'middle' }}>⎋</span> and then <br /> press "add to homescreen"
              </p>
              <button
                onClick={dismissPrompt}
                style={{ background: '#F87171', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 2rem', fontWeight: 800, cursor: 'pointer', width: '100%' }}
              >
                Got it!
              </button>
            </div>
          )}


          {!isAuditExpanded && (
            <>
              <div className="tb-save-container" style={{ position: 'fixed', bottom: '4rem', left: '1rem', zIndex: 100 }}>
                <button className="tb-save-btn" onClick={downloadDataTxt} style={{ padding: '0.7rem 1rem', background: '#10B981', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                  💾 Save TXT
                </button>
              </div>

              <div className="tb-log-container" style={{ position: 'fixed', bottom: '4rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
                <button onClick={() => setIsLogSheetOpen(true)} style={{ pointerEvents: 'auto', padding: '0.8rem 1.5rem', background: '#1E293B', color: 'white', borderRadius: '30px', border: 'none', fontWeight: 800, boxShadow: '0 8px 24px rgba(45, 55, 72, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Log Time
                </button>
              </div>
            </>
          )}

          <div className="tb-audit-container" style={{ position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: 90, padding: '0 1rem 1rem 1rem', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <TimeAudit
                store={store}
                isExpanded={isAuditExpanded}
                onToggle={() => setIsAuditExpanded(!isAuditExpanded)}
              />
            </div>
          </div>
        </div>
      )}

      {isLogSheetOpen && (
        <LogSheet store={store} onClose={() => setIsLogSheetOpen(false)} />
      )}

      {isShareOpen && (
        <ShareCard store={store} onClose={() => setIsShareOpen(false)} />
      )}

      {isFriendsOpen && (
        <FriendsModal store={store} onClose={() => setIsFriendsOpen(false)} />
      )}

      {isAuthOpen && (
        <AuthModal store={store} onClose={() => setIsAuthOpen(false)} />
      )}

      {isHelpOpen && (
        <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
};

export default TimeBlockingApp;
