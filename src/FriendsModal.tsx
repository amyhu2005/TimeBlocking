import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';

interface FriendsModalProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  onClose: () => void;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ store, onClose }) => {
  const [friendSearch, setFriendSearch] = useState('');
  const [viewingFriendId, setViewingFriendId] = useState<string | null>(null);
  const [friendFilter, setFriendFilter] = useState<'week' | 'month' | 'year'>('year');
  const [friendData, setFriendData] = useState<{ logs: any[], subjects: any[], blocks: any[] } | null>(null);

  React.useEffect(() => {
    if (viewingFriendId) {
      store.fetchFriendStats(viewingFriendId).then(setFriendData);
    } else {
      setFriendData(null);
    }
  }, [viewingFriendId, store]);

  if (!store.isLoggedIn) return null;

  const handleAddFriend = async () => {
    if (friendSearch.trim()) {
      const res = await store.addFriendRequest(friendSearch.trim());
      if (res.success) {
        alert(`Request sent to ${friendSearch}!`);
        setFriendSearch('');
      } else {
        alert(res.message);
      }
    }
  };

  const renderFriendGrid = () => {
    if (!friendData) return null;
    
    // 1. Filter blocks by friendFilter
    const now = new Date();
    const filteredBlocks = friendData.blocks?.filter(b => {
      const d = b.date ? new Date(b.date) : new Date(0);
      if (friendFilter === 'week') return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      if (friendFilter === 'month') return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
      return true; // 'all'
    });

    if (!filteredBlocks || filteredBlocks.length === 0) {
      return (
        <div style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '2rem', borderRadius: '16px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>No blocks logged in this period.</p>
        </div>
      );
    }

    // 2. Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    filteredBlocks.forEach(b => {
      if (b.gridX < minX) minX = b.gridX;
      if (b.gridX > maxX) maxX = b.gridX;
      if (b.gridY < minY) minY = b.gridY;
      if (b.gridY > maxY) maxY = b.gridY;
    });

    // Add 4 block margin
    const startX = minX - 4;
    const endX = maxX + 4;
    const startY = minY - 4;
    const endY = maxY + 4;

    const cols = endX - startX + 1;
    const rows = endY - startY + 1;
    
    return (
      <div style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem' }}>Friend's Map</h4>
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }} className="minimal-scrollbar">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${cols}, 14px)`, 
            gridTemplateRows: `repeat(${rows}, 14px)`, 
            gap: '1px',
            background: '#FFFFFF',
            padding: '4px',
            borderRadius: '8px',
            width: 'fit-content',
            margin: '0 auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const x = startX + (i % cols);
              const y = startY + Math.floor(i / cols);
              
              const block = filteredBlocks.find(b => b.gridX === x && b.gridY === y);
              const subject = block ? friendData.subjects?.find(s => s.id === block.subjectId) : null;
              
              let backgroundColor = '#F8FAFC';
              if (subject) backgroundColor = subject.color;
              else if (x >= minX && x <= maxX && y >= minY && y <= maxY) backgroundColor = 'white';
              
              return (
                <div 
                  key={i} 
                  style={{ 
                    background: backgroundColor,
                    borderRadius: '1px',
                    width: '14px',
                    height: '14px'
                  }} 
                />
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700 }}>
           <span>Auto-Zoom View</span>
           <span>•</span>
           <span>4-Block Margin</span>
        </div>
      </div>
    );
  };

  const renderFriendData = (friendId: string) => {
    const profile = store.friends.find(f => f.id === friendId);
    if (!profile || !friendData) return <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Loading stats...</div>;

    // Filter logs based on friendFilter
    const now = new Date();
    const filteredLogs = friendData.logs.filter(l => {
      const d = new Date(l.date);
      if (friendFilter === 'week') return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      if (friendFilter === 'month') return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
      return true; // 'year' / all time
    });

    const totalHours = filteredLogs.reduce((sum, l) => sum + l.hours, 0);
    
    return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {(['week', 'month', 'all'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFriendFilter(f === 'all' ? 'year' : (f as any))} 
              style={{ 
                padding: '0.4rem 1.25rem', 
                borderRadius: '20px', 
                border: 'none', 
                fontSize: '0.75rem', 
                fontWeight: 800,
                background: (f === 'all' ? friendFilter === 'year' : friendFilter === f) ? '#1E293B' : '#F1F5F9',
                color: (f === 'all' ? friendFilter === 'year' : friendFilter === f) ? 'white' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #F1F5F9' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>{totalHours.toFixed(1)}h</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>Logged in {friendFilter === 'year' ? 'all time' : friendFilter}</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {friendData.subjects.map(s => {
              const subLogs = filteredLogs.filter(l => l.subject_id === s.id);
              const subHours = subLogs.reduce((sum, l) => sum + l.hours, 0);
              if (subHours === 0) return null;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: `3px solid ${s.color}`, padding: '0.2rem 0.6rem', background: 'white', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  {s.name} <span style={{ color: '#94A3B8' }}>{subHours.toFixed(0)}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {renderFriendGrid()}
      </div>
    );
  };

  const currentUsername = store.currentUser?.user_metadata?.username || 'User';

  return (
    <div className="tb-modal-overlay" onClick={onClose}>
      <div className="tb-modal" onClick={e => e.stopPropagation()} style={{ 
        height: '80vh', 
        maxWidth: '500px',
        width: '95%',
        borderRadius: '24px',
        padding: '1.5rem 2rem',
        display: 'flex', 
        flexDirection: 'column', 
        background: 'white', 
        color: '#1E293B' 
      }}>
        <button className="tb-modal-close" onClick={onClose} style={{ color: '#64748B', top: '1.5rem', right: '1.5rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tb-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
              {currentUsername[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{currentUsername}</h2>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>• Account Active</span>
            </div>
          </div>
          <button 
            onClick={() => { store.logout(); onClose(); }}
            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>

        {viewingFriendId ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <button onClick={() => setViewingFriendId(null)} style={{ background: 'none', border: 'none', color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ← Back to Friends
            </button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center' }}>{store.friends.find(f => f.id === viewingFriendId)?.name}</h3>
            {renderFriendData(viewingFriendId)}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" placeholder="Add friend by name..." 
                value={friendSearch} onChange={e => setFriendSearch(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', background: '#F8FAFC', color: '#1E293B' }}
              />
              <button onClick={handleAddFriend} style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '10px', padding: '0 1.2rem', fontWeight: 700, fontSize: '0.8rem' }}>Add</button>
            </div>

            {store.pendingRequests.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Pending Requests</h4>
                {store.pendingRequests.map(req => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '10px', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.name}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => store.acceptRequest(req.id)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 800 }}>Accept</button>
                      <button onClick={() => store.rejectRequest(req.id)} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 800 }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Your Friends ({store.friends.length})</h4>
            <div style={{ flex: 1, overflowY: 'auto' }} className="minimal-scrollbar">
              {store.friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
                  <p style={{ fontSize: '0.8rem' }}>No friends yet. Add some!</p>
                </div>
              ) : (
                store.friends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => setViewingFriendId(friend.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderRadius: '12px', border: '1px solid #F1F5F9', marginBottom: '0.5rem', cursor: 'pointer', background: '#FFFFFF' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>👤</div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{friend.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); store.removeFriend(friend.id); }}
                      style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.7rem', padding: '0.5rem' }}
                    >Remove</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsModal;
