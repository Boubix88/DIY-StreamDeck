// Utilitaire pour lire et parser le JSON d'OpenHardwareMonitor avec cache et rafraîchissement en arrière-plan
import { spawn, execSync } from 'child_process';
import os from 'os';
import path from 'path';

type OhmSensor = {
  SensorType: string;
  Name: string;
  Value: number;
};
type OhmHardware = {
  HardwareType: string;
  Sensors: OhmSensor[];
};
type OhmJson = {
  Hardware: OhmHardware[];
};

// Cache des données système
let lastSystemData: any = { cpu: null, gpu: null, ram: null, network: null };
let lastUpdateTime = 0;
const CACHE_VALIDITY = 2000; // 2 secondes de validité du cache

// Version non-bloquante avec spawn
async function readOhmBridgeAsync(): Promise<any> {
  return new Promise((resolve) => {
    // Si le cache est récent, on le retourne immédiatement
    const now = Date.now();
    if (now - lastUpdateTime < CACHE_VALIDITY) {
      return resolve(lastSystemData);
    }

    const exePath = path.join(__dirname, '../../OHMBridge/bin/Release/net48/OHMBridge.exe');
    
    // Utilisation de spawn au lieu de execSync
    const process = spawn(exePath, [], { windowsHide: true });
    let output = '';
    let errorOutput = '';
    
    // Collecte des données de sortie
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Timeout de sécurité (1 seconde max)
    const timeout = setTimeout(() => {
      process.kill();
      console.warn('OHMBridge timeout - utilisation du cache');
      resolve(lastSystemData);
    }, 1000);
    
    // À la fin du processus
    process.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0 && output) {
        try {
          const data = JSON.parse(output);
          lastSystemData = data;
          lastUpdateTime = Date.now();
          resolve(data);
        } catch (e) {
          console.error('Erreur parsing OHMBridge:', e);
          resolve(lastSystemData);
        }
      } else {
        console.error(`OHMBridge erreur (${code}):`, errorOutput);
        resolve(lastSystemData);
      }
    });
  });
}

// Fonction principale asynchrone pour récupérer toutes les infos système
export async function getSystemInfo() {
  try {
    // Utiliser la version asynchrone non-bloquante
    const ohm = await readOhmBridgeAsync();
    
    return {
      cpu: ohm.cpu ?? null,
      gpu: ohm.gpu ?? null,
      ram: ohm.ram ?? null,
      network: ohm.network ?? null
    };
  } catch (e) {
    console.error('Erreur lors de la lecture des infos système OHM:', e);
    return lastSystemData || { cpu: null, gpu: null, ram: null, network: null };
  }
}

// Démarrer un rafraîchissement en arrière-plan
let refreshInterval: NodeJS.Timeout;

function startBackgroundRefresh(intervalMs = 3000) {
  if (refreshInterval) clearInterval(refreshInterval);
  
  // Premier appel immédiat
  readOhmBridgeAsync().catch(console.error);
  
  // Puis à intervalle régulier
  refreshInterval = setInterval(() => {
    readOhmBridgeAsync().catch(console.error);
  }, intervalMs);
}

// Démarrer le rafraîchissement au chargement du module
startBackgroundRefresh();
