import { Systeminformation } from "systeminformation";

// Déclarations de types pour les API exposées par le préchargement Electron
declare global {
  interface Window {
    electronAPI: {
      // Méthode générique pour invoquer des méthodes IPC
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      
      // Méthodes pour la communication série
      listSerialPorts: () => Promise<Array<{
        path: string;
        manufacturer?: string;
        serialNumber?: string;
        pnpId?: string;
        locationId?: string;
        productId?: string;
        vendorId?: string;
      }>>;
      
      // Événements pour la communication série
      onSerialData: (callback: (data: string) => void) => () => void;
      onSerialError: (callback: (error: { type: string; message: string; port?: string }) => void) => () => void;
      
      connectToPort: (portPath: string) => Promise<boolean>;
      disconnectFromPort: () => Promise<boolean>;
      sendToPort: (data: any) => Promise<boolean>;
      
      // Méthodes pour le contrôle du volume
      getSystemVolume: () => Promise<number>;
      setSystemVolume: (volume: number) => Promise<boolean>;
      
      // Méthodes pour Spotify
      spotifyPlayPause: (play: boolean) => Promise<boolean>;
      spotifyNext: () => Promise<boolean>;
      spotifyPrevious: () => Promise<boolean>;
      getSpotifyTrackInfo: () => Promise<{
        title: string;
        artist: string;
        album: string;
        albumArt: string;
        duration: number;
        progress: number;
        isPlaying: boolean;
      }>;
      
      // Méthodes pour les informations système
      getCpuInfo: () => Promise<Systeminformation.CpuData>;
      getCpuTemperature: () => Promise<Systeminformation.CpuTemperatureData>;
      getGpuInfo: () => Promise<Systeminformation.GraphicsData>;
      getRamInfo: () => Promise<Systeminformation.MemData>;
      getNetworkInfo: () => Promise<import('./hooks/useSystemInfo').UINetworkInfo>;
      
      // Méthodes pour le contrôle RVB
      getRgbSettings: () => Promise<{
        mode: number;
        color: { r: number; g: number; b: number };
        speed: number;
      }>;
      
      saveRgbSettings: (settings: {
        mode: number;
        color: { r: number; g: number; b: number };
        speed: number;
      }) => Promise<boolean>;
      
      // Événements
      onUpdateAvailable: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      onUpdateDownloaded: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      
      // Autres méthodes utilitaires
      getAppVersion: () => Promise<string>;
      platform: NodeJS.Platform;
    };
  }
}

export {};
