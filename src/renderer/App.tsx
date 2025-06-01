import React, { useState, useEffect, useMemo } from 'react';
import CpuInfoCard from './components/CpuInfoCard';
import GpuInfoCard from './components/GpuInfoCard';
import RamInfoCard from './components/RamInfoCard';
import NetworkInfoCard from './components/NetworkInfoCard';
import KeyGrid from './components/KeyGrid';
import ArduinoPreview from './components/ArduinoPreview';
import RgbControl from './components/RgbControl';
import PortSelector from './components/PortSelector';
import SerialMonitor from './components/SerialMonitor';
import SpotifyCard from './components/SpotifyCard';
import useSystemInfo from './hooks/useSystemInfo';

// Dashboard principal "gamer"

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
  const [timeInterval, setTimeInterval] = useState<number>(1000);
  const [activeScreen, setActiveScreen] = useState<number>(0);
  const { cpuInfo, cpuTemperature, gpuInfo, ramInfo, networkInfo } = useSystemInfo(timeInterval);

  // Assignations locales (à relier à la persistance plus tard)
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // Fonctions pour gérer l'assignation/lancement/suppression (placeholders)
  const handleAssign = (i: number, j: number) => {
    const key = `${i},${j}`;
    // TODO: ouvrir un vrai dialogue de sélection
    const fakeApp = prompt('Chemin de l\'application à assigner ?');
    if (fakeApp) setAssignments(a => ({ ...a, [key]: fakeApp }));
  };
  const handleLaunch = (i: number, j: number) => {
    const key = `${i},${j}`;
    alert("Lancer l'application assignée à la touche " + key + ": " + assignments[key] || 'Aucune');
  };
  const handleDelete = (i: number, j: number) => {
    const key = `${i},${j}`;
    setAssignments(a => { const b = { ...a }; delete b[key]; return b; });
  };

  // --- RGB State ---
  const [mode, setMode] = useState(0);
  const [color, setColor] = useState({ r: 0, g: 255, b: 128 });
  const [speed, setSpeed] = useState(10);

  // --- Construction dynamique du payload Arduino ---
  // (Inspiré du Python: data = {"s": screenData, "c": colorData, "clr": bool(clear) })
  function buildArduinoPayload() {
    // Génération dynamique des écrans à partir des vraies infos système
    // --- CPU ---
    const cpuScreen = {
      t: {
        t: [
          [60, 40, 4, `CPU ${cpuInfo?.usage ?? '--'}%`],
          [120, 80, 3, `Freq ${cpuInfo?.frequency ? cpuInfo.frequency + 'GHz' : '--'}`],
          [120, 120, 2, `Proc ${cpuInfo?.processCount ?? '--'}`],
        ],
        c: "00FF00"
      },
      v: [
        ["M 10 120 L 120 10 L 200 120 Z", "FF0000"] // Ex: triangle décoratif
      ]
    };
    // --- GPU ---
    const gpuScreen = {
      t: {
        t: [
          [80, 70, 5, `GPU ${gpuInfo?.usage ?? '--'}%`],
          [100, 120, 2, `Temp ${gpuInfo?.temperature ?? '--'}°C`],
          [120, 40, 2, `VRAM ${gpuInfo?.vramUsed ?? '--'}MB`],
        ],
        c: "00BFFF"
      },
      v: [
        ["M 50 50 L 180 50 L 115 180 Z", "FFA500"]
      ]
    };
    // --- RAM ---
    const ramScreen = {
      t: {
        t: [
          [60, 60, 4, `RAM`],
          [120, 100, 3, `${ramInfo?.used ?? '--'} / ${ramInfo?.total ?? '--'} GB`],
        ],
        c: "FF00FF"
      },
      v: [
        ["M 30 30 L 210 30 L 210 210 L 30 210 Z", "00FF00"]
      ]
    };
    // --- Réseau ---
    const netScreen = {
      t: {
        t: [
          [60, 60, 4, `Net`],
          [120, 100, 2, `↓${networkInfo?.rxRate ?? '--'}MB/s`],
          [120, 120, 2, `↑${networkInfo?.txRate ?? '--'}MB/s`],
        ],
        c: "FFFF00"
      },
      v: [
        ["M 50 50 L 180 50 L 180 180 L 50 180 Z", "888888"]
      ]
    };
    // --- Mapping écran actif ---
    const screens = [cpuScreen, gpuScreen, ramScreen, netScreen];
    // --- RGB/Mode/Brightness/Speed ---
    // Format: [mode, r, g, b, brightness, speed]
    const colorData = [mode, color.r, color.g, color.b, 100, speed];
    // --- Clear flag (ex: reset écran) ---
    const clear = false; // À relier à un bouton plus tard
    // --- Payload complet ---
    return {
      s: screens[activeScreen] || cpuScreen,
      c: colorData,
      clr: clear
    };
  }
  
  // --- Gestion port série et terminal ---
  const [ports, setPorts] = useState<{ path: string; manufacturer?: string }[]>([]);
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Rafraîchir la liste des ports série dynamiquement
  useEffect(() => {
    let mounted = true;
    async function refreshPorts() {
      try {
        const portList = await window.electronAPI.invoke('serial:list');
        if (mounted) setPorts(portList);
      } catch (e) {
        setPorts([]);
      }
    }
    refreshPorts();
    const interval = setInterval(refreshPorts, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Connexion série (IPC)
  const handleConnect = async (port: string) => {
    setIsConnecting(true);
    try {
      const ok = await window.electronAPI.invoke('serial:connect', port);
      if (ok) {
        setConnectedPort(port);
        setSerialLogs(l => [...l, `[INFO] Connecté à ${port}`]);
      } else {
        setSerialLogs(l => [...l, `[ERROR] Échec connexion à ${port}`]);
      }
    } catch (e: any) {
      setSerialLogs(l => [...l, `[ERROR] ${e.message || e}`]);
    }
    setIsConnecting(false);
  };
  // Déconnexion série
  const handleDisconnect = async () => {
    try {
      await window.electronAPI.invoke('serial:disconnect');
      setConnectedPort(null);
      setSerialLogs(l => [...l, `[INFO] Déconnecté`]);
    } catch (e: any) {
      setSerialLogs(l => [...l, `[ERROR] ${e.message || e}`]);
    }
  };
  // Nettoyer logs
  const handleClearLogs = () => setSerialLogs([]);

  // Écoute logs série (data reçue)
  useEffect(() => {
    // Utilise l'API typée du preload
    const unsubscribe = window.electronAPI.onSerialData((msg: string) => {
      setSerialLogs(l => [...l, msg]);
    });
    return () => { unsubscribe && unsubscribe(); };
  }, []);

  // Ce payload sera envoyé à l'Arduino (CBOR côté main)
  const arduinoPayload = useMemo(() => buildArduinoPayload(), [cpuInfo, gpuInfo, ramInfo, networkInfo, mode, color, speed, activeScreen]);

  // Pour la preview, on passe uniquement le screenData de l'écran actif
  const previewData = [arduinoPayload.s];

  // Envoi automatique du payload à l'Arduino (CBOR côté main)
  useEffect(() => {
    if (!connectedPort) return;
    let stopped = false;
    const sendLoop = async () => {
      while (!stopped && connectedPort) {
        try {
          await window.electronAPI.invoke('serial:send', arduinoPayload);
        } catch (e: any) {
          setSerialLogs(l => [...l, `[ERROR] Envoi série: ${e.message || e}`]);
        }
        await new Promise(res => setTimeout(res, timeInterval));
      }
    };
    sendLoop();
    return () => { stopped = true; };
  }, [connectedPort, arduinoPayload, timeInterval]);



  // Mock Spotify data (à remplacer par vrai hook plus tard)
  const spotifyTrack = {
    title: 'Cyberpunk Dreams',
    artist: 'The Midnight',
    album: 'Monsters',
    albumArt: '',
    isPlaying: true
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#111827] flex flex-col items-center justify-center">
      <div className="w-full flex flex-col items-center mb-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-green-400 tracking-widest uppercase text-center"
          style={{ textShadow: '0 0 32px #22d3ee, 0 0 8px #16f2b3' }}>
          STREAMDECK
        </h2>
        <div className="flex flex-row flex-wrap justify-center items-center gap-6 mt-4 px-4">
          {/* Connexion série */}
          <div className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 shadow border border-yellow-400">
            <span className="text-yellow-300 font-bold mr-2">Port série :</span>
            <select
              className="bg-gray-700 text-white p-1 rounded"
              value={connectedPort || ''}
              onChange={e => {
                const port = e.target.value;
                if (port) handleConnect(port);
                else handleDisconnect();
              }}
            >
              <option value="">Sélectionner un port</option>
              {ports.map(port => (
                <option key={port.path} value={port.path}>
                  {port.path} - {port.manufacturer || 'Inconnu'}
                </option>
              ))}
            </select>
            <div className={`w-4 h-4 rounded-full ml-2 ${connectedPort ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs text-gray-400 ml-1">{connectedPort ? 'Connecté' : 'Déconnecté'}</span>
          </div>
          {/* Sélecteur d'intervalle de rafraîchissement */}
          <div className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 shadow border border-blue-400">
            <span className="text-blue-300 font-bold mr-2">Rafraîchissement :</span>
            <select
              className="bg-gray-700 text-white p-1 rounded"
              value={timeInterval}
              onChange={e => setTimeInterval(Number(e.target.value))}
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          </div>
          {/* Sélecteur écran actif */}
          <div className="flex flex-row items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 shadow border border-purple-400">
            <span className="text-purple-300 font-bold mr-2">Écran Arduino :</span>
            <button
              className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-500"
              onClick={() => setActiveScreen(s => (s - 1 + 5) % 5)}
            >⟨</button>
            <span className="text-white font-bold text-lg">{activeScreen + 1}</span>
            <button
              className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-500"
              onClick={() => setActiveScreen(s => (s + 1) % 5)}
            >⟩</button>
          </div>
        </div>
        {/* Avertissement si intervalle trop court */}
        {timeInterval < 1000 && (
          <div className="mt-2 text-xs text-yellow-400 bg-yellow-900 rounded px-2 py-1 animate-pulse">
            Attention : Un intervalle &lt; 1s peut ralentir linterface !
          </div>
        )}
      </div>
      {/* Nouveau layout grid 6 colonnes, inspiré de l'exemple */}
      <div className="w-full px-8 grid grid-cols-5 gap-8">
        {/* RGB à gauche */}
        <div className="col-span-1 row-span-1 aspect-[1/1]">
          <RgbControl
            mode={mode}
            color={color}
            speed={speed}
            onModeChange={setMode}
            onColorChange={setColor}
            onSpeedChange={setSpeed}
          />
        </div>
        {/* KeyGrid centré, large */}
        <div className="col-span-2 row-span-1 aspect-[2/1]">
          <KeyGrid
            assignments={assignments}
            onAssign={handleAssign}
            onLaunch={handleLaunch}
            onDelete={handleDelete}
          />
        </div>
        {/* ArduinoPreview + Spotify à droite */}
        <div className="col-span-1 row-span-1 aspect-[1/1]">
          <ArduinoPreview previewData={previewData} activeScreen={activeScreen} />
        </div>
        <div className="col-span-2 row-span-1 aspect-[2/1]">
          <SpotifyCard track={spotifyTrack} />
        </div>
        <div className="col-span-1 row-span-2 aspect-[1/2]">
          <NetworkInfoCard networkInfo={networkInfo} />
        </div>
        {/* SerialMonitor pleine largeur */}
        <div className="col-span-2 row-span-1 aspect-[2/1]">
          <SerialMonitor logs={serialLogs} onClear={handleClearLogs} maxHeight="120px" />
        </div>
        {/* System Info Cards (CPU, GPU, RAM, Network) en ligne, pleine largeur */}
        <div className="col-span-1 row-span-1 aspect-[1/1]">
          <CpuInfoCard cpuInfo={cpuInfo} cpuTemperature={cpuTemperature} />
        </div>
        <div className="col-span-1 row-span-1 aspect-[1/1]">
          <GpuInfoCard gpuInfo={gpuInfo} />
        </div>
        <div className="col-span-1 row-span-1 aspect-[1/1]">
          <RamInfoCard ramInfo={ramInfo} />
        </div>
      </div>
      <footer className="mt-8 mb-4 text-gray-500 text-xs opacity-60 text-center w-full">
        DIY StreamDeck &copy; {new Date().getFullYear()} | Dashboard Gamer UI
      </footer>
    </div>
  );
};

export default App;


// (Plus de InfoCard, voir SystemInfoCards)
