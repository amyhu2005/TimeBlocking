import React, { useRef, useState } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { useTimeBlockingStore } from './store';
import StatsModal from './StatsModal';

interface GridCanvasProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

const CELL_SIZE = 60;
const GRID_SIZE = CELL_SIZE;

const GridCanvas: React.FC<GridCanvasProps> = ({ store, selectedBlockId, onSelectBlock }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchScale, setInitialPinchScale] = useState<number>(1);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    let newScale = scale + delta;
    newScale = Math.min(Math.max(0.2, newScale), 3);
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.tb-block') || (e.target as HTMLElement).closest('button')) {
      return; 
    }
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setHasDragged(true);
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDist(dist);
      setInitialPinchScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialPinchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleDelta = dist / initialPinchDist;
      let newScale = initialPinchScale * scaleDelta;
      newScale = Math.min(Math.max(0.2, newScale), 3);
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      setInitialPinchDist(null);
    }
  };

  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }

    if (!store.activeSubjectId) return;

    const unplacedHours = store.getUnplacedHours(store.activeSubjectId);
    if (unplacedHours < 1) return;

    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const adjustedX = (clickX - position.x) / scale;
    const adjustedY = (clickY - position.y) / scale;

    const gridX = Math.floor(adjustedX / GRID_SIZE);
    const gridY = Math.floor(adjustedY / GRID_SIZE);

    store.placeBlock(store.activeSubjectId, gridX, gridY);
  };

  const handleBlockClick = (e: MouseEvent, blockId: string) => {
    e.stopPropagation();
    if (!hasDragged) {
      onSelectBlock(blockId);
    }
  };

  const isBlockMatchingFilter = (block: ReturnType<typeof useTimeBlockingStore>['placedBlocks'][0], subject: any) => {
    if (store.searchQuery && !subject.name.toLowerCase().includes(store.searchQuery.toLowerCase())) {
      return false;
    }
    if (store.timeFilter !== 'all') {
      const blockDate = block.date ? new Date(block.date) : new Date(0);
      const now = new Date();
      if (store.timeFilter === 'today') {
        if (blockDate.toDateString() !== now.toDateString()) return false;
      } else if (store.timeFilter === 'week') {
        const diff = now.getTime() - blockDate.getTime();
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (store.timeFilter === 'month') {
        const diff = now.getTime() - blockDate.getTime();
        if (diff > 30 * 24 * 60 * 60 * 1000) return false;
      } else if (store.timeFilter === 'custom') {
        const blockY = blockDate.getFullYear(); 
        const blockM = String(blockDate.getMonth() + 1).padStart(2, '0'); 
        const blockD = String(blockDate.getDate()).padStart(2, '0'); 
        const blockDateStr = `${blockY}-${blockM}-${blockD}`;
        if (store.customStartDate && blockDateStr < store.customStartDate) return false;
        if (store.customEndDate && blockDateStr > store.customEndDate) return false;
      }
    }
    return true;
  };

  const backgroundStyle = {
    backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
    backgroundPosition: `${position.x}px ${position.y}px`,
    backgroundImage: `
      linear-gradient(to right, var(--tb-grid-line) 1px, transparent 1px),
      linear-gradient(to bottom, var(--tb-grid-line) 1px, transparent 1px)
    `
  };

  const transformStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    transformOrigin: '0 0'
  };

  return (
    <>
      <div 
        className="tb-canvas-container" 
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={backgroundStyle}
        onClick={handleGridClick}
      >
        <div className="tb-grid-inner" style={transformStyle}>
          {store.placedBlocks.map(block => {
            const subject = store.subjects.find(s => s.id === block.subjectId);
            if (!subject) return null;

            const isMatch = isBlockMatchingFilter(block, subject);
            const isFilterActive = store.searchQuery !== '' || store.timeFilter !== 'all';
            const isGrey = isFilterActive && !isMatch;

            return (
              <div
                key={block.id}
                className="tb-block"
                style={{
                  left: block.gridX * GRID_SIZE,
                  top: block.gridY * GRID_SIZE,
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                  backgroundColor: isGrey ? '#CBD5E1' : subject.color,
                  opacity: isGrey ? 0.4 : 1,
                  boxShadow: isGrey ? 'none' : `0 4px 15px ${subject.color}66`,
                  zIndex: isGrey ? 1 : 2,
                }}
                onClick={(e) => handleBlockClick(e, block.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="tb-zoom-controls" style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'row', gap: '0.5rem', zIndex: 40 }}>
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tb-sidebar-bg)', backdropFilter: 'blur(8px)', border: '1px solid var(--tb-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 600, color: 'var(--tb-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tb-sidebar-bg)', backdropFilter: 'blur(8px)', border: '1px solid var(--tb-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 600, color: 'var(--tb-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>

      {selectedBlockId && (
        <StatsModal 
          store={store} 
          blockId={selectedBlockId} 
          onClose={() => onSelectBlock(null)} 
        />
      )}
    </>
  );
};

export default GridCanvas;
