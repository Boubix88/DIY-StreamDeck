import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cpu, HardDrive, Wifi, Volume2, RefreshCw, Zap, Clock, Monitor, Settings, Activity } from 'react-feather';
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

// Styles globaux pour les cartes
const cardStyle = "rounded-xl overflow-hidden backdrop-blur-sm bg-opacity-20 shadow-lg border transition-all duration-300 hover:shadow-xl";
const cardHeaderStyle = "flex items-center justify-between px-4 py-3 border-b";
const cardContentStyle = "p-4";
const glowEffect = "hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]";
const accentBorders = {
  cpu: "border-cyan-500/50",
  gpu: "border-purple-500/50",
  ram: "border-blue-500/50",
  network: "border-green-500/50",
  spotify: "border-pink-500/50",
  control: "border-amber-500/50",
  grid: "border-indigo-500/30",
  preview: "border-emerald-500/50",
  monitor: "border-gray-500/30"
};
const accentGlows = {
  cpu: "hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]",
  gpu: "hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]",
  ram: "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  network: "hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]",
  spotify: "hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]",
  control: "hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]",
  grid: "hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]",
  preview: "hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]",
  monitor: "hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]"
};
const accentText = {
  cpu: "text-cyan-400",
  gpu: "text-purple-400",
  ram: "text-blue-400",
  network: "text-green-400",
  spotify: "text-pink-400",
  control: "text-amber-400",
  grid: "text-indigo-400",
  preview: "text-emerald-400",
  monitor: "text-gray-400"
};
const accentBg = {
  cpu: "bg-cyan-900/20",
  gpu: "bg-purple-900/20",
  ram: "bg-blue-900/20",
  network: "bg-green-900/20",
  spotify: "bg-pink-900/20",
  control: "bg-amber-900/20",
  grid: "bg-indigo-900/10",
  preview: "bg-emerald-900/20",
  monitor: "bg-gray-900/20"
};

// Types pour les composants UI
interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

interface StatusBadgeProps {
  connected: boolean;
}

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  accentColor?: string;
}

// Composant pour les contrôles en haut
const ControlButton: React.FC<ControlButtonProps> = ({ active, onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} ${className}`}
  >
    {children}
  </button>
);

// Badge pour les statuts
const StatusBadge: React.FC<StatusBadgeProps> = ({ connected }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} ${connected ? 'animate-pulse' : ''}`}></div>
    <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
      {connected ? 'Connecté' : 'Déconnecté'}
    </span>
  </div>
);

// Titre de section
const SectionTitle: React.FC<SectionTitleProps> = ({ icon, title, accentColor = "text-indigo-400" }) => (
  <div className={`flex items-center gap-2 mb-2 ${accentColor}`}>
    {icon}
    <h3 className="font-bold uppercase tracking-wider text-sm">{title}</h3>
  </div>
);

// Dashboard principal "gamer"

interface ScreenData {
  s: {
    t: Array<Array<any>>;
    v: Array<any>;
    c: number[];
  };
}

enum screens {
  CPU = 0,
  GPU = 1,
  RAM = 2,
  NET = 3,
  VOLUME = 4
}

const App: React.FC = () => {
  const [timeInterval, setTimeInterval] = useState<number>(5000); // Mise à jour toutes les 5 secondes
  const [activeScreen, setActiveScreen] = useState<number>(screens.CPU);
  const { cpuInfo, cpuTemperature, gpuInfo, ramInfo, networkInfo } = useSystemInfo(timeInterval);
  const [lastScreen, setLastScreen] = useState<number>(screens.CPU);
  const [volumeInfo, setVolumeInfo] = useState<number | null>(null);
  // Référence pour suivre le timer de retour à l'écran précédent
  const returnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pour la preview, on passe uniquement le screenData de l'écran actif
  const  [previewData, setPreviewData] = useState<any>();
  
  // Mise à jour du volume séparément
  useEffect(() => {
    let isMounted = true;
    
    const updateVolume = async () => {
      try {
        const volume = await window.electronAPI.invoke('system:getVolume');
        if (isMounted) {
          setVolumeInfo(prevVolume => {
            // Si le volume a changé, on déclenche l'affichage du volume
            if (prevVolume !== volume) {
              // Annuler le timer précédent s'il existe
              if (returnTimerRef.current) {
                clearTimeout(returnTimerRef.current);
              }
              
              // Si on n'est pas déjà sur l'écran volume, sauvegarder l'écran actuel
              if (activeScreen !== screens.VOLUME) {
                setLastScreen(activeScreen);
              }
              
              // Basculer sur l'écran volume
              setActiveScreen(screens.VOLUME);
              
              // Planifier le retour à l'écran précédent dans 5 secondes
              returnTimerRef.current = setTimeout(() => {
                if (activeScreen === screens.VOLUME) {  // Ne revenir que si on est toujours sur l'écran volume
                  setActiveScreen(prevScreen => prevScreen === screens.VOLUME ? lastScreen : prevScreen);
                }
              }, 5000);
            }
            return volume;
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du volume:', error);
      }
    };
    
    // Première mise à jour
    updateVolume();
    
    // Mise à jour périodique (toutes les 100ms pour une meilleure réactivité)
    const volumeInterval = setInterval(updateVolume, 100);
    
    return () => {
      isMounted = false;
      clearInterval(volumeInterval);
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
      }
    };
  }, [activeScreen, lastScreen]);

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
  const [speed, setSpeed] = useState(50);

  // --- Construction dynamique du payload Arduino ---
  // (Inspiré du Python: data = {"s": screenData, "c": colorData, "clr": bool(clear) })
  function buildArduinoPayload() {
    // Génération dynamique des écrans à partir des vraies infos système
    // --- CPU ---
    const cpuScreen = {
      t: {
        t: [
          [20, 60, 3, `${cpuTemperature?.main ?? '--'}C`],
          [160, 60, 3, `${cpuInfo?.usage ?? '--'}%`],
          [20, 170, 3, `${cpuInfo?.frequency ? (cpuInfo.frequency / 1000).toFixed(1) + 'GHz' : '--'}`],
          [160, 170, 3, `${cpuInfo?.processCount ?? '--'}`],
          [90, 110, 4, `CPU`],
        ],
        c: "0000FF"
      },
      v: [
        ["M161 86H85V161H161ZM188 132H164V140H188V154H164V166H152V191H137V166H131V191H115V166H108V191H95V166H82V154H58V140H82V132H58V118H82V109H58V96H82V84H95V60H108V84H115V60H131V84H137V60H152V84H164V96H188V109H164V118H188V132", "0000FF"]
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
        [
          "M151 155V161H111V155H151ZM91 155H103V161H91V155ZM66 110V137H60V110H66ZM67 94H183V111L178 115V150L172 153H67V94M66 100H59V101H66V109H59V138H66V146H59V148H66V161H67V155H88V162H104V155H110V162H153V155H172L179 151V116L184 111V91H67V85H51V87H66V100Z",
          "FF0000"
        ]
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

    // --- Volume ---
    const center_x = 120, center_y = 120, radius_outer = 120, radius_inner = 105, total_bars = 13;
    const path_commands_active: string[] = [];
    const path_commands_inactive: string[] = [];
    const active_bars = Math.max(0, Math.min(total_bars, Number((volumeInfo || 0) * total_bars / 100)));

    for (let i = 0; i < total_bars; i++) {
        // Angle pour chaque barre
      const angle = (2 * Math.PI / total_bars) * i + Math.PI / 2;

        // Calcul des points en coordonnées polaires -> cartésiennes
      const x_outer = Math.round(center_x + radius_outer * Math.cos(angle));
      const y_outer = Math.round(center_y + radius_outer * Math.sin(angle));
      const x_inner = Math.round(center_x + radius_inner * Math.cos(angle));
      const y_inner = Math.round(center_y + radius_inner * Math.sin(angle));

        // Ajouter les barres actives uniquement
      if (i < active_bars) {
        path_commands_active.push(`M ${x_inner} ${y_inner} L ${x_outer} ${y_outer}`);
      } else {
        path_commands_inactive.push(`M ${x_inner} ${y_inner} L ${x_outer} ${y_outer}`);
        //path_commands_inactive.append(f"M {x_inner} {y_inner} L {x_inner} {y_outer}") // Points
      }
    }

    const volumeScreen = {
      t: {
        t: [
          [
            120 - (String(volumeInfo || '0').length * (6 * 7)) / 2,
            150,
            7,
            String(volumeInfo || '0')
          ]
        ],
        c: "FFFFFF",
      },
      v: [
        [
          "M145 35 L147 35 L150 39 V132L148 133 L146 134 L134 130 L118 116 L108 103V69L116 56 L129 42Z M83 64 H102 V108 H83V64",
          "FFFFFF"
        ],
        [
          ' '.concat(path_commands_inactive.join(' ')) + 'Z',
          "808080"
        ],
        [
          ' '.concat(path_commands_active.join(' ')) + 'Z',
          "0000FF"
        ]
      ]
    };

    // --- Mapping écran actif ---
    const screens = [cpuScreen, gpuScreen, ramScreen, netScreen, volumeScreen];
    // --- RGB/Mode/Brightness/Speed ---
    // Format: [mode, r, g, b, brightness, speed]
    const colorData = [mode + 1, color.r, color.g, color.b, speed];
    // --- Clear flag (ex: reset écran) ---
    const clear = false;
    
    return {
      s: screens[activeScreen] || cpuScreen,
      c: colorData,
      clr: clear
    };
  }

  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  
  useEffect(() => {
    if (!connectedPort) return;
    const interval = setInterval(() => {
      // On reconstruit le payload à chaque tick
      const payload = buildArduinoPayload();
      // Appel à la fonction qui envoie sur le port série
      window.electronAPI.invoke('serial:send', payload);
      // Pour debug :
      // console.log('Payload envoyé à l\'Arduino :', payload);
    }, 50); // toutes les 50ms
  
    //return () => clearInterval(interval);
  }, [connectedPort, cpuInfo, gpuInfo, ramInfo, networkInfo, mode, color, speed, activeScreen]);
  
  // --- Gestion port série et terminal ---
  const [ports, setPorts] = useState<{ path: string; manufacturer?: string }[]>([]);
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
    const interval = setInterval(refreshPorts, 500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
  const arduinoPayload = useMemo(() => {
    const payload = buildArduinoPayload();

    setPreviewData(payload.s);

    // Si l'écran actif est différent du dernier écran, on ajoute l'indicateur de nettoyage
    if (activeScreen !== lastScreen) {
      payload.clr = true;
      setLastScreen(activeScreen);
    } else {
      payload.clr = false;
    }
    return payload;
  }, [cpuInfo, gpuInfo, ramInfo, networkInfo, volumeInfo, mode, color, speed, activeScreen, lastScreen]);

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
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#111827] min-h-screen flex flex-col">
      {/* Header avec effet cyberpunk */}
      <header className="w-full py-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 z-0"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YmE0ZjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-20 z-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo et titre */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="mr-4 bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                <Zap size={28} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
                style={{ textShadow: '0 0 30px rgba(56, 189, 248, 0.5)' }}>
                STREAMDECK
                <span className="text-xs align-top ml-1 font-mono bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">PRO</span>
              </h1>
            </div>
            
            {/* Contrôles principaux */}
            <div className="flex flex-wrap gap-3 justify-center">
              {/* Port série avec design amélioré */}
              <div className={`${cardStyle} ${accentBorders.control} ${accentBg.control} ${accentGlows.control} px-4 py-2 flex items-center gap-2`}>
                <Settings size={16} className={accentText.control} />
                <span className={`${accentText.control} font-medium text-sm`}>Port:</span>
                <select
                  className="bg-gray-900/60 text-white text-sm py-1 px-2 rounded border border-gray-700 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none"
                  value={connectedPort || ''}
                  onChange={e => {
                    const port = e.target.value;
                    if (port) handleConnect(port);
                    else handleDisconnect();
                  }}
                >
                  <option value="">Sélectionner</option>
                  {ports.map(port => (
                    <option key={port.path} value={port.path}>
                      {port.path.split('\\')?.[2] || port.path}
                    </option>
                  ))}
                </select>
                <StatusBadge connected={!!connectedPort} />
              </div>
              
              {/* Rafraîchissement */}
              <div className={`${cardStyle} ${accentBorders.network} ${accentBg.network} ${accentGlows.network} px-4 py-2 flex items-center gap-2`}>
                <RefreshCw size={16} className={accentText.network} />
                <span className={`${accentText.network} font-medium text-sm`}>Refresh:</span>
                <select
                  className="bg-gray-900/60 text-white text-sm py-1 px-2 rounded border border-gray-700 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none"
                  value={timeInterval}
                  onChange={e => setTimeInterval(Number(e.target.value))}
                >
                  <option value={50}>50ms</option>
                  <option value={100}>100ms</option>
                  <option value={200}>200ms</option>
                  <option value={500}>500ms</option>
                  <option value={1000}>1s</option>
                  <option value={2000}>2s</option>
                  <option value={5000}>5s</option>
                </select>
              </div>
              
              {/* Écran Arduino */}
              <div className={`${cardStyle} ${accentBorders.preview} ${accentBg.preview} ${accentGlows.preview} px-4 py-2 flex items-center gap-2`}>
                <Monitor size={16} className={accentText.preview} />
                <span className={`${accentText.preview} font-medium text-sm`}>Écran:</span>
                <div className="flex items-center bg-gray-900/60 rounded border border-gray-700 overflow-hidden">
                  <button
                    className="px-2 py-1 text-white hover:bg-emerald-800/30 transition-colors"
                    onClick={() => setActiveScreen(s => (s - 1 + 5) % 5)}
                  >‹</button>
                  <span className="px-3 font-bold text-white">{activeScreen + 1}</span>
                  <button
                    className="px-2 py-1 text-white hover:bg-emerald-800/30 transition-colors"
                    onClick={() => setActiveScreen(s => (s + 1) % 5)}
                  >›</button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Avertissement si intervalle trop court */}
          {timeInterval < 1000 && (
            <div className="mt-3 text-xs text-yellow-300 bg-yellow-900/30 border border-yellow-600/30 rounded-md px-3 py-1.5 flex items-center gap-2 max-w-md mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Un intervalle &lt; 1s peut affecter les performances</span>
            </div>
          )}
        </div>
      </header>
      {/* Dashboard principal avec grille responsive et design gamer */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
          {/* Section principale - Première rangée */}
          <div className={`md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5`}>
            {/* KeyGrid - Grille de boutons */}
            <div className={`md:col-span-3 ${cardStyle} ${accentBorders.grid} ${accentBg.grid} ${accentGlows.grid}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.grid}`}>
                <SectionTitle 
                  icon={<Activity size={18} className={accentText.grid} />}
                  title="Contrôles StreamDeck"
                  accentColor={accentText.grid}
                />
              </div>
              <div className={cardContentStyle}>
                <KeyGrid
                  assignments={assignments}
                  onAssign={handleAssign}
                  onLaunch={handleLaunch}
                  onDelete={handleDelete}
                />
              </div>
            </div>
            
            {/* Contrôle RGB */}
            <div className={`md:col-span-1 ${cardStyle} ${accentBorders.control} ${accentBg.control} ${accentGlows.control}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.control}`}>
                <SectionTitle 
                  icon={<Settings size={18} className={accentText.control} />}
                  title="RGB LED"
                  accentColor={accentText.control}
                />
              </div>
              <div className={cardContentStyle}>
                <RgbControl
                  mode={mode}
                  color={color}
                  speed={speed}
                  onModeChange={setMode}
                  onColorChange={setColor}
                  onSpeedChange={setSpeed}
                />
              </div>
            </div>
            
            {/* Prévisualisation Arduino */}
            <div className={`md:col-span-1 ${cardStyle} ${accentBorders.preview} ${accentBg.preview} ${accentGlows.preview}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.preview}`}>
                <SectionTitle 
                  icon={<Monitor size={18} className={accentText.preview} />}
                  title="Écran"
                  accentColor={accentText.preview}
                />
              </div>
              <div className={`${cardContentStyle} flex justify-center items-center`}>
                <ArduinoPreview previewData={previewData} activeScreen={activeScreen} />
              </div>
            </div>
            
            {/* Spotify */}
            <div className={`md:col-span-3 ${cardStyle} ${accentBorders.spotify} ${accentBg.spotify} ${accentGlows.spotify}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.spotify}`}>
                <SectionTitle 
                  icon={
                    <svg className={accentText.spotify} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM16.19 16.19C16.04 16.34 15.84 16.42 15.64 16.42C15.44 16.42 15.24 16.34 15.09 16.19C14.79 15.89 14.79 15.41 15.09 15.11C16.38 13.82 16.38 11.71 15.09 10.42C14.79 10.12 14.79 9.64 15.09 9.34C15.39 9.04 15.87 9.04 16.17 9.34C17.96 11.13 17.96 14.4 16.19 16.19ZM14.76 14.76C14.61 14.91 14.41 14.99 14.21 14.99C14.01 14.99 13.81 14.91 13.66 14.76C13.36 14.46 13.36 13.98 13.66 13.68C14.25 13.09 14.25 12.15 13.66 11.56C13.36 11.26 13.36 10.78 13.66 10.48C13.96 10.18 14.44 10.18 14.74 10.48C15.83 11.57 15.83 13.67 14.76 14.76ZM11.45 12.89C10.36 12.89 9.47 12 9.47 10.91C9.47 9.82 10.36 8.93 11.45 8.93C12.54 8.93 13.43 9.82 13.43 10.91C13.43 12 12.54 12.89 11.45 12.89Z" fill="currentColor"/>
                    </svg>
                  }
                  title="Spotify"
                  accentColor={accentText.spotify}
                />
              </div>
              <div className={cardContentStyle}>
                <SpotifyCard track={spotifyTrack} />
              </div>
            </div>
          </div>
          
          {/* Barre latérale - Infos système */}
          <div className="md:col-span-2 grid grid-cols-1 gap-4 md:gap-5">
            {/* CPU */}
            <div className={`${cardStyle} ${accentBorders.cpu} ${accentBg.cpu} ${accentGlows.cpu}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.cpu}`}>
                <SectionTitle 
                  icon={<Cpu size={18} className={accentText.cpu} />}
                  title="CPU"
                  accentColor={accentText.cpu}
                />
              </div>
              <div className={cardContentStyle}>
                <CpuInfoCard cpuInfo={cpuInfo} cpuTemperature={cpuTemperature} />
              </div>
            </div>
            
            {/* GPU */}
            <div className={`${cardStyle} ${accentBorders.gpu} ${accentBg.gpu} ${accentGlows.gpu}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.gpu}`}>
                <SectionTitle 
                  icon={<svg className={accentText.gpu} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 9.5H15V14.5H9V9.5Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 20V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 20V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 20V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>}
                  title="GPU"
                  accentColor={accentText.gpu}
                />
              </div>
              <div className={cardContentStyle}>
                <GpuInfoCard gpuInfo={gpuInfo} />
              </div>
            </div>
            
            {/* RAM */}
            <div className={`${cardStyle} ${accentBorders.ram} ${accentBg.ram} ${accentGlows.ram}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.ram}`}>
                <SectionTitle 
                  icon={<HardDrive size={18} className={accentText.ram} />}
                  title="Mémoire"
                  accentColor={accentText.ram}
                />
              </div>
              <div className={cardContentStyle}>
                <RamInfoCard ramInfo={ramInfo} />
              </div>
            </div>
            
            {/* Network */}
            <div className={`${cardStyle} ${accentBorders.network} ${accentBg.network} ${accentGlows.network}`}>
              <div className={`${cardHeaderStyle} ${accentBorders.network}`}>
                <SectionTitle 
                  icon={<Wifi size={18} className={accentText.network} />}
                  title="Réseau"
                  accentColor={accentText.network}
                />
              </div>
              <div className={cardContentStyle}>
                <NetworkInfoCard networkInfo={networkInfo} />
              </div>
            </div>
          </div>
          
          {/* Terminal - Pleine largeur */}
          <div className={`md:col-span-6 ${cardStyle} ${accentBorders.monitor} ${accentBg.monitor} ${accentGlows.monitor}`}>
            <div className={`${cardHeaderStyle} ${accentBorders.monitor}`}>
              <SectionTitle 
                icon={<svg className={accentText.monitor} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 8L10 11L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2"/>
                </svg>}
                title="Terminal"
                accentColor={accentText.monitor}
              />
              <button 
                onClick={handleClearLogs}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
              >
                Effacer
              </button>
            </div>
            <div className={cardContentStyle}>
              <SerialMonitor logs={serialLogs} onClear={handleClearLogs} maxHeight="120px" />
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-8 mb-4 text-gray-500 text-xs opacity-60 text-center w-full">
        DIY StreamDeck &copy; {new Date().getFullYear()} | Dashboard Gamer UI
      </footer>
    </div>
  );
};

export default App;


// (Plus de InfoCard, voir SystemInfoCards)
