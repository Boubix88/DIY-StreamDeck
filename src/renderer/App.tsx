import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Wifi, Volume2, Music, Monitor, Terminal } from 'react-feather';
import { useSerial } from './hooks/useSerial';
import SerialMonitor from './components/SerialMonitor';
import useSystemInfo from './hooks/useSystemInfo';
import useSpotify from './hooks/useSpotify';
import useRgbControl from './hooks/useRgbControl';
import useVolumeControl from './hooks/useVolumeControl';
import { MODE_STATIC, MODE_SCROLLING_STATIC, MODE_SCROLLING_RGB } from '@shared/constants';

interface ScreenData {
  s: {
    title: string;
    items: Array<{
      label: string;
      value: string | number;
      icon?: string;
    }>;
  };
  c?: number[];  // Optional RGB data
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cpu');
  const { 
    ports, 
    connectedPort, 
    connectToPort, 
    disconnectFromPort, 
    sendData, 
    serialLogs, 
    clearLogs 
  } = useSerial();
  const { cpuInfo, gpuInfo, ramInfo, networkInfo } = useSystemInfo();
  const { currentTrack, isPlaying, togglePlayPause } = useSpotify();
  const { 
    color, 
    mode, 
    speed, 
    updateColor, 
    updateMode, 
    updateSpeed,
    setHexColor,
    getHexColor,
    MODE_STATIC,
    MODE_SCROLLING_STATIC,
    MODE_SCROLLING_RGB
  } = useRgbControl();
  const { volume, setVolume } = useVolumeControl();

  // Référence pour stocker les dernières données envoyées
  const lastSentData = useRef<{data: any, tab: string}>({data: null, tab: ''});

  // Effet pour envoyer les données à l'Arduino lorsque les informations changent
  useEffect(() => {
    if (!connectedPort) return;

    const sendUpdate = () => {
      let screenData: ScreenData;
      
      // Préparer les données en fonction de l'onglet actif
      switch (activeTab) {
        case 'cpu':
          screenData = {
            s: {
              title: 'CPU',
              items: [
                { label: 'Temp', value: `${Math.round(cpuInfo.temperature)}°C` },
                { label: 'Usage', value: `${Math.round(cpuInfo.usage)}%` },
                { label: 'Freq', value: `${(cpuInfo.frequency / 1000).toFixed(1)} GHz` },
                { label: 'Processes', value: cpuInfo.processes },
              ],
            },
          };
          break;
          
        case 'gpu':
          screenData = {
            s: {
              title: 'GPU',
              items: [
                { label: 'Temp', value: `${Math.round(gpuInfo.temperature)}°C` },
                { label: 'Usage', value: `${Math.round(gpuInfo.usage)}%` },
                { label: 'Freq', value: `${Math.round(gpuInfo.frequency)} MHz` },
                { label: 'Memory', value: `${Math.round(gpuInfo.memory)} MB` },
              ],
            },
          };
          break;
          
        case 'spotify':
          // Ne pas envoyer de mises à jour si aucune piste n'est en cours de lecture
          if (!currentTrack.title && !currentTrack.artist) return;
          
          screenData = {
            s: {
              title: currentTrack.title ? 'Now Playing' : 'Paused',
              items: [
                { label: 'Title', value: currentTrack.title || 'No track' },
                { label: 'Artist', value: currentTrack.artist || 'Unknown' },
                { label: 'Album', value: currentTrack.album || 'Unknown' },
                { label: 'Status', value: isPlaying ? 'Playing' : 'Paused' },
              ],
            },
          };
          break;
          
        case 'network':
          screenData = {
            s: {
              title: 'Network',
              items: [
                { label: 'Download', value: `${networkInfo.download.toFixed(1)} MB/s` },
                { label: 'Upload', value: `${networkInfo.upload.toFixed(1)} MB/s` },
                { label: 'IP', value: networkInfo.ip || 'Disconnected' },
                { label: 'Status', value: networkInfo.status },
              ],
            },
          };
          break;
          
        case 'volume':
          screenData = {
            s: {
              title: 'Volume',
              items: [
                { label: 'Level', value: `${Math.round(volume)}%` },
                { label: '', value: '', icon: 'volume' },
                { label: '', value: '' },
                { label: '', value: '' },
              ],
            },
          };
          break;
          
        default:
          screenData = { s: { title: 'StreamDeck', items: [] } };
      }
      
      // Ajouter les données RGB si nécessaire
      let rgbData: number[] = [];
      if (mode === MODE_STATIC) {
        rgbData = [MODE_STATIC, color.r, color.g, color.b];
      } else if (mode === MODE_SCROLLING_STATIC) {
        rgbData = [MODE_SCROLLING_STATIC, color.r, color.g, color.b, speed];
      } else if (mode === MODE_SCROLLING_RGB) {
        rgbData = [MODE_SCROLLING_RGB, 0, 0, 0, speed];
      }
      
      if (rgbData.length > 0) {
        screenData.c = rgbData;
      }

      // Vérifier si les données ont changé par rapport à la dernière fois
      const currentData = JSON.stringify(screenData);
      const lastData = JSON.stringify(lastSentData.current.data);
      
      // Ne pas envoyer si les données sont identiques et que l'onglet n'a pas changé
      if (currentData === lastData && activeTab === lastSentData.current.tab) {
        return;
      }
      
      // Mettre à jour les dernières données envoyées
      lastSentData.current = {data: screenData, tab: activeTab};
      
      // Envoyer les données à l'Arduino
      sendData(screenData);
    };
    
    // Exécuter immédiatement et configurer un intervalle pour les mises à jour
    sendUpdate();
    const interval = setInterval(sendUpdate, 1000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, [activeTab, connectedPort, cpuInfo, gpuInfo, currentTrack, isPlaying, networkInfo, volume, mode, color, speed, sendData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DIY StreamDeck</h1>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <select
              className="bg-gray-800 text-white p-2 rounded w-full"
              value={connectedPort || ''}
              onChange={(e) => {
                const port = e.target.value;
                if (port) {
                  connectToPort(port);
                } else {
                  disconnectFromPort();
                }
              }}
            >
              <option value="">Select a port</option>
              {ports.map((port) => (
                <option key={port.path} value={port.path}>
                  {port.path} - {port.manufacturer || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          <div className={`w-4 h-4 rounded-full ${connectedPort ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span>{connectedPort ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <nav className="flex-col space-y-2 mb-6 overflow-y-auto pb-2">
          <button
            onClick={() => setActiveTab('cpu')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'cpu' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Cpu size={16} />
            <span>CPU</span>
          </button>
          <button
            onClick={() => setActiveTab('gpu')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'gpu' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Monitor size={16} />
            <span>GPU</span>
          </button>
          <button
            onClick={() => setActiveTab('ram')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'ram' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <span>RAM</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'network' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Wifi size={16} />
            <span>Réseau</span>
          </button>
          <button
            onClick={() => setActiveTab('spotify')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'spotify' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Music size={16} />
            <span>Spotify</span>
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'volume' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Volume2 size={16} />
            <span>Volume</span>
          </button>
          <button
            onClick={() => setActiveTab('serial')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === 'serial' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Terminal size={16} />
            <span>Moniteur Série</span>
          </button>
        </nav>

          {/* RGB Controls */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">LED Control</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mode</label>
                <select
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={mode}
                  onChange={(e) => updateMode(parseInt(e.target.value))}
                >
                  <option value={MODE_STATIC}>Static</option>
                  <option value={MODE_SCROLLING_STATIC}>Scrolling Static</option>
                  <option value={MODE_SCROLLING_RGB}>Rainbow</option>
                </select>
              </div>

              {mode !== MODE_SCROLLING_RGB && (
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    className="w-full h-10"
                    value={`#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateColor({
                        r: parseInt(hex.slice(1, 3), 16),
                        g: parseInt(hex.slice(3, 5), 16),
                        b: parseInt(hex.slice(5, 7), 16)
                      });
                    }}
                  />
                </div>
              )}

              {(mode === MODE_SCROLLING_STATIC || mode === MODE_SCROLLING_RGB) && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Speed: {speed}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={speed}
                    onChange={(e) => updateSpeed(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 bg-gray-800 rounded-lg p-6">
          {activeTab === 'cpu' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">CPU Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Temperature" value={`${cpuInfo.temperature}°C`} />
                <InfoCard label="Usage" value={`${cpuInfo.usage}%`} />
                <InfoCard label="Frequency" value={`${cpuInfo.frequency} GHz`} />
                <InfoCard label="Processes" value={cpuInfo.processes} />
              </div>
            </div>
          )}

          {activeTab === 'gpu' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">GPU Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Temperature" value={`${gpuInfo.temperature}°C`} />
                <InfoCard label="Usage" value={`${gpuInfo.usage}%`} />
                <InfoCard label="Frequency" value={`${gpuInfo.frequency} MHz`} />
                <InfoCard label="Memory Used" value={`${gpuInfo.memory} MB`} />
              </div>
            </div>
          )}

          {activeTab === 'spotify' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Now Playing</h2>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                  {currentTrack.albumArt ? (
                    <img
                      src={currentTrack.albumArt}
                      alt="Album Art"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music size={48} className="text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{currentTrack.title || 'Not Playing'}</h3>
                  <p className="text-gray-400">{currentTrack.artist || '—'}</p>
                  <p className="text-gray-500 text-sm">{currentTrack.album || '—'}</p>
                  <button
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Network Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Download" value={`${networkInfo.download} MB/s`} />
                <InfoCard label="Upload" value={`${networkInfo.upload} MB/s`} />
                <InfoCard label="IP Address" value={networkInfo.ip} />
                <InfoCard label="Status" value={networkInfo.status} />
              </div>
            </div>
          )}

          {activeTab === 'volume' && (
            <div className="flex flex-col items-center justify-center h-64">
              <h2 className="text-2xl font-bold mb-8">Volume Control</h2>
              <div className="w-64">
                <div className="flex items-center justify-between mb-2">
                  <Volume2 size={20} />
                  <span className="text-2xl font-bold">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'serial' && (
            <div className="h-full">
              <h2 className="text-2xl font-bold mb-4">Moniteur Série</h2>
              <div className="h-[calc(100%-3rem)]">
                <SerialMonitor 
                  logs={serialLogs} 
                  onClear={clearLogs}
                  maxHeight="100%"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant d'affichage des informations
const InfoCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-700 p-4 rounded-lg">
    <h3 className="text-sm font-medium text-gray-400 mb-1">{label}</h3>
    <p className="text-xl font-semibold">{value}</p>
  </div>
);

export default App;
