import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

interface DeleteConfirmationDialogProps {
  open: boolean;
  projectName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ open, projectName, onCancel, onConfirm }) => {
  if (!open || typeof window === 'undefined') return null;
  return (
    typeof window !== 'undefined' &&
    ReactDOM.createPortal(
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.stopPropagation()}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-gray-900 rounded-lg p-8 max-w-sm w-full shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-white mb-4">Delete Project?</h2>
              <p className="text-gray-300 mb-6">Are you sure you want to delete the project <span className="font-semibold">{projectName}</span>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm}>
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    )
  );
};

export default DeleteConfirmationDialog; 