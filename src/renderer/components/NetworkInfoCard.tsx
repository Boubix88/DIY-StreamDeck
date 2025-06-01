import React from 'react';
import { Wifi } from 'react-feather';

interface NetworkInfoCardProps {
  networkInfo: any;
}

const NetworkInfoCard: React.FC<NetworkInfoCardProps> = ({ networkInfo }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg flex flex-col items-center border-2 border-pink-500 w-full h-full">
      <div className="flex items-center gap-2 mb-2">
        <Wifi size={22} className="text-pink-400" />
        <span className="text-lg font-bold tracking-widest text-pink-300">Réseau</span>
      </div>
      <div className="text-xs text-gray-400">Interfaces/IPs</div>
      <div className="flex flex-col gap-1 mt-1">
        {networkInfo && typeof networkInfo === 'object' && Object.keys(networkInfo).length > 0 ? (
          Object.entries(networkInfo).map(([iface, data]) => {
            const d = data as { ip: string; rxRate: number; txRate: number };
            return (
              <div key={iface} className="text-sm font-bold text-pink-200">
                <span className="text-pink-100">{iface}:</span> {d.ip}
                <span className="text-xs text-gray-400 ml-2">↓ {(d.rxRate/1048576).toFixed(2)} Mo/s</span>
                <span className="text-xs text-gray-400 ml-2">↑ {(d.txRate/1048576).toFixed(2)} Mo/s</span>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-400">N/A</div>
        )}
      </div>
    </div>
  );
};

export default NetworkInfoCard;
