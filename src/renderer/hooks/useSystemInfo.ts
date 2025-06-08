import { useState, useEffect, useCallback, useRef } from 'react';
import { Systeminformation } from 'systeminformation';
import React from 'react';

// Type de retour du hook useSystemInfo
interface UseSystemInfoReturn {
  cpuInfo: any;
  cpuTemperature: any;
  gpuInfo: any;
  ramInfo: any;
  networkInfo: any;
  lastUpdate: number;
  isLoading: boolean;
  setCpuInfo: React.Dispatch<React.SetStateAction<any>>;
  setCpuTemperature: React.Dispatch<React.SetStateAction<any>>;
  setGpuInfo: React.Dispatch<React.SetStateAction<any>>;
  setRamInfo: React.Dispatch<React.SetStateAction<any>>;
  setNetworkInfo: React.Dispatch<React.SetStateAction<any>>;
}

const useSystemInfo = (timeInterval: number): UseSystemInfoReturn => {
  // État pour stocker les informations système
  const [cpuInfo, setCpuInfo] = useState<any>(null);
  const [cpuTemperature, setCpuTemperature] = useState<any>(null);
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  const [ramInfo, setRamInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Un seul fetch global
  const fetchAllSystemInfo = useCallback(async () => {
    try {
      const data = await window.electronAPI.invoke('system:getAllSystemInfo');
      setCpuInfo(data.cpu);
      setCpuTemperature({ main: data.cpu.temperature });
      setGpuInfo(data.gpu);
      setRamInfo(data.ram);
      setNetworkInfo(data.network);
    } catch (error) {
      console.error('Erreur lors de la récupération des infos système:', error);
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
      await fetchAllSystemInfo();
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error updating system info:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, timeInterval - elapsed);
      setTimeout(() => setIsLoading(false), remainingTime);
    }
  }, [fetchAllSystemInfo, isLoading]);

  // Mettre à jour les informations périodiquement
  useEffect(() => {
    // Première récupération
    const update = async () => {
      if (isFirstRender.current) {
        await updateAllInfo();
        isFirstRender.current = false;
      }
    };
    
    update(); // Appel initial

    // Mettre à jour à l'intervalle spécifié (en millisecondes)
    //console.log(`Démarrage de la mise à jour des infos système avec un intervalle de ${timeInterval}ms`);
    const interval = setInterval(updateAllInfo, timeInterval);

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      //console.log('Nettoyage de l\'intervalle de mise à jour système');
      clearInterval(interval);
    };
  }, [updateAllInfo, timeInterval]); // Ajout de timeInterval dans les dépendances

  return {
    // États principaux
    cpuInfo,
    cpuTemperature,
    gpuInfo,
    ramInfo,
    networkInfo,
    // Métadonnées
    lastUpdate,
    isLoading,
    // Fonctions de mise à jour
    setCpuInfo,
    setCpuTemperature,
    setGpuInfo,
    setRamInfo,
    setNetworkInfo
  };
};

export default useSystemInfo;
