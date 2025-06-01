import React from 'react';

interface PortSelectorProps {
  ports: { path: string; manufacturer?: string }[];
  connectedPort: string | null;
  onConnect: (port: string) => void;
  onDisconnect: () => void;
}

const PortSelector: React.FC<PortSelectorProps> = ({ ports, connectedPort, onConnect, onDisconnect }) => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg border-2 border-yellow-400 flex flex-col items-center w-full h-full">
    <div className="text-yellow-300 font-bold mb-2 text-lg tracking-widest">Connexion</div>
    <select
      className="w-full bg-gray-700 text-white p-1 rounded mb-2"
      value={connectedPort || ''}
      onChange={e => {
        const port = e.target.value;
        if (port) onConnect(port);
        else onDisconnect();
      }}
    >
      <option value="">Sélectionner un port</option>
      {ports.map(port => (
        <option key={port.path} value={port.path}>
          {port.path} - {port.manufacturer || 'Inconnu'}
        </option>
      ))}
    </select>
    <div className="mt-2 flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${connectedPort ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
      <span className="text-xs text-gray-400">{connectedPort ? 'Connecté' : 'Déconnecté'}</span>
    </div>
  </div>
);

export default PortSelector;
