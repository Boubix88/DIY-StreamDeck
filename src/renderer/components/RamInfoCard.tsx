import React from 'react';
import { Activity, HardDrive } from 'react-feather';

interface RamInfoCardProps {
  ramInfo: any;
}

const RamInfoCard: React.FC<RamInfoCardProps> = ({ ramInfo }) => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg flex flex-col items-center border-2 border-blue-500 w-full h-full">
    <div className="flex items-center gap-2 mb-2">
      <Activity size={22} className="text-blue-400" />
      <span className="text-lg font-bold tracking-widest text-blue-300">RAM</span>
    </div>
    <div className="text-xs text-gray-400">Used</div>
    <div className="text-xl font-extrabold text-white mb-1">{ramInfo?.used !== undefined ? ramInfo.used.toFixed(1) + ' GB' : 'N/A'}</div>
    <div className="text-xs text-gray-400">Total</div>
    <div className="text-lg font-bold text-blue-200">{ramInfo?.total !== undefined ? ramInfo.total.toFixed(1) + ' GB' : 'N/A'}</div>
  </div>
);

export default RamInfoCard;
