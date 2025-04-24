import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'default';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, type, message };

    setMessages((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addToast,
    removeToast,
    clearAll,
  };
}; 