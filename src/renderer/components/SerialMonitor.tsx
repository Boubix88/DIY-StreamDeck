import React from 'react';
import { X } from 'react-feather';

interface SerialMonitorProps {
  logs: string[];
  onClear: () => void;
  maxHeight?: string | number;
}

const SerialMonitor: React.FC<SerialMonitorProps> = ({
  logs,
  onClear,
  maxHeight = '300px',
}) => {
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  // Faire défiler vers le bas à chaque nouveau log
  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col h-full overflow-y-auto w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">
          Moniteur Série
        </h2>
        <button
          onClick={onClear}
          disabled={logs.length === 0}
          className={`p-1 rounded-full ${logs.length === 0 
            ? 'text-gray-500 cursor-not-allowed' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          title="Effacer les logs"
        >
          <X size={18} />
        </button>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto bg-gray-900 p-3 rounded font-mono text-sm text-green-400"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
      >
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">
            Aucun log à afficher. Les logs de l&apos;Arduino apparaîtront ici.
          </p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">{log}</div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
      
      <div className="mt-2 flex justify-end">
        <span className="text-xs text-gray-400">
          {logs.length} {logs.length <= 1 ? 'message' : 'messages'}
        </span>
      </div>
    </div>
  );
};

export default SerialMonitor;
