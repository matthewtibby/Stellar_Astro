import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'default';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  messages: ToastMessage[];
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

<<<<<<< HEAD
=======
  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);

>>>>>>> calibration
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
<<<<<<< HEAD
  }, []);

  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);
=======
  }, [removeToast]);
>>>>>>> calibration

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ToastContext.Provider value={{ messages, addToast, removeToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 