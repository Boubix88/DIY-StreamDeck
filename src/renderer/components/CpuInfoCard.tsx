import React from 'react';
import { Cpu } from 'react-feather';

interface CpuInfoCardProps {
  cpuInfo: any;
  cpuTemperature: any;
}

const CpuInfoCard: React.FC<CpuInfoCardProps> = ({ cpuInfo, cpuTemperature }) => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg flex flex-col items-center border-2 border-green-400 w-full h-full">
    <div className="flex items-center gap-2 mb-2">
      <Cpu size={24} className="text-green-400" />
      <span className="text-lg font-bold tracking-widest text-green-300">CPU</span>
    </div>
    <div className="text-xs text-gray-400">Temp</div>
    <div className="text-xl font-extrabold text-white mb-1">
      {Math.round(cpuTemperature?.main || 0)}°C
    </div>
    <div className="text-xs text-gray-400">Usage</div>
    <div className="text-lg font-bold text-green-200">
      {cpuInfo?.frequency ? (cpuInfo.frequency / 1000).toFixed(1) : 'N/A'} GHz
    </div>
    <div className="text-xs text-gray-400 mt-1">Processus: {cpuInfo?.processCount}</div>
  </div>
);

export default CpuInfoCard;
