import React from 'react';
import { Cpu, Monitor, Wifi, Activity, HardDrive } from 'react-feather';

interface SystemInfoCardsProps {
  cpuInfo: any;
  cpuTemperature: any;
  gpuInfo: any;
  ramInfo: any;
  networkInfo: any;
}

const Card = ({ icon, title, value, accent }: { icon: React.ReactNode, title: string, value: string, accent?: string }) => (
  <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg flex items-center space-x-4 border-2 ${accent || 'border-gray-700'}`}> 
    <div className="p-2 rounded-full bg-gray-900 text-green-400">{icon}</div>
    <div>
      <div className="text-xs uppercase text-gray-400 tracking-widest font-bold">{title}</div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
    </div>
  </div>
);

const SystemInfoCards: React.FC<SystemInfoCardsProps> = ({ cpuInfo, cpuTemperature, gpuInfo, ramInfo, networkInfo }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
      <Card icon={<Cpu size={28}/>} title="CPU Temp" value={`${Math.round(cpuTemperature?.main || 0)}°C`} accent="border-green-500" />
      <Card icon={<Cpu size={28}/>} title="CPU Usage" value={`${cpuInfo?.avg ? cpuInfo.avg.toFixed(1) : 'N/A'} GHz`} accent="border-green-700" />
      <Card icon={<Monitor size={28}/>} title="GPU" value={gpuInfo?.model || 'N/A'} accent="border-purple-600" />
      <Card icon={<Activity size={28}/>} title="RAM Used" value={`${((ramInfo?.used ?? 0) / (1024 * 1024 * 1024)).toFixed(1)} GB`} accent="border-blue-700" />
      <Card icon={<HardDrive size={28}/>} title="RAM Total" value={`${((ramInfo?.total ?? 0) / (1024 * 1024 * 1024)).toFixed(1)} GB`} accent="border-blue-900" />
      <Card icon={<Wifi size={28}/>} title="IP" value={networkInfo?.ip || 'N/A'} accent="border-pink-600" />
    </div>
  );
};

export default SystemInfoCards;
