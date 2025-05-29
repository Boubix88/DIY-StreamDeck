import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Les types sont maintenant définis dans src/renderer/electron.d.ts

// Create the API object
const electronAPI = {
  // Generic IPC method
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  // Serial port methods
  listSerialPorts: () => ipcRenderer.invoke('serial:list'),
  connectToPort: (portPath: string) => ipcRenderer.invoke('serial:connect', portPath),
  disconnectFromPort: () => ipcRenderer.invoke('serial:disconnect'),
  sendToPort: (data: any) => ipcRenderer.invoke('serial:send', data),
  
  // System information methods
  getCpuInfo: () => ipcRenderer.invoke('system:getCpuInfo'),
  getGpuInfo: () => ipcRenderer.invoke('system:getGpuInfo'),
  getRamInfo: () => ipcRenderer.invoke('system:getRamInfo'),
  getNetworkInfo: () => ipcRenderer.invoke('system:getNetworkInfo'),
  
  // Volume control methods
  getSystemVolume: () => ipcRenderer.invoke('system:getVolume'),
  setSystemVolume: (volume: number) => ipcRenderer.invoke('system:setVolume', volume),
  
  // Spotify control methods
  getSpotifyTrackInfo: () => ipcRenderer.invoke('spotify:getTrackInfo'),
  spotifyPlayPause: (play: boolean) => ipcRenderer.invoke('spotify:playPause', play),
  spotifyNext: () => ipcRenderer.invoke('spotify:next'),
  spotifyPrevious: () => ipcRenderer.invoke('spotify:previous'),
  
  // Application events
  onUpdateAvailable: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => 
    ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => 
    ipcRenderer.on('update-downloaded', callback),
  
  // Utility methods
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform as NodeJS.Platform,
  
  // Serial data events
  onSerialData: (callback: (data: string) => void) => {
    const listener = (_: IpcRendererEvent, data: string) => callback(data);
    ipcRenderer.on('serial:data', listener);
    return () => ipcRenderer.off('serial:data', listener);
  },
  
  // RGB Control methods
  getRgbSettings: () => ipcRenderer.invoke('rgb:getSettings'),
  saveRgbSettings: (settings: {
    mode: number;
    color: { r: number; g: number; b: number };
    speed: number;
  }) => ipcRenderer.invoke('rgb:saveSettings', settings)
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
