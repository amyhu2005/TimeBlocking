import React, { useRef, useState } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { useTimeBlockingStore } from './store';
import StatsModal from './StatsModal';

interface GridCanvasProps {
  store: ReturnType<typeof useTimeBlockingStore>;
}

const CELL_SIZE = 60;
const GRID_SIZE = CELL_SIZE;

const GridCanvas: React.FC<GridCanvasProps> = ({ store }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    let newScale = scale + delta;
    newScale = Math.min(Math.max(0.2, newScale), 3);
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.tb-block')) {
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

  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }

    if (!store.activeSubjectId) return;

    const unplacedHours = store.getUnplacedHours(store.activeSubjectId);
    if (unplacedHours <= 0) return;

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
      setSelectedBlockId(blockId);
    }
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
        style={backgroundStyle}
        onClick={handleGridClick}
      >
        <div className="tb-grid-inner" style={transformStyle}>
          {store.placedBlocks.map(block => {
            const subject = store.subjects.find(s => s.id === block.subjectId);
            if (!subject) return null;

            return (
              <div
                key={block.id}
                className="tb-block"
                style={{
                  left: block.gridX * GRID_SIZE,
                  top: block.gridY * GRID_SIZE,
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                  backgroundColor: subject.color,
                  boxShadow: `0 4px 15px ${subject.color}66`,
                }}
                onClick={(e) => handleBlockClick(e, block.id)}
              >
                <div className="tb-block-content" style={{ opacity: scale > 0.6 ? 1 : 0 }}>
                  <span style={{color: '#fff', fontSize: '1.2rem', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                    {subject.name.substring(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBlockId && (
        <StatsModal 
          store={store} 
          blockId={selectedBlockId} 
          onClose={() => setSelectedBlockId(null)} 
        />
      )}
    </>
  );
};

export default GridCanvas;
