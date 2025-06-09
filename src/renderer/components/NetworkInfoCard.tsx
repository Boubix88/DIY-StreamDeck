import React, { useState, useEffect } from 'react';
import { Wifi, ArrowDown, ArrowUp, ChevronDown } from 'react-feather';

interface NetworkInfoCardProps {
  networkInfo: any;
}

interface NetworkData {
  ip: string;
  rxRate: number;
  txRate: number;
}

const NetworkInfoCard: React.FC<NetworkInfoCardProps> = ({ networkInfo }) => {
  // État pour stocker l'interface sélectionnée
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Historique des taux de transfert pour les graphiques
  const [rxHistory, setRxHistory] = useState<number[]>(Array(20).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(Array(20).fill(0));
  
  // Trouver l'interface principale (celle avec le plus grand débit total)
  const getMainInterface = (): [string, NetworkData] | null => {
    if (!networkInfo || typeof networkInfo !== 'object' || Object.keys(networkInfo).length === 0) {
      return null;
    }
    
    let maxThroughput = 0;
    let mainIface: [string, NetworkData] | null = null;
    
    Object.entries(networkInfo).forEach(([iface, data]) => {
      const d = data as NetworkData;
      const throughput = d.rxRate + d.txRate;
      if (throughput > maxThroughput) {
        maxThroughput = throughput;
        mainIface = [iface, d];
      }
    });
    
    return mainIface;
  };
  
  // Liste des interfaces disponibles
  const availableInterfaces = networkInfo && typeof networkInfo === 'object' ? 
    Object.keys(networkInfo) : [];
  
  // Sélectionner l'interface principale par défaut si aucune n'est sélectionnée
  useEffect(() => {
    if (!selectedInterface && availableInterfaces.length > 0) {
      const mainIface = getMainInterface();
      if (mainIface) {
        setSelectedInterface(mainIface[0]);
      } else if (availableInterfaces.length > 0) {
        setSelectedInterface(availableInterfaces[0]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkInfo, availableInterfaces.length]); // Retiré selectedInterface des dépendances
  
  // Obtenir les données de l'interface actuellement sélectionnée
  const getCurrentInterfaceData = (): [string, NetworkData] | null => {
    if (!selectedInterface || !networkInfo || typeof networkInfo !== 'object') {
      return getMainInterface(); // Fallback à l'interface principale
    }
    
    if (networkInfo[selectedInterface]) {
      return [selectedInterface, networkInfo[selectedInterface] as NetworkData];
    }
    
    return getMainInterface(); // Fallback si l'interface sélectionnée n'existe plus
  };
  
  const currentInterface = getCurrentInterfaceData();
  
  // Mettre à jour l'historique des taux de transfert
  useEffect(() => {
    if (currentInterface) {
      const [_, data] = currentInterface;
      setRxHistory(prev => {
        const newHistory = [...prev.slice(1), data.rxRate / 1048576]; // Convertir en Mo/s
        return newHistory;
      });
      
      setTxHistory(prev => {
        const newHistory = [...prev.slice(1), data.txRate / 1048576];
        return newHistory;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkInfo, currentInterface?.[0]]); // Ne dépendre que de l'identifiant de l'interface
  
  // Trouver la valeur maximale pour l'échelle du graphique
  const maxRate = Math.max(
    ...rxHistory, 
    ...txHistory,
    0.1 // Minimum pour éviter une échelle de 0
  );
  
  // Générer les points du graphique
  const generateGraphPoints = (data: number[], color: string) => {
    const height = 40; // Hauteur du graphique en pixels
    const width = 100; // Largeur du graphique (pourcentage)
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / maxRate) * height;
      return `${x},${y}`;
    }).join(' ');
    return (
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };
  
  // Formater les taux de transfert avec des unités appropriées
  const formatRate = (rate: number): string => {
    if (rate < 0.1) return `${(rate * 1024).toFixed(1)} Ko/s`;
    if (rate < 100) return `${rate.toFixed(1)} Mo/s`;
    return `${(rate / 1024).toFixed(1)} Go/s`;
  };
  
  return (
    <div className="flex flex-col h-full w-full">
      {/* En-tête avec sélecteur d'interface */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Wifi size={16} className="text-pink-400" />
          <span className="text-xs text-gray-400">Interface</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 text-sm font-bold text-pink-300 bg-gray-800 bg-opacity-50 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            {currentInterface ? currentInterface[0] : 'N/A'}
            <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown pour sélection d'interface */}
          {isDropdownOpen && availableInterfaces.length > 0 && (
            <div className="absolute right-0 mt-1 w-full min-w-[120px] bg-gray-800 rounded-md shadow-lg z-10 py-1 max-h-32 overflow-y-auto">
              {availableInterfaces.map(iface => (
                <button
                  key={iface}
                  className={`w-full text-left px-3 py-1 text-sm ${selectedInterface === iface ? 'bg-pink-900 bg-opacity-30 text-pink-300' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => {
                    setSelectedInterface(iface);
                    setIsDropdownOpen(false);
                  }}
                >
                  {iface}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Graphique de trafic réseau */}
      <div className="bg-gray-900 bg-opacity-50 rounded-lg p-2 mb-3 h-20">
        <div className="text-xs text-gray-500 mb-1 flex justify-between">
          <span>Trafic</span>
          <span>{formatRate(maxRate)}</span>
        </div>
        <div className="relative h-12 w-full">
          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            {/* Lignes de grille */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#374151" strokeWidth="0.5" strokeDasharray="1,1" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="#374151" strokeWidth="0.5" strokeDasharray="1,1" />
            <line x1="0" y1="40" x2="100" y2="40" stroke="#374151" strokeWidth="0.5" />
            
            {/* Graphiques de données */}
            {generateGraphPoints(rxHistory, '#ec4899')} {/* Download - Rose */}
            {generateGraphPoints(txHistory, '#38bdf8')} {/* Upload - Bleu */}
          </svg>
          
          {/* Légende */}
          <div className="absolute bottom-0 right-0 flex gap-3 text-[10px]">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-pink-500 rounded-full mr-1"></div>
              <span className="text-gray-400">DL</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
              <span className="text-gray-400">UL</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Indicateurs de vitesse */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="flex items-center gap-1">
            <ArrowDown size={12} className="text-pink-400" />
            <span className="text-xs text-gray-400">Download</span>
          </div>
          <div className="text-sm font-bold text-pink-300">
            {currentInterface ? formatRate(currentInterface[1].rxRate / 1048576) : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="flex items-center gap-1">
            <ArrowUp size={12} className="text-blue-400" />
            <span className="text-xs text-gray-400">Upload</span>
          </div>
          <div className="text-sm font-bold text-blue-300">
            {currentInterface ? formatRate(currentInterface[1].txRate / 1048576) : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Liste des interfaces réseau */}
      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-1">Interfaces</div>
        <div className="space-y-1 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
          {networkInfo && typeof networkInfo === 'object' ? (
            Object.entries(networkInfo).map(([iface, data]) => {
              const isSelected = selectedInterface === iface;
              const d = data as NetworkData;
              return (
                <div 
                  key={iface}
                  className={`text-xs p-1.5 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-800/50'}`}
                  onClick={() => {
                    setSelectedInterface(iface);
                  }}
                >
                  <div className="flex justify-between">
                    <span className={`font-medium ${isSelected ? 'text-green-300' : 'text-gray-300'}`}>{iface}</span>
                    <span className="text-gray-400">{d.ip || 'N/A'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-500 italic">Aucune interface détectée</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkInfoCard;
