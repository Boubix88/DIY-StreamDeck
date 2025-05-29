import { useState, useEffect, useCallback, useRef } from 'react';
import { encode } from 'cbor-x';

type SerialDataCallback = (data: string) => void;

interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

export const useSerial = () => {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const maxLogs = useRef(1000); // Nombre maximum de logs à conserver
  const lastDataSent = useRef<string>(''); // Pour éviter les envois en double

  // Récupérer la liste des ports série disponibles
  const listPorts = useCallback(async () => {
    try {
      const availablePorts = await window.electronAPI.listSerialPorts();
      setPorts(availablePorts);
      return availablePorts;
    } catch (err) {
      setError('Failed to list serial ports');
      console.error('Error listing ports:', err);
      return [];
    }
  }, []);

  // Se connecter à un port série
  const connectToPort = useCallback(async (portPath: string) => {
    try {
      const success = await window.electronAPI.connectToPort(portPath);
      if (success) {
        setConnectedPort(portPath);
        setIsConnected(true);
        setError(null);
        lastDataSent.current = ''; // Réinitialiser les données précédentes
        return true;
      }
      return false;
    } catch (err) {
      setError(`Failed to connect to port: ${portPath}`);
      console.error('Error connecting to port:', err);
      return false;
    }
  }, []);

  // Se déconnecter du port série
  const disconnectFromPort = useCallback(async () => {
    if (!connectedPort) return true;
    
    try {
      const success = await window.electronAPI.disconnectFromPort();
      if (success) {
        setConnectedPort(null);
        setIsConnected(false);
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to disconnect from port');
      console.error('Error disconnecting from port:', err);
      return false;
    }
  }, [connectedPort]);

  // Envoyer des données au port série avec vérification des doublons
  const sendData = useCallback(async (data: any) => {
    if (!connectedPort) {
      setError('Not connected to any port');
      return false;
    }

    try {
      // Vérifier si les données sont identiques aux précédentes
      const dataStr = JSON.stringify(data);
      
      if (dataStr === lastDataSent.current) {
        return true; // Ne pas renvoyer les mêmes données
      }
      
      const success = await window.electronAPI.sendToPort(data);
      if (!success) {
        setError('Failed to send data to port');
        lastDataSent.current = ''; // Réinitialiser en cas d'échec
        return false;
      }
      
      lastDataSent.current = dataStr;
      return true;
    } catch (err) {
      setError('Error sending data to port');
      console.error('Error sending data:', err);
      return false;
    }
  }, [connectedPort]);

  // Mettre à jour la liste des ports au chargement
  // Gestion des logs série
  const handleSerialData = useCallback((data: string) => {
    setSerialLogs(prevLogs => {
      const newLogs = [...prevLogs, data];
      // Limiter le nombre de logs conservés
      if (newLogs.length > maxLogs.current) {
        return newLogs.slice(-maxLogs.current);
      }
      return newLogs;
    });
  }, []);

  // Abonnement aux événements série
  useEffect(() => {
    listPorts();
    
    // Mettre à jour la liste des ports toutes les 5 secondes
    const interval = setInterval(listPorts, 5000);
    
    // S'abonner aux données série
    const removeListener = window.electronAPI.onSerialData(handleSerialData);
    
    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, [listPorts, handleSerialData]);

  return {
    ports,
    connectedPort,
    isConnected,
    error,
    serialLogs,
    listPorts,
    connectToPort,
    disconnectFromPort,
    sendData,
    clearLogs: () => setSerialLogs([])
  };
};

export default useSerial;
