import React from 'react';

interface MoveNotificationProps {
  moveNotification: string | null;
  setMoveNotification: (msg: string | null) => void;
}

export const MoveNotification: React.FC<MoveNotificationProps> = ({ moveNotification, setMoveNotification }) => (
  moveNotification ? (
    <div className="p-4 bg-yellow-900/50 text-yellow-200 rounded-md border border-yellow-800">
      {moveNotification}
      <button
        className="ml-4 px-2 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-800"
        onClick={() => setMoveNotification(null)}
      >
        Dismiss
      </button>
    </div>
  ) : null
); 