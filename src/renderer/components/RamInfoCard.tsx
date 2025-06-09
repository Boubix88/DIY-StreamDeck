import React from 'react';
import { Activity, HardDrive } from 'react-feather';

interface RamInfoCardProps {
  ramInfo: any;
}

const RamInfoCard: React.FC<RamInfoCardProps> = ({ ramInfo }) => {
  const ramUsed = ramInfo?.used !== undefined ? ramInfo.used : 0;
  const ramTotal = ramInfo?.total !== undefined ? ramInfo.total : 1;
  const ramPercentage = Math.round((ramUsed / ramTotal) * 100) || 0;
  
  // Déterminer la couleur en fonction de l'utilisation de la RAM
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-400';
    if (percentage >= 60) return 'text-yellow-300';
    return 'text-cyan-400';
  };
  
  // Générer les segments pour le graphique en anneau
  const generateRingSegments = (count: number = 16) => {
    const segments = [];
    const segmentPercentage = 100 / count;
    const filledSegments = Math.ceil(ramPercentage / segmentPercentage);
    
    for (let i = 0; i < count; i++) {
      const isFilled = i < filledSegments;
      const rotation = `rotate(${i * (360 / count)}deg)`;
      segments.push(
        <div 
          key={i}
          className={`absolute h-1.5 w-8 rounded-full transform origin-left ${isFilled ? getUsageColor(ramPercentage).replace('text-', 'bg-') : 'bg-gray-800'}`}
          style={{ transform: `${rotation} translateX(16px)` }}
        />
      );
    }
    
    return segments;
  };
  
  return (
    <div className="flex flex-col h-full w-full">
      {/* Titre et pourcentage */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400">Utilisation Mémoire</span>
        <span className={`text-lg font-bold ${getUsageColor(ramPercentage)}`}>
          {ramPercentage}%
        </span>
      </div>
      
      {/* Graphique en anneau */}
      <div className="flex justify-center items-center mb-4 relative">
        <div className="relative h-32 w-32 flex justify-center items-center">
          {/* Segments de l'anneau */}
          {generateRingSegments(18)}
          
          {/* Cercle central avec valeur */}
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 bg-gray-900 rounded-full m-6">
            <div className="text-lg font-bold text-cyan-400">
              {ramUsed.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">GB</div>
          </div>
        </div>
      </div>
      
      {/* Détails de la mémoire */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="text-xs text-gray-400">Utilisée</div>
          <div className="text-sm font-bold text-cyan-300">
            {ramUsed.toFixed(1)} GB
          </div>
        </div>
        <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <div className="text-xs text-gray-400">Totale</div>
          <div className="text-sm font-bold text-cyan-300">
            {ramTotal.toFixed(1)} GB
          </div>
        </div>
      </div>
    </div>
  );
};

export default RamInfoCard;
