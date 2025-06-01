import React from 'react';

interface KeyGridProps {
  assignments: Record<string, string>;
  onAssign: (i: number, j: number) => void;
  onLaunch: (i: number, j: number) => void;
  onDelete: (i: number, j: number) => void;
}

const KeyGrid: React.FC<KeyGridProps> = ({ assignments, onAssign, onLaunch, onDelete }) => {
  return (
    <div className="grid grid-cols-4 grid-rows-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border-2 border-gray-700 w-full h-full">
      {[...Array(3)].map((_, i) =>
        [...Array(4)].map((_, j) => {
          const key = `${i},${j}`;
          const assigned = assignments[key];
          return (
            <div key={key} className="relative group flex flex-col items-center justify-center">
              <button
                className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gray-900 border-2 border-gray-700 shadow-lg transition-all duration-150 group-hover:border-green-500 ${assigned ? 'ring-2 ring-green-700' : ''}`}
                onClick={() => onLaunch(i, j)}
                onContextMenu={e => { e.preventDefault(); onAssign(i, j); }}
              >
                {/* Placeholder icon or thumbnail */}
                <span className="text-xs text-gray-400">{assigned ? 'App' : '+'}</span>
              </button>
              {assigned && (
                <button
                  className="absolute top-1 right-1 bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100"
                  onClick={() => onDelete(i, j)}
                  title="Supprimer l'assignation"
                >×</button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default KeyGrid;
