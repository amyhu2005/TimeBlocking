import { useState, useEffect } from 'react';

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type Log = {
  id: string;
  subjectId: string;
  hours: number;
  date: string;
};

export type PlacedBlock = {
  id: string;
  subjectId: string;
  gridX: number;
  gridY: number;
};

export function useTimeBlockingStore() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedSubjects = localStorage.getItem('tb_subjects');
      const storedLogs = localStorage.getItem('tb_logs');
      const storedBlocks = localStorage.getItem('tb_blocks');
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
      if (storedLogs) setLogs(JSON.parse(storedLogs));
      if (storedBlocks) setPlacedBlocks(JSON.parse(storedBlocks));
    } catch (e) {
      console.error('Failed to load TimeBlocking data', e);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (subjects.length > 0) localStorage.setItem('tb_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    if (logs.length > 0) localStorage.setItem('tb_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (placedBlocks.length > 0) localStorage.setItem('tb_blocks', JSON.stringify(placedBlocks));
  }, [placedBlocks]);

  const addSubject = (name: string, color: string) => {
    const newSubject = { id: Date.now().toString(), name, color };
    setSubjects(prev => [...prev, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  const logTime = (subjectId: string, hours: number) => {
    const newLog = { id: Date.now().toString(), subjectId, hours, date: new Date().toISOString() };
    setLogs(prev => [...prev, newLog]);
  };

  const placeBlock = (subjectId: string, gridX: number, gridY: number) => {
    const isOccupied = placedBlocks.some(b => b.gridX === gridX && b.gridY === gridY);
    if (!isOccupied) {
      setPlacedBlocks(prev => [...prev, { id: Date.now().toString(), subjectId, gridX, gridY }]);
      return true;
    }
    return false;
  };

  const getUnplacedHours = (subjectId: string) => {
    const totalLogged = logs.filter(l => l.subjectId === subjectId).reduce((acc, l) => acc + l.hours, 0);
    const totalPlaced = placedBlocks.filter(b => b.subjectId === subjectId).length;
    return totalLogged - totalPlaced;
  };

  const removeBlock = (id: string) => {
    setPlacedBlocks(prev => prev.filter(b => b.id !== id));
  };

  return {
    subjects,
    logs,
    placedBlocks,
    activeSubjectId,
    setActiveSubjectId,
    addSubject,
    logTime,
    placeBlock,
    getUnplacedHours,
    removeBlock
  };
}
