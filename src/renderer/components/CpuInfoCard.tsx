import React from 'react';
import { Cpu, Thermometer, Activity } from 'react-feather';

interface CpuInfoCardProps {
  cpuInfo: any;
  cpuTemperature: any;
}

const CpuInfoCard: React.FC<CpuInfoCardProps> = ({ cpuInfo, cpuTemperature }) => {
  const cpuTemp = Math.round(cpuTemperature?.main || 0);
  const cpuFreq = cpuInfo?.frequency ? (cpuInfo.frequency / 1000).toFixed(1) : 'N/A';
  const cpuLoad = cpuInfo?.load || 0;
  
  // Déterminer la couleur de température en fonction de la valeur
  const getTempColor = (temp: number) => {
    if (temp >= 80) return 'text-red-500';
    if (temp >= 70) return 'text-orange-400';
    if (temp >= 60) return 'text-yellow-300';
    return 'text-cyan-400';
  };
  
  // Calculer le pourcentage pour la jauge circulaire
  const calculateStrokeDashoffset = (percentage: number) => {
    const circumference = 2 * Math.PI * 40; // r=40 pour le cercle
    return circumference - (circumference * percentage) / 100;
  };
  
  return (
    <div className="flex flex-col h-full w-full">
      {/* Jauge de température */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer size={16} className={getTempColor(cpuTemp)} />
          <span className="text-xs text-gray-400">Température</span>
        </div>
        <div className={`text-lg font-bold ${getTempColor(cpuTemp)}`}>
          {cpuTemp}°C
        </div>
      </div>
      
      {/* Barre de progression stylisée */}
      <div className="w-full h-3 bg-gray-800 rounded-full mb-4 overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-500 to-${getTempColor(cpuTemp).replace('text-', '')}`}
          style={{ width: `${Math.min(cpuTemp, 100)}%` }}
        />
        {/* Effet de scan */}
        <div className="absolute top-0 left-0 h-full w-full opacity-20">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent animate-scan"></div>
        </div>
      </div>
      
      {/* Jauge circulaire pour l'utilisation CPU */}
      <div className="flex justify-center items-center mb-2 relative">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
            {/* Effet de glow */}
            <filter id="cpuGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#3b82f6" floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Cercle de fond */}
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="transparent" 
              stroke="#1f2937" 
              strokeWidth="8"
            />
            
            {/* Cercle de progression avec animation */}
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="transparent" 
              stroke="url(#cpuGradient)" 
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={calculateStrokeDashoffset(cpuLoad)}
              strokeLinecap="round"
              filter="url(#cpuGlow)"
              className="transition-all duration-700 ease-out"
            />
            
            {/* Définition du gradient */}
            <defs>
              <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-cyan-300 drop-shadow-lg">
              {cpuLoad}%
            </span>
            <span className="text-xs text-gray-400">Utilisation</span>
          </div>
        </div>
      </div>
      
      {/* Informations supplémentaires */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="text-xs text-gray-400">Fréquence</div>
          <div className="text-sm font-bold text-cyan-300">{cpuFreq} GHz</div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="text-xs text-gray-400">Processus</div>
          <div className="text-sm font-bold text-cyan-300">{cpuInfo?.processCount || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

export default CpuInfoCard;
