import si from 'systeminformation';
import * as loudness from 'loudness';
import osu from 'node-os-utils';
import os from 'os';

// --- Cache pour les infos "lentes" (température, GPU) ---
let lastAdvancedInfo: any = null;
let lastAdvancedInfoTimestamp = 0;
const ADVANCED_REFRESH_MS = 5000;

/*async function refreshAdvancedInfo() {
  try {
    // Température CPU et GPU
    const [cpuTemp, graphics] = await Promise.all([
      si.cpuTemperature(),
      si.graphics()
    ]);
    lastAdvancedInfo = {
      cpuTemperature: cpuTemp.main,
      gpu: graphics.controllers[0] || {},
    };
    lastAdvancedInfoTimestamp = Date.now();
  } catch {}
}
setInterval(refreshAdvancedInfo, ADVANCED_REFRESH_MS);
refreshAdvancedInfo(); // Premier appel immédiat*/

export interface CpuInfo {
  // Propriétés de base
  temperature: number;     // en °C
  usage: number;           // en pourcentage
  frequency: number;       // en MHz
  processes: number;       // nombre de processus
  cores: number;           // nombre de cœurs logiques
  physicalCores: number;   // nombre de cœurs physiques
  manufacturer: string;    // fabricant (ex: "Intel", "AMD")
  brand: string;          // modèle (ex: "Core i7-10700K")
  
  // Propriétés supplémentaires pour la compatibilité avec App.tsx
  vendor?: string;         // fournisseur
  family?: string;         // famille de processeur
  model?: string;          // modèle (identique à brand?)
  speed?: number;          // vitesse actuelle en GHz
  speedMin?: number;       // vitesse minimale en GHz
  speedMax?: number;       // vitesse maximale en GHz
  governor?: string;       // gouverneur de fréquence
  
  // Autres propriétés de charge
  currentLoad?: number;
  currentLoadUser?: number;
  currentLoadSystem?: number;
  currentLoadNice?: number;
  currentLoadIdle?: number;
  rawCurrentLoad?: number;
  rawCurrentLoadUser?: number;
  rawCurrentLoadSystem?: number;
  rawCurrentLoadNice?: number;
  rawCurrentLoadIdle?: number;
  temperatureMax?: number;
  
  // Cache
  cache?: {
    l1d: number;  // en Ko
    l1i: number;  // en Ko
    l2: number;   // en Ko
    l3: number;   // en Ko
  };
  l1d?: number;  // en Ko
  l1i?: number;  // en Ko
  l2?: number;   // en Ko
  l3?: number;   // en Ko
}

export interface GpuInfo {
  // Propriétés pour l'affichage dans App.tsx
  temperature: number;     // en °C
  usage: number;           // en pourcentage
  frequency: number;       // en MHz
  memory: number;          // en Mo
  memoryTotal: number;     // en Mo
  model: string;
  vendor: string;
  
  // Structure complète pour les contrôleurs
  controllers: Array<{
    vendor: string;
    vendorId: string;
    model: string;
    bus: string;
    vram: number;         // en Mo
    vramDynamic: boolean;
    // Performances
    frequency: number;     // en MHz
    // Température
    temperatureGpu: number; // en °C
    // Utilisation
    utilizationGpu: number; // en pourcentage
    utilizationMemory: number; // en pourcentage
    // Processus
    processes: Array<{
      pid: number;
      name: string;
      mem: number;        // en Mo
      command: string;
    }>;
  }>;
  
  // Structure pour les écrans
  displays: Array<{
    vendor: string;
    vendorId: string;
    model: string;
    main: boolean;
    builtin: boolean;
    connection: string;
    resolutionX: number;
    resolutionY: number;
    depth: number;
  }>;
}

export interface RamInfo {
  // Propriétés de base
  total: number;       // en octets
  used: number;        // en octets
  free: number;        // en octets
  usage: number;       // en pourcentage
  active: number;      // en octets
  available: number;   // en octets
  
  // Propriétés supplémentaires pour la compatibilité avec App.tsx
  buffcache?: number;  // en octets
  buffers?: number;    // en octets
  cached?: number;     // en octets
  slab?: number;       // en octets
  
  // Swap
  swapTotal?: number;  // en octets
  swapUsed?: number;   // en octets
  swapFree?: number;   // en octets
  swapUsage?: number;  // en pourcentage
}

export interface NetworkInterfaceInfo {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  internal: boolean;
}

export interface NetworkInfo {
  // Propriétés pour l'affichage dans App.tsx
  download: number;           // en octets/s
  upload: number;             // en octets/s
  ip: string;                // adresse IP principale
  status: string;            // état de la connexion
  
  // Propriétés supplémentaires pour les statistiques détaillées
  stats?: Array<{
    iface: string;          // nom de l'interface
    operstate: string;       // état opérationnel (up/down)
    rx_bytes: number;       // octets reçus
    tx_bytes: number;       // octets envoyés
    rx_sec: number;         // débit de réception (octets/s)
    tx_sec: number;         // débit d'émission (octets/s)
    ms: number;             // temps de mesure en ms
  }>;
  
  // Autres propriétés réseau
  interfaces?: NetworkInterfaceInfo[];
  defaultGateway?: string;
  defaultInterface?: string;
  ip4?: string;
  ip4subnet?: string;
  ip6?: string;
  ip6subnet?: string;
  mac?: string;
  connections?: number;
  speed?: number;           // en Mbps
}

// --- Infos CPU/RAM/Réseau ultra-rapides ---
export const getAllSystemInfo = async () => {
  // CPU usage (instantané, rapide)
  let cpuUsage = 0;
  try {
    cpuUsage = await (osu as any).cpu.usage(); // %
  } catch (e) {
    // osu absent ou erreur, fallback 0
  }
  /*const cpuInfo = os.cpus()[0];
  const cpuBrand = cpuInfo.model;
  const cpuCores = os.cpus().length;
  const cpuFrequency = cpuInfo.speed * 1000; // MHz -> Hz*/
  
  // CPU
  const valueObject = {
    cpuCurrentSpeed: 'avg',
    cpuTemperature: 'main',
  }
  let cpuFrequency = 0;
  let cpuTemp = 0;
  
  await si.get(valueObject).then(data => {
    cpuFrequency = data.cpuCurrentSpeed?.avg || 0;
    cpuTemp = data.cpuTemperature?.main || 0;
  });

  // RAM
  const totalMem = os.totalmem() / (1024 * 1024 * 1024); // Go
  const freeMem = os.freemem() / (1024 * 1024 * 1024);   // Go
  const usedMem = totalMem - freeMem;

  // Réseau (débits non instantanés, mais IP rapide)
  const networkInterfaces = os.networkInterfaces();
  let ip = '';
  for (const iface of Object.values(networkInterfaces)) {
    if (iface) {
      const found = iface.find(i => i.family === 'IPv4' && !i.internal);
      if (found) { ip = found.address; break; }
    }
  }

  // Température CPU et GPU, VRAM, fréquence (depuis le cache avancé)
  let cpuTemperature = null, gpu: any = {}, gpuTemp = null, vramUsed = null, vramTotal = null, gpuFreq = null;
  if (lastAdvancedInfo && lastAdvancedInfo.gpu) {
    cpuTemperature = lastAdvancedInfo.cpuTemperature;
    gpu = lastAdvancedInfo.gpu;
    gpuTemp = gpu.temperatureGpu ?? null;
    vramUsed = gpu.memoryUsed ?? null;
    vramTotal = gpu.memoryTotal ?? null;
    gpuFreq = gpu.clockCore ?? null;
  }

  // Volume (léger)
  let volume = null;
  try { volume = await loudness.getVolume(); } catch {}

  return {
    cpuInfo: {
      brand: "",
      usage: cpuUsage,
      frequency: cpuFrequency,
      cores: os.cpus().length,
      processCount: os.loadavg()[0], // approximation
    },
    cpuTemperature: { main: cpuTemp },
    gpuInfo: {
      model: gpu.model ?? null,
      usage: gpu.utilizationGpu ?? null,
      temperature: gpuTemp,
      frequency: gpuFreq,
      vramUsed,
      vramTotal,
    },
    ramInfo: {
      total: totalMem,
      used: usedMem,
    },
    networkInfo: {
      ip,
      rxRate: null, // indisponible en natif rapide
      txRate: null,
    },
    volume,
    timestamp: Date.now()
  };
};

/*export const getGpuInfo = async (): Promise<GpuInfo> => {
  try {
    const graphics = await si.graphics();
    const defaultController = {
      vendor: 'Unknown',
      vendorId: '',
      model: 'Unknown GPU',
      bus: '',
      vram: 0,
      vramDynamic: false,
      frequency: 0,
      temperatureGpu: 0,
      utilizationGpu: 0,
      utilizationMemory: 0,
      processes: []
    };

    const defaultDisplay = {
      vendor: 'Unknown',
      vendorId: '',
      model: 'Unknown Display',
      main: false,
      builtin: false,
      connection: '',
      resolutionX: 0,
      resolutionY: 0,
      depth: 0
    };

    // S'assurer que nous avons au moins un contrôleur et un affichage
    const controllers = graphics.controllers && graphics.controllers.length > 0 
      ? graphics.controllers.map(c => ({
          vendor: c.vendor || defaultController.vendor,
          vendorId: (c as any).vendorId || defaultController.vendorId,
          model: c.model || defaultController.model,
          bus: (c as any).bus || defaultController.bus,
          vram: c.vram || defaultController.vram,
          vramDynamic: (c as any).vramDynamic !== undefined 
            ? (c as any).vramDynamic 
            : defaultController.vramDynamic,
          frequency: defaultController.frequency, // Non disponible directement
          temperatureGpu: defaultController.temperatureGpu, // Non disponible directement
          utilizationGpu: defaultController.utilizationGpu, // Non disponible directement
          utilizationMemory: defaultController.utilizationMemory, // Non disponible directement
          processes: []
        }))
      : [{ ...defaultController }];

    const displays = graphics.displays && graphics.displays.length > 0
      ? graphics.displays.map(d => ({
          vendor: d.vendor || defaultDisplay.vendor,
          vendorId: (d as any).vendorId || defaultDisplay.vendorId,
          model: d.model || defaultDisplay.model,
          main: d.main || defaultDisplay.main,
          builtin: (d as any).builtin !== undefined 
            ? (d as any).builtin 
            : defaultDisplay.builtin,
          connection: (d as any).connection || defaultDisplay.connection,
          resolutionX: d.resolutionX || defaultDisplay.resolutionX,
          resolutionY: d.resolutionY || defaultDisplay.resolutionY,
          depth: (d as any).depth || defaultDisplay.depth
        }))
      : [{ ...defaultDisplay }];

    // Utiliser les valeurs du premier contrôleur pour les propriétés de haut niveau
    const primaryController = controllers[0] || defaultController;
    
    // Créer un objet GpuInfo complet
    const gpuInfo: GpuInfo = {
      // Propriétés de haut niveau
      temperature: primaryController.temperatureGpu,
      usage: primaryController.utilizationGpu,
      frequency: primaryController.frequency,
      memory: primaryController.vram,
      memoryTotal: primaryController.vram, // Même valeur que vram, car vramTotal n'est pas disponible
      model: primaryController.model,
      vendor: primaryController.vendor,
      
      // Contrôleurs et écrans
      controllers: controllers.map(c => ({
        vendor: c.vendor,
        vendorId: c.vendorId,
        model: c.model,
        bus: c.bus,
        vram: c.vram,
        vramDynamic: c.vramDynamic,
        frequency: c.frequency,
        temperatureGpu: c.temperatureGpu,
        utilizationGpu: c.utilizationGpu,
        utilizationMemory: c.utilizationMemory,
        processes: c.processes
      })),
      
      displays: displays.map(d => ({
        vendor: d.vendor,
        vendorId: d.vendorId,
        model: d.model,
        main: d.main,
        builtin: d.builtin,
        connection: d.connection,
        resolutionX: d.resolutionX,
        resolutionY: d.resolutionY,
        depth: d.depth
      }))
    };
    
    return gpuInfo;
  } catch (error) {
    console.error('Error getting GPU info:', error);
    throw error;
  }
};*/

/*export const getRamInfo = async (): Promise<RamInfo> => {
  try {
    const mem = await si.mem();
    const memLayout = await si.memLayout();
    
    // Calculer la mémoire totale à partir du layout si disponible
    const totalMemory = memLayout.reduce((sum, bank) => sum + bank.size, 0);
    
    // Calculer les valeurs nécessaires
    const total = mem.total || totalMemory || 0;
    const used = mem.used || 0;
    const free = mem.free || 0;
    const active = mem.active || 0;
    const available = mem.available || 0;
    
    // Récupérer les informations de swap
    const swapTotal = mem.swaptotal || 0;
    const swapUsed = mem.swapused || 0;
    const swapFree = mem.swapfree || 0;
    
    // Calculer le pourcentage d'utilisation
    const usage = total > 0 ? (used / total) * 100 : 0;
    const swapUsage = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;
    
    return {
      // Propriétés requises
      total,
      used,
      free,
      usage,
      active,
      available,
      
      // Propriétés optionnelles
      buffcache: (mem as any).buffcache || 0,
      buffers: mem.buffers || 0,
      cached: mem.cached || 0,
      slab: (mem as any).slab || 0,
      swapTotal,
      swapUsed,
      swapFree,
      swapUsage
    };
  } catch (error) {
    console.error('Error getting RAM info:', error);
    throw error;
  }
};*/

/*export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  try {
    const [networkStats, networkInterfaces, networkConnections, defaultInterface] = await Promise.all([
      si.networkStats(),
      si.networkInterfaces(),
      si.networkConnections(),
      si.networkInterfaceDefault()
    ]);

    // Obtenir les statistiques de l'interface par défaut
    const defaultIface = networkInterfaces.find(iface => iface.iface === defaultInterface) || networkInterfaces[0];
    const stats = networkStats.find(s => s.iface === defaultInterface) || networkStats[0] || {};
    
    // Obtenir l'adresse IP principale
    const ip4 = defaultIface?.ip4 || '';
    
    // Obtenir le débit réseau
    const rx_sec = stats.rx_sec || 0;
    const tx_sec = stats.tx_sec || 0;
    
    // Créer un objet NetworkInfo avec toutes les propriétés requises
    const networkInfo: NetworkInfo = {
      // Propriétés requises pour l'affichage
      download: rx_sec,  // Débit de réception en octets/s
      upload: tx_sec,    // Débit d'émission en octets/s
      ip: ip4,          // Adresse IP principale
      status: defaultIface?.operstate === 'up' ? 'Connected' : 'Disconnected',
      
      // Statistiques détaillées
      stats: networkStats.map(s => ({
        iface: s.iface,
        operstate: s.operstate || 'unknown',
        rx_bytes: s.rx_bytes || 0,
        tx_bytes: s.tx_bytes || 0,
        rx_sec: s.rx_sec || 0,
        tx_sec: s.tx_sec || 0,
        ms: s.ms || 0
      })),
      
      // Autres propriétés réseau
      defaultGateway: '',  // Non disponible directement dans l'interface
      defaultInterface: defaultInterface || '',
      interfaces: networkInterfaces,
      ip4: ip4,
      ip4subnet: '',  // Masque de sous-réseau non disponible directement
      ip6: defaultIface?.ip6 || '',
      ip6subnet: '',  // Masque de sous-réseau IPv6 non disponible directement
      mac: defaultIface?.mac || '',
      connections: networkConnections.length,
      speed: defaultIface?.speed || 0
    };
    
    return networkInfo;
  } catch (error) {
    console.error('Error getting network info:', error);
    throw error;
  }
};*/

// Fonction pour obtenir le volume système
async function getVolumeInfo(): Promise<number> {
  try {
    //console.log('Tentative de récupération du volume système...');
    const volume = await loudness.getVolume();
    //console.log('Volume système récupéré avec succès:', volume);
    return volume;
  } catch (error) {
    console.error('Erreur lors de la récupération du volume système:', error);
    if (error instanceof Error) {
      console.error('Détails de l\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return 0;
  }
}

