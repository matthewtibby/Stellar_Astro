import React, { useRef, useState, useEffect } from 'react';

interface FloatingChecklistPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  progress?: number; // 0-100
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

const FloatingChecklistPanel: React.FC<FloatingChecklistPanelProps> = ({ open, onClose, children, progress }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Set initial position (bottom right)
  useEffect(() => {
    if (!open || isMobile()) return;
    if (!position) {
      setPosition({
        x: window.innerWidth - 440, // 400px panel + 40px margin
        y: window.innerHeight - 400, // 360px panel + 40px margin
      });
    }
  }, [open, position]);

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (isMobile()) return;
    setDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging || isMobile()) return;
    setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  // Panel style
  const style = isMobile()
    ? { left: 0, right: 0, bottom: 0, width: '100%', maxWidth: '100%', position: 'fixed' as const }
    : position
    ? { left: position.x, top: position.y, position: 'fixed' as const, width: 384, maxWidth: '100%' }
    : { right: 32, bottom: 32, position: 'fixed' as const, width: 384, maxWidth: '100%' };

  if (!open) return null;
  return (
    <div
      ref={panelRef}
      className="z-50 rounded-xl bg-gray-900/90 border border-gray-700 shadow-2xl backdrop-blur-lg animate-fade-in transition-transform duration-300 focus:outline-none"
      style={style}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div className="h-2 w-full bg-gray-800 rounded-t-xl overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      )}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-gray-800 cursor-move select-none"
        onMouseDown={onMouseDown}
        style={{ cursor: isMobile() ? 'default' : 'move' }}
      >
        <span className="font-semibold text-white">Project Checklist</span>
        <button
          onClick={onClose}
          aria-label="Close checklist"
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="p-4 overflow-y-auto max-h-[60vh]">{children}</div>
    </div>
  );
};

export default FloatingChecklistPanel; 