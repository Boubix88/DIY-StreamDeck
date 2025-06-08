import { app } from 'electron';
import * as si from 'systeminformation';
import { ipcMain } from 'electron';

let currentVolume: number = 50; // Volume par défaut
let lastVolumeUpdate: number = Date.now();
let volumeScreenTimeout: NodeJS.Timeout | null = null;

// Fonction pour obtenir le volume système
async function getSystemVolume(): Promise<number> {
  if (process.platform === 'win32') {
    try {
      // Utilisation de @dwebf0r/volume-mixer pour obtenir le volume système
      const volumeMixer = require('@dwebf0r/volume-mixer');
      const apps = volumeMixer.getApplications();
      
      // Trouver le processus système de volume principal
      const systemVolume = apps.find((app: any) => app.name === 'System Sounds');
      if (systemVolume) {
        return Math.round(systemVolume.volume * 100);
      }
      
      // Si on ne trouve pas le volume système, on essaie de prendre le premier processus disponible
      if (apps.length > 0) {
        return Math.round(apps[0].volume * 100);
      }
      
      return currentVolume;
    } catch (e) {
      console.error('Erreur lors de la récupération du volume:', e);
      return currentVolume;
    }
  }
  
  // Pour les autres systèmes d'exploitation, on retourne la valeur actuelle
  return currentVolume;
}

// Fonction pour générer le chemin SVG du volume
export function generateVolumePath(volume: number, centerX = 120, centerY = 120, radiusOuter = 120, radiusInner = 105, totalBars = 13) {
  const pathCommandsActive: string[] = [];
  const pathCommandsInactive: string[] = [];
  const activeBars = Math.max(0, Math.min(totalBars, Math.round(volume * totalBars / 100)));

  for (let i = 0; i < totalBars; i++) {
    const angle = (2 * Math.PI / totalBars) * i + Math.PI / 2;
    
    const xOuter = Math.round(centerX + radiusOuter * Math.cos(angle));
    const yOuter = Math.round(centerY + radiusOuter * Math.sin(angle));
    const xInner = Math.round(centerX + radiusInner * Math.cos(angle));
    const yInner = Math.round(centerY + radiusInner * Math.sin(angle));

    if (i < activeBars) {
      pathCommandsActive.push(`M ${xInner} ${yInner} L ${xOuter} ${yOuter}`);
    } else {
      pathCommandsInactive.push(`M ${xInner} ${yInner} L ${xOuter} ${yOuter}`);
    }
  }

  return {
    t: {
      c: "FFFFFF",
      t: [
        [
          120 - (String(volume).length * 6 * 7) / 2,
          150,
          7,
          String(volume)
        ]
      ]
    },
    v: [
      ...pathCommandsActive.map(cmd => [cmd, "FF0000"]),
      ...pathCommandsInactive.map(cmd => [cmd, "FFFFFF"])
    ]
  };
}

// Fonction pour afficher l'écran de volume
export function showVolumeScreen(volume: number) {
  //const volumeScreen = generateVolumePath(volume);
  
  // Envoyer l'écran de volume
  /*ipcMain.emit('serial:send', { 
    s: volumeScreen,
    clr: true
  });*/

  // Réinitialiser le timeout si il existe déjà
  if (volumeScreenTimeout) {
    clearTimeout(volumeScreenTimeout);
  }

  // Cacher l'écran de volume après 2 secondes
  /*volumeScreenTimeout = setTimeout(() => {
    ipcMain.emit('serial:send', { clr: true });
    volumeScreenTimeout = null;
  }, 2000);*/
}

// Fonction pour initialiser le monitoring du volume
export function initVolumeControl() {
  // Vérifier le volume toutes les secondes
  /*setInterval(async () => {
    try {
      const newVolume = await getSystemVolume();
      if (newVolume !== currentVolume) {
        currentVolume = newVolume;
        showVolumeScreen(currentVolume);
      }
    } catch (e) {
      console.error('Erreur lors de la vérification du volume:', e);
    }
  }, 1000);*/

  // Gérer les changements de volume manuels
  // Note: Cette partie nécessitera une implémentation spécifique selon l'OS
}
