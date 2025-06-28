type Listener = () => void;

const listeners: Listener[] = [];

export const PositioningService = {
  addEventListeners(listener: Listener) {
    window.addEventListener('resize', listener);
    window.addEventListener('scroll', listener, true);
    listeners.push(listener);
  },
  removeEventListeners(listener: Listener) {
    window.removeEventListener('resize', listener);
    window.removeEventListener('scroll', listener, true);
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  },
  getElementPosition(selectorId: string) {
    if (!selectorId) return { top: 0, left: 0, width: 0, height: 0 };
    const el = document.getElementById(selectorId);
    if (!el) return { top: 0, left: 0, width: 0, height: 0 };
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };
  },
}; 