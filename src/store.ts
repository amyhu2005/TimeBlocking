import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export type Subject = { id: string; name: string; color: string; };
export type Log = { id: string; subjectId: string; hours: number; date: string; };
export type PlacedBlock = { id: string; subjectId: string; gridX: number; gridY: number; date?: string; };
export type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export function useTimeBlockingStore() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>((localStorage.getItem('tb_timefilt') as TimeFilter) || 'all');
  const [customStartDate, setCustomStartDate] = useState<string>(localStorage.getItem('tb_cstart') || '');
  const [customEndDate, setCustomEndDate] = useState<string>(localStorage.getItem('tb_cend') || '');
  const [sleepHoursPerDay, setSleepHoursPerDay] = useState<number>(parseFloat(localStorage.getItem('tb_sleep') || '0'));

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const isLoggedIn = !!currentUser;

  // 1. Initial Auth Check & Session Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        fetchUserData(session.user.id);
      }
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        setTimeFilter('all');
        fetchUserData(session.user.id);
        setupProfileSubscription(session.user.id);
      } else {
        setCurrentUser(null);
        resetLocalData();
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const setupProfileSubscription = (userId: string) => {
    return supabase.channel(`profile:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
        payload => {
          setPendingRequests(payload.new.pending_requests || []);
          if (payload.new.friends) {
            fetchFriendDetails(payload.new.friends);
          }
        }
      ).subscribe();
  };

  const fetchFriendDetails = async (friendIds: string[]) => {
    if (!friendIds || friendIds.length === 0) {
      setFriends([]);
      return;
    }
    const { data } = await supabase.from('profiles').select('id, username').in('id', friendIds);
    if (data) setFriends(data.map(p => ({ id: p.id, name: p.username })));
  };

  // 2. Data Fetching
  const fetchUserData = async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        setPendingRequests(prof.pending_requests || []);
        if (prof.friends && prof.friends.length > 0) {
          fetchFriendDetails(prof.friends);
        }
      }

      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', userId);
      if (subs) setSubjects(subs.map(s => ({ id: s.id, name: s.name, color: s.color })));

      const { data: logEntries } = await supabase.from('logs').select('*').eq('user_id', userId);
      if (logEntries) setLogs(logEntries.map(l => ({ id: l.id, subjectId: l.subject_id, hours: l.hours, date: l.date })));

      const { data: blockEntries } = await supabase.from('blocks').select('*').eq('user_id', userId);
      if (blockEntries) setPlacedBlocks(blockEntries.map(b => ({ id: b.id, subjectId: b.subject_id, gridX: b.grid_x, gridY: b.grid_y, date: b.date })));
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  const resetLocalData = () => {
    setSubjects([]);
    setLogs([]);
    setPlacedBlocks([]);
    setFriends([]);
    setPendingRequests([]);
  };

  // 3. Auth Actions
  const signup = async (email: string, pass: string) => {
    const username = email.toLowerCase();
    const { data, error } = await supabase.auth.signUp({ 
      email: `${username}@placeholder.com`, 
      password: pass, 
      options: { data: { username: username } } 
    });
    if (error) return { success: false, message: error.message };
    
    // Create profile in background (don't block the UI result)
    if (data.user) {
      const initProfile = async () => {
        try {
          await supabase.from('profiles').insert([{ id: data.user!.id, username: username }]);
          fetchUserData(data.user!.id);
          setupProfileSubscription(data.user!.id);
        } catch (e) {
          console.error('Error creating profile after signup:', e);
        }
      };
      initProfile();
      setCurrentUser(data.user);
    }
    return { success: true };
  };

  const login = async (email: string, pass: string) => {
    const username = email.toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: `${username}@placeholder.com`, 
      password: pass 
    });
    if (error) return { success: false, message: error.message };
    if (data.user) {
       setCurrentUser(data.user);
       fetchUserData(data.user.id);
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // 4. Data Modification Actions (Sync to Supabase)
  const addSubject = async (name: string, overrideColor?: string) => {
    const logoColors = ['#F87171', '#2DD4BF', '#38BDF8', '#FBBF24', '#C084FC', '#4ADE80'];
    const color = overrideColor || logoColors[subjects.length % logoColors.length];
    const newSub = { name, color };
    
    if (isLoggedIn) {
      const { data, error } = await supabase.from('subjects').insert([{ ...newSub, user_id: currentUser.id }]).select().single();
      if (!error && data) {
        setSubjects(prev => [...prev, { id: data.id, name: data.name, color: data.color }]);
        setActiveSubjectId(data.id);
      }
    } else {
      const localSub = { id: Date.now().toString(), ...newSub };
      setSubjects(prev => [...prev, localSub]);
      setActiveSubjectId(localSub.id);
    }
  };

  const logTime = async (subjectId: string, hours: number) => {
    const date = new Date().toISOString();
    if (isLoggedIn) {
      const { data, error } = await supabase.from('logs').insert([{ subject_id: subjectId, hours, date, user_id: currentUser.id }]).select().single();
      if (!error && data) setLogs(prev => [...prev, { id: data.id, subjectId, hours, date }]);
    } else {
      setLogs(prev => [...prev, { id: Date.now().toString(), subjectId, hours, date }]);
    }
  };

  const placeBlock = async (subjectId: string, gridX: number, gridY: number) => {
    const isOccupied = placedBlocks.some(b => b.gridX === gridX && b.gridY === gridY);
    if (isOccupied) return false;

    let assignedDate = new Date().toISOString();
    const subLogs = logs.filter(l => l.subjectId === subjectId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalPlaced = placedBlocks.filter(b => b.subjectId === subjectId).length;
    let acc = 0;
    for (const log of subLogs) {
      if (acc + log.hours > totalPlaced) { assignedDate = log.date; break; }
      acc += log.hours;
    }

    if (isLoggedIn) {
      const { data, error } = await supabase.from('blocks').insert([{ subject_id: subjectId, grid_x: gridX, grid_y: gridY, date: assignedDate, user_id: currentUser.id }]).select().single();
      if (!error && data) setPlacedBlocks(prev => [...prev, { id: data.id, subjectId, gridX, gridY, date: assignedDate }]);
    } else {
      setPlacedBlocks(prev => [...prev, { id: Date.now().toString(), subjectId, gridX, gridY, date: assignedDate }]);
    }
    return true;
  };

  const removeBlock = async (id: string) => {
    if (isLoggedIn) {
      await supabase.from('blocks').delete().eq('id', id);
    }
    setPlacedBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addFriendRequest = async (targetUsername: string) => {
    if (!isLoggedIn) return { success: false, message: 'Must be logged in' };
    const queryName = targetUsername.toLowerCase();
    
    const { data: target } = await supabase.from('profiles').select('id, pending_requests').eq('username', queryName).single();
    if (!target) return { success: false, message: 'User not found' };

    const newRequest = { id: currentUser.id, name: currentUser.user_metadata.username || currentUser.email };
    
    // Check if request already exists
    if ((target.pending_requests || []).some((r: any) => r.id === currentUser.id)) {
      return { success: false, message: 'Request already pending' };
    }

    const updatedRequests = [...(target.pending_requests || []), newRequest];
    
    const { error } = await supabase.from('profiles').update({ pending_requests: updatedRequests }).eq('id', target.id);
    if (error) {
      console.error('Error adding friend request:', error);
      return { success: false, message: 'Could not send request (Permissions issue?)' };
    }
    return { success: true };
  };

  const updateSubject = async (id: string, name: string, color?: string) => {
    if (isLoggedIn) {
      await supabase.from('subjects').update({ name, color: color }).eq('id', id);
    }
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name, color: color || s.color } : s));
  };

  const adjustUnplacedHours = async (subjectId: string, deltaHours: number, dateStr?: string) => {
    let targetDate = new Date();
    if (dateStr) {
      const [y, m, d] = dateStr.split('-');
      targetDate = new Date(parseInt(y, 10), parseInt(m, 10)-1, parseInt(d, 10), 12, 0, 0);
    }
    const isoDate = targetDate.toISOString();
    if (isLoggedIn) {
      await supabase.from('logs').insert([{ subject_id: subjectId, hours: deltaHours, date: isoDate, user_id: currentUser.id }]);
    }
    setLogs(prev => [...prev, { id: Date.now().toString(), subjectId, hours: deltaHours, date: isoDate }]);
  };

  const updateDailyLogHours = async (subjectId: string, dateKey: string, newTotal: number) => {
    const [y, m, d] = dateKey.split('-');
    const newDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0).toISOString();

    if (isLoggedIn) {
      await supabase.from('logs').insert([{ subject_id: subjectId, hours: newTotal, date: newDate, user_id: currentUser.id }]);
    }
    
    setLogs(prev => {
      const remaining = prev.filter(l => {
        if (l.subjectId !== subjectId) return true;
        const dObj = new Date(l.date);
        return `${dObj.getFullYear()}-${dObj.getMonth() + 1}-${dObj.getDate()}` !== dateKey;
      });
      return newTotal > 0 ? [...remaining, { id: Date.now().toString(), subjectId, hours: newTotal, date: newDate }] : remaining;
    });
  };

  // Helper getters
  const getUnplacedHours = (subjectId: string) => {
    const totalLogged = logs.filter(l => l.subjectId === subjectId).reduce((a, l) => a + l.hours, 0);
    const totalPlaced = placedBlocks.filter(b => b.subjectId === subjectId).length;
    return totalLogged - totalPlaced;
  };

  const getFriendData = (id: string) => friends.find(f => f.id === id) || null;

  return {
    subjects, logs, placedBlocks, activeSubjectId, searchQuery, timeFilter, customStartDate, customEndDate, sleepHoursPerDay,
    currentUser, friends, pendingRequests, isLoggedIn,
    setActiveSubjectId, setSearchQuery, setTimeFilter, setCustomStartDate, setCustomEndDate, setSleepHoursPerDay,
    signup, login, logout, addFriendRequest, getFriendData,
    addSubject, logTime, placeBlock, removeBlock, getUnplacedHours,
    updateSubject,
    adjustUnplacedHours, updateDailyLogHours,
    acceptRequest: async (senderId: string) => {
      if (!isLoggedIn) return;
      try {
        const { data: me } = await supabase.from('profiles').select('friends, pending_requests').eq('id', currentUser.id).single();
        const { data: sender } = await supabase.from('profiles').select('friends').eq('id', senderId).single();
        
        if (!me || !sender) {
          console.error('Accept error - could not fetch profile(s)');
          return;
        }

        const newMyFriends = Array.from(new Set([...(me.friends || []), senderId]));
        const newPending = (me.pending_requests || []).filter((r: any) => r.id !== senderId);
        const newSenderFriends = Array.from(new Set([...(sender.friends || []), currentUser.id]));

        // UPDATE 1: My own profile (Should usually work via RLS)
        const { error: meErr } = await supabase.from('profiles').update({ 
          friends: newMyFriends, 
          pending_requests: newPending 
        }).eq('id', currentUser.id);

        if (meErr) {
          console.error('Error updating my profile:', meErr);
          alert('Could not update your friend list.');
        }

        // UPDATE 2: Their profile (Will fail if RLS is strict - ideally use RPC I provided)
        const { error: sendErr } = await supabase.from('profiles').update({ 
          friends: newSenderFriends 
        }).eq('id', senderId);

        if (sendErr) {
          console.warn('Could not update sender profile. Friendship might be one-sided unless RPC is installed:', sendErr);
        }
      } catch (err) {
        console.error('Unexpected error in acceptRequest:', err);
      }
    },
    rejectRequest: async (senderId: string) => {
      if (!isLoggedIn) return;
      const { data: me } = await supabase.from('profiles').select('pending_requests').eq('id', currentUser.id).single();
      if (!me) return;
      const newPending = (me.pending_requests || []).filter((r: any) => r.id !== senderId);
      await supabase.from('profiles').update({ pending_requests: newPending }).eq('id', currentUser.id);
    },
    removeFriend: async (friendId: string) => {
      if (!isLoggedIn) return;
      const { data: me } = await supabase.from('profiles').select('friends').eq('id', currentUser.id).single();
      const { data: them } = await supabase.from('profiles').select('friends').eq('id', friendId).single();
      if (!me || !them) return;

      const newMyFriends = (me.friends || []).filter((id: string) => id !== friendId);
      const newTheirFriends = (them.friends || []).filter((id: string) => id !== currentUser.id);

      await Promise.all([
        supabase.from('profiles').update({ friends: newMyFriends }).eq('id', currentUser.id),
        supabase.from('profiles').update({ friends: newTheirFriends }).eq('id', friendId)
      ]);
    },
    fetchFriendStats: async (friendId: string) => {
      const { data: logs } = await supabase.from('logs').select('*').eq('user_id', friendId);
      const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', friendId);
      const { data: blocks } = await supabase.from('blocks').select('*').eq('user_id', friendId);
      return { 
        logs: logs || [], 
        subjects: (subjects || []).map(s => ({ id: s.id, name: s.name, color: s.color })),
        blocks: (blocks || []).map(b => ({ id: b.id, subjectId: b.subject_id, gridX: b.grid_x, gridY: b.grid_y, date: b.date }))
      };
    }
  };
}
