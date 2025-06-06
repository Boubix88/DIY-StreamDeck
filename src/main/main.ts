import * as path from 'path';
import * as url from 'url';

import { ReadlineParser } from '@serialport/parser-readline';
import { encode } from 'cbor-x';
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { SerialPort } from 'serialport';

import { getSystemInfo } from './ohmReader';


let mainWindow: BrowserWindow | null = null;
let port: InstanceType<typeof SerialPort> | null = null;

// --- Fermeture propre du port série à la sortie du process ---
function closeSerialPortOnExit() {
  if (port && port.isOpen) {
    port.close((err: Error | null) => {
      if (err) {
        console.error('Erreur lors de la fermeture du port série à la sortie :', err);
      } else {
        console.log('Port série fermé proprement à la sortie.');
      }
    });
  }
}
process.on('exit', closeSerialPortOnExit);
process.on('SIGINT', () => {
  process.exit();
});
process.on('SIGTERM', () => {
  process.exit();
});
process.on('uncaughtException', () => {
  process.exit(1);
});
let parser: any = null;

function createWindow() {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Will be compiled to .js
    },
  });

  // Charger l'application React en développement ou en production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Ouvre les outils de développement
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Vérifier si les gestionnaires IPC sont déjà enregistrés
const ipcHandlers = new Set<string>();

function registerIpcHandler(channel: string, handler: (...args: any[]) => any) {
  if (ipcHandlers.has(channel)) {
    console.warn(`Handler for channel '${channel}' is already registered. Skipping...`);
    return;
  }
  ipcHandlers.add(channel);
  ipcMain.handle(channel, handler);
}

// Handler unique pour toutes les infos système (CPU, GPU, RAM, Réseau)
registerIpcHandler('system:getAllSystemInfo', async () => {
  try {
    const data = getSystemInfo();
    return data;
  } catch (error) {
    console.error('Erreur lors de la lecture des infos système OHM:', error);
    throw error;
  }
});

registerIpcHandler('spotify:getTrackInfo', async () => {
  return {
    title: 'Not Playing',
    artist: '',
    album: '',
    isPlaying: false
  };
});

// Cette méthode sera appelée quand Electron aura fini de s'initialiser
app.whenReady().then(createWindow);

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Sur macOS, il est commun de re-créer une fenêtre quand l'icône du dock est cliquée
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion de la communication série avec l'Arduino
registerIpcHandler('serial:list', async () => {
  try {
    const ports = await SerialPort.list();
    return ports.map((p: any) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      pnpId: p.pnpId,
      locationId: p.locationId,
      vendorId: p.vendorId,
      productId: p.productId
    }));
  } catch (error) {
    console.error('Error listing serial ports:', error);
    throw error;
  }
});

registerIpcHandler('serial:connect', async (event: IpcMainInvokeEvent, portPath: string) => {
  console.log('Connecting to port:', portPath);

  // Vérifier que le port est bien défini
  if (!portPath) {
    console.error('No port path provided');
    return false;
  }

  try {
    // Fermer la connexion existante si elle existe
    if (port) {
      if (parser) {
        parser.removeAllListeners();
        parser = null;
      }

      await new Promise<void>((resolve) => {
        if (port) {
          port.close(() => {
            port = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    // Créer une nouvelle instance du port série
    port = new SerialPort({
      path: portPath,
      baudRate: 115200,
      autoOpen: false
    });

    // Créer un parser pour lire les lignes de données
    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // Gestion des erreurs
    port.on('error', (err: Error) => {
      console.error('Serial port error:', err);
      if (mainWindow) {
        mainWindow.webContents.send('serial:data', `[ERROR] ${err.message}`);
      }
    });

    // Gestion des données reçues
    parser.on('data', (data: string | Buffer) => {
      if (mainWindow) {
        const dataStr = typeof data === 'string' ? data : data.toString().trim();
        mainWindow.webContents.send('serial:data', dataStr);
      }
    });

    // Gérer la promesse de connexion
    return new Promise<boolean>((resolve, reject) => {
      if (!port) {
        const error = new Error('Failed to create serial port');
        console.error(error.message);
        reject(error);
        return;
      }

      // Gérer l'ouverture du port
      port.open((err: Error | null | undefined) => {
        if (err) {
          console.error('Error opening port:', err);
          reject(err);
        } else {
          console.log('Successfully connected to port:', portPath);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Error in serial:connect handler:', error);
    throw error;
  }
});

registerIpcHandler('serial:disconnect', async () => {
  console.log('Disconnecting from serial port...');

  if (!port) {
    console.log('No active port to disconnect');
    return true;
  }

  try {
    const currentPort = port;
    port = null; // Réinitialiser la référence au port immédiatement

    await new Promise<void>((resolve, reject) => {
      currentPort.close((err: Error | null | undefined) => {
        if (err) {
          console.error('Error closing port:', err);
          reject(err);
        } else {
          console.log('Successfully disconnected from port');
          resolve();
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Error in serial:disconnect handler:', error);
    throw error;
  }
});

registerIpcHandler('serial:send', async (_, data: any) => {
  console.log('Sending data to serial port:', data);

  if (!port) {
    const error = new Error('Not connected to any port');
    console.error(error.message);
    throw error;
  }

  const currentPort = port;
  if (!currentPort) {
    const error = new Error('Port instance is not available');
    console.error(error.message);
    throw error;
  }

  try {
    // CORRECT : envoi binaire
    const encodedData = encode(data); // encode() doit retourner un Buffer
    console.log('CBOR buffer (hex):', encodedData.toString('hex')); // Pour le debug
    currentPort.write(encodedData); // Envoi binaire
    //const encodedData = encode(data);
    // encodedData doit être un Buffer binaire (pas .toString(), pas .toString('hex'))
    if (!Buffer.isBuffer(encodedData)) {
      throw new Error('encodedData is not a Buffer!');
    }
    console.log('Writing CBOR buffer to port (length: %d):', encodedData.length);
    // DEBUG : dump les premiers octets envoyés
    console.log('CBOR sent [0-15]:', Array.from(encodedData.slice(0, 16)).map(v => v.toString(16).padStart(2, '0')).join(' '));

    /*await new Promise<void>((resolve, reject) => {
      console.log('typeof encodedData:', typeof encodedData);
      console.log('isBuffer:', Buffer.isBuffer(encodedData));
      console.log('first 16 bytes:', encodedData.slice(0, 16));

      currentPort.write(encodedData, (err: Error | null | undefined) => {
        if (err) {
          console.error('Error writing to port:', err);
          reject(err);
          return;
        }

        console.log('Data written, draining buffer...');
        currentPort.drain((drainErr: Error | null | undefined) => {
          if (drainErr) {
            console.error('Error draining port:', drainErr);
            reject(drainErr);
          } else {
            console.log('Data sent successfully');
            resolve();
          }
        });
      });
    });*/

    return { success: true };
  } catch (error) {
    console.error('Error in serial:send handler:', error);
    throw error;
  }
});

// Gestion du volume système
registerIpcHandler('system:getVolume', async () => {
  try {
    // Implémentation basique - à adapter selon votre système d'exploitation
    // Cette implémentation retourne une valeur par défaut pour le moment
    return 50; // Valeur par défaut de 50%
  } catch (error) {
    console.error('Error getting system volume:', error);
    throw error;
  }
});

registerIpcHandler('system:setVolume', async (_, volume: number) => {
  try {
    // Implémentation basique - à adapter selon votre système d'exploitation
    // Cette implémentation ne fait que loguer la valeur pour le moment
    console.log(`Setting system volume to ${volume}%`);
    return true;
  } catch (error) {
    console.error('Error setting system volume:', error);
    throw error;
  }
});

// Gestion de Spotify
registerIpcHandler('spotify:playPause', async (_, play: boolean) => {
  try {
    // Implémentation basique - à adapter selon votre système d'exploitation
    console.log(`Spotify ${play ? 'play' : 'pause'} requested`);
    return true;
  } catch (error) {
    console.error('Error controlling Spotify:', error);
    throw error;
  }
});

registerIpcHandler('spotify:next', async () => {
  try {
    // Implémentation basique - à adapter selon votre système d'exploitation
    console.log('Spotify next track requested');
    return true;
  } catch (error) {
    console.error('Error controlling Spotify:', error);
    throw error;
  }
});

registerIpcHandler('spotify:previous', async () => {
  try {
    // Implémentation basique - à adapter selon votre système d'exploitation
    console.log('Spotify previous track requested');
    return true;
  } catch (error) {
    console.error('Error controlling Spotify:', error);
    throw error;
  }
});

// Gestion des paramètres RVB
let rgbSettings = {
  mode: 0, // MODE_STATIC par défaut
  color: { r: 0, g: 0, b: 255 }, // Bleu par défaut
  speed: 10 // Vitesse moyenne par défaut
};

// Gestionnaire pour récupérer les paramètres RVB
registerIpcHandler('rgb:getSettings', async () => {
  return rgbSettings;
});

// Gestionnaire pour sauvegarder les paramètres RVB
registerIpcHandler('rgb:saveSettings', async (_, settings) => {
  try {
    rgbSettings = {
      mode: settings.mode || 0,
      color: settings.color || { r: 0, g: 0, b: 255 },
      speed: settings.speed || 10
    };
    return true;
  } catch (error) {
    console.error('Error saving RGB settings:', error);
    throw error;
  }
});

// Les gestionnaires IPC pour les informations système sont déjà enregistrés plus haut avec registerIpcHandler

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
