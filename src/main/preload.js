const { contextBridge, ipcRenderer } = require('electron');

// Exposition sécurisée des API pour le rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Méthodes pour la communication série
  listSerialPorts: () => ipcRenderer.invoke('serial:list'),
  connectToPort: (portPath) => ipcRenderer.invoke('serial:connect', portPath),
  disconnectFromPort: () => ipcRenderer.invoke('serial:disconnect'),
  sendToPort: (data) => ipcRenderer.invoke('serial:send', data),
  
  // Écouteurs d'événements série
  onSerialData: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on('serial:data', listener);
    return () => ipcRenderer.off('serial:data', listener);
  },
  onSerialError: (callback) => {
    const listener = (_, error) => callback(error);
    ipcRenderer.on('serial:error', listener);
    return () => ipcRenderer.off('serial:error', listener);
  },
  
  // System information methods
  getCpuInfo: () => ipcRenderer.invoke('system:getCpuInfo'),
  getGpuInfo: () => ipcRenderer.invoke('system:getGpuInfo'),
  getRamInfo: () => ipcRenderer.invoke('system:getRamInfo'),
  getNetworkInfo: () => ipcRenderer.invoke('system:getNetworkInfo'),
  getSpotifyTrackInfo: () => ipcRenderer.invoke('spotify:getTrackInfo'),
  
  // Événements de l'application
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  
  // Autres méthodes utilitaires
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform
});
