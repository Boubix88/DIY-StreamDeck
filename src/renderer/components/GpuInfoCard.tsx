import React from 'react';
import { Monitor } from 'react-feather';

interface GpuInfoCardProps {
  gpuInfo: any;
}

const GpuInfoCard: React.FC<GpuInfoCardProps> = ({ gpuInfo }) => {
  const gpu = gpuInfo || {};
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg flex flex-col items-center border-2 border-purple-500 w-full h-full">
      <div className="flex items-center gap-2 mb-2">
        <Monitor size={24} className="text-purple-400" />
        <span className="text-lg font-bold tracking-widest text-purple-300">GPU</span>
      </div>
      <div className="text-xs text-gray-400">Température</div>
      <div className="text-base font-extrabold text-white mb-1">{gpu.temperature !== undefined ? Math.round(gpu.temperature) + '°C' : 'N/A'}</div>
      <div className="text-xs text-gray-400">Fréquence</div>
      <div className="text-sm font-bold text-purple-200">{gpu.frequency !== undefined ? gpu.frequency.toFixed(0) + ' MHz' : 'N/A'}</div>
      <div className="text-xs text-gray-400 mt-1">VRAM</div>
      <div className="text-sm font-bold text-purple-200">{gpu.vramUsed !== undefined && gpu.vramTotal !== undefined ? `${gpu.vramUsed.toFixed(0)} / ${gpu.vramTotal.toFixed(0)} MB` : 'N/A'}</div>
    </div>
  );
};

export default GpuInfoCard;
