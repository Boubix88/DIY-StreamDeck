import React from 'react';
import { Monitor, Thermometer } from 'react-feather';

interface GpuInfoCardProps {
  gpuInfo: any;
}

const GpuInfoCard: React.FC<GpuInfoCardProps> = ({ gpuInfo }) => {
  const gpu = gpuInfo || {};
  const gpuTemp = gpu.temperature !== undefined ? Math.round(gpu.temperature) : 0;
  const gpuFreq = gpu.frequency !== undefined ? gpu.frequency.toFixed(0) : 0;
  const gpuLoad = gpu.load !== undefined ? Math.round(gpu.load) : 0;
  const vramUsed = gpu.vramUsed !== undefined ? gpu.vramUsed.toFixed(0) : 0;
  const vramTotal = gpu.vramTotal !== undefined ? gpu.vramTotal.toFixed(0) : 1;
  const vramPercentage = vramTotal > 0 ? (vramUsed / vramTotal) * 100 : 0;
  
  // Déterminer la couleur en fonction de la température
  const getTempColor = (temp: number) => {
    if (temp >= 85) return 'text-red-500';
    if (temp >= 75) return 'text-orange-400';
    if (temp >= 65) return 'text-yellow-300';
    return 'text-violet-400';
  };
  
  return (
    <div className="flex flex-col h-full w-full">
      {/* En-tête avec température */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer size={16} className={getTempColor(gpuTemp)} />
          <span className="text-xs text-gray-400">Température</span>
        </div>
        <div className={`text-lg font-bold ${getTempColor(gpuTemp)}`}>
          {gpuTemp > 0 ? `${gpuTemp}°C` : 'N/A'}
        </div>
      </div>
      
      {/* Barre de température */}
      <div className="w-full h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full ${getTempColor(gpuTemp)} bg-gradient-to-r from-violet-500 to-${getTempColor(gpuTemp).replace('text-', '')}`}
          style={{ width: `${Math.min(gpuTemp, 100)}%` }}
        />
      </div>
      
      {/* Utilisation GPU avec effet gamer */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Utilisation</span>
          <span className="text-sm font-bold text-violet-400">{gpuLoad}%</span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-md overflow-hidden relative border border-violet-900/30 shadow-inner shadow-violet-900/20">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 absolute top-0 left-0 transition-all duration-300 ease-out"
            style={{ width: `${gpuLoad}%` }}
          />
          {/* Effet de scan */}
          <div className="absolute top-0 left-0 h-full w-full opacity-30">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent animate-scan"></div>
          </div>
          {/* Lignes de segment */}
          <div className="absolute top-0 left-0 w-full h-full flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="h-full border-r border-gray-700/50" 
                style={{ width: '10%' }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* VRAM avec effet gamer */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">VRAM</span>
          <span className="text-sm font-bold text-fuchsia-400">
            {vramUsed > 0 ? `${vramUsed} / ${vramTotal} MB` : 'N/A'}
          </span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-md overflow-hidden relative border border-fuchsia-900/30 shadow-inner shadow-fuchsia-900/20">
          <div 
            className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 absolute top-0 left-0 transition-all duration-300 ease-out"
            style={{ width: `${vramPercentage}%` }}
          />
          <div className="absolute top-0 left-0 h-full w-full opacity-20">
            <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-white to-transparent animate-scan-reverse"></div>
          </div>
          {/* Lignes de segment */}
          <div className="absolute top-0 left-0 w-full h-full flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="h-full border-r border-gray-700/50" 
                style={{ width: '10%' }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Fréquence */}
      <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Fréquence</span>
          <span className="text-sm font-bold text-violet-400">
            {gpuFreq > 0 ? `${gpuFreq} MHz` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GpuInfoCard;
