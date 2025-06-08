import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cpu, HardDrive, Wifi, Volume2 } from 'react-feather';
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
  
    return () => clearInterval(interval);
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
    // Si l'écran actif est différent du dernier écran, on ajoute l'indicateur de nettoyage
    if (activeScreen !== lastScreen) {
      payload.clr = true;
      setLastScreen(activeScreen);
    } else {
      payload.clr = false;
    }
    return payload;
  }, [cpuInfo, gpuInfo, ramInfo, networkInfo, volumeInfo, mode, color, speed, activeScreen, lastScreen]);

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
              <option value={50}>50ms</option>
              <option value={100}>100ms</option>
              <option value={200}>200ms</option>
              <option value={500}>500ms</option>
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
