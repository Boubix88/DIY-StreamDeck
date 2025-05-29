import { useState, useEffect, useCallback, useRef } from 'react';

interface CpuInfo {
  temperature: number;
  usage: number;
  frequency: number;
  processes: number;
  cores: number;
  physicalCores: number;
  manufacturer: string;
  brand: string;
}

interface GpuInfo {
  temperature: number;
  usage: number;
  frequency: number;
  memory: number;
  memoryTotal: number;
  model: string;
  vendor: string;
}

interface RamInfo {
  total: number;       // en Mo
  used: number;        // en Mo
  free: number;        // en Mo
  usage: number;       // en pourcentage
  active: number;      // en Mo
  available: number;   // en Mo
}

interface NetworkInfo {
  download: number;    // en Mo/s
  upload: number;      // en Mo/s
  ip: string;
  status: string;
  interfaces: Array<{
    iface: string;
    ip4: string;
    ip6: string;
    mac: string;
    internal: boolean;
  }>;
}

const useSystemInfo = () => {
  const [cpuInfo, setCpuInfo] = useState<CpuInfo>({
    temperature: 0,
    usage: 0,
    frequency: 0,
    processes: 0,
    cores: 0,
    physicalCores: 0,
    manufacturer: '',
    brand: ''
  });

  const [gpuInfo, setGpuInfo] = useState<GpuInfo>({
    temperature: 0,
    usage: 0,
    frequency: 0,
    memory: 0,
    memoryTotal: 0,
    model: 'N/A',
    vendor: 'N/A'
  });

  const [ramInfo, setRamInfo] = useState<RamInfo>({
    total: 0,
    used: 0,
    free: 0,
    usage: 0,
    active: 0,
    available: 0
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    download: 0,
    upload: 0,
    ip: '127.0.0.1',
    status: 'Disconnected',
    interfaces: []
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Récupérer les informations CPU
  const fetchCpuInfo = useCallback(async () => {
    try {
      const cpu = await window.electronAPI.invoke('system:getCpuInfo');
      setCpuInfo(prev => ({
        ...prev,
        ...cpu
      }));
    } catch (error) {
      console.error('Error fetching CPU info:', error);
    }
  }, []);

  // Récupérer les informations GPU
  const fetchGpuInfo = useCallback(async () => {
    try {
      const gpu = await window.electronAPI.invoke('system:getGpuInfo');
      setGpuInfo(prev => ({
        ...prev,
        ...gpu
      }));
    } catch (error) {
      console.error('Error fetching GPU info:', error);
    }
  }, []);

  // Récupérer les informations RAM
  const fetchRamInfo = useCallback(async () => {
    try {
      const ram = await window.electronAPI.invoke('system:getRamInfo');
      setRamInfo(prev => ({
        ...prev,
        ...ram
      }));
    } catch (error) {
      console.error('Error fetching RAM info:', error);
    }
  }, []);

  // Récupérer les informations réseau
  const fetchNetworkInfo = useCallback(async () => {
    try {
      const network = await window.electronAPI.invoke('system:getNetworkInfo');
      setNetworkInfo(prev => ({
        ...prev,
        ...network
      }));
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  }, []);

  // Référence pour suivre si c'est le premier rendu
  const isFirstRender = useRef(true);
  
  // Fonction pour mettre à jour toutes les informations système
  const updateAllInfo = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Exécuter toutes les requêtes en parallèle
      await Promise.all([
        fetchCpuInfo(),
        fetchGpuInfo(),
        fetchRamInfo(),
        fetchNetworkInfo()
      ]);
      
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error updating system info:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsed); // Temps restant avant la prochaine mise à jour
      
      // Attendre le temps restant avant de permettre la prochaine mise à jour
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    }
  }, [fetchCpuInfo, fetchGpuInfo, fetchRamInfo, fetchNetworkInfo, isLoading]);

  // Mettre à jour les informations périodiquement
  useEffect(() => {
    // Première récupération
    if (isFirstRender.current) {
      updateAllInfo();
      isFirstRender.current = false;
    }

    // Mettre à jour toutes les 2 secondes
    const interval = setInterval(updateAllInfo, 2000);

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      clearInterval(interval);
    };
  }, [updateAllInfo]);

  return {
    cpuInfo,
    gpuInfo,
    ramInfo,
    networkInfo,
    lastUpdate,
    isLoading
  };
};

export default useSystemInfo;
