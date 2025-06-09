import { useState, useEffect, useCallback, useRef } from 'react';

type SerialDataCallback = (data: string) => void;
type SerialErrorCallback = (error: { type: string; message: string; port?: string }) => void;

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
  const reconnectAttempts = useRef(0); // Compteur de tentatives de reconnexion
  const maxReconnectAttempts = 5; // Nombre maximum de tentatives de reconnexion
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null); // Timeout pour la reconnexion
  const lastConnectedPort = useRef<string | null>(null); // Dernier port connecté avec succès
  
  // Fonction utilitaire pour ajouter des logs avec horodatage
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    setSerialLogs(prev => [...prev.slice(-maxLogs.current + 1), `[${timestamp}] ${message}`]);
  }, []);

  // Récupérer la liste des ports série disponibles
  const listPorts = useCallback(async () => {
    try {
      const availablePorts = await window.electronAPI.listSerialPorts();
      setPorts(availablePorts);
      addLog(`[INFO] ${availablePorts.length} port(s) série disponible(s)`);
      return availablePorts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Impossible de lister les ports série');
      addLog(`[ERREUR] Échec du scan des ports: ${errorMessage}`);
      console.error('Erreur lors du scan des ports:', err);
      return [];
    }
  }, [addLog]);

  // Se connecter à un port série avec gestion de reconnexion
  const connectToPort = useCallback(async (portPath: string) => {
    // Annuler toute tentative de reconnexion en cours
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    try {
      addLog(`[INFO] Tentative de connexion à ${portPath}...`);
      const success = await window.electronAPI.connectToPort(portPath);
      
      if (success) {
        setConnectedPort(portPath);
        setIsConnected(true);
        lastConnectedPort.current = portPath;
        setError(null);
        reconnectAttempts.current = 0;
        addLog(`[SUCCÈS] Connexion établie avec ${portPath}`);
        return true;
      }
      
      addLog(`[ERREUR] Échec de la connexion à ${portPath}`);
      return false;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Échec de la connexion: ${errorMessage}`);
      addLog(`[ERREUR] Échec de la connexion: ${errorMessage}`);
      
      // Tenter une reconnexion automatique si le port était précédemment connecté
      if (lastConnectedPort.current === portPath) {
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * reconnectAttempts.current, 5000); // Augmentation exponentielle avec un max de 5s
          
          addLog(`[INFO] Nouvelle tentative dans ${delay/1000}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connectToPort(portPath);
          }, delay);
        } else {
          addLog(`[ERREUR] Nombre maximum de tentatives de reconnexion atteint (${maxReconnectAttempts})`);
        }
      }
      
      return false;
    }
  }, [addLog]);

  // Se déconnecter du port série
  const disconnectFromPort = useCallback(async () => {
    // Annuler toute tentative de reconnexion en cours
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (!connectedPort) {
      return true; // Déjà déconnecté
    }
    
    try {
      addLog(`[INFO] Déconnexion de ${connectedPort}...`);
      const success = await window.electronAPI.disconnectFromPort();
      
      if (success) {
        setConnectedPort(null);
        setIsConnected(false);
        lastConnectedPort.current = null;
        reconnectAttempts.current = 0;
        addLog('[SUCCÈS] Déconnexion réussie');
        return true;
      }
      
      addLog('[ERREUR] Échec de la déconnexion (réponse négative)');
      return false;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Échec de la déconnexion');
      addLog(`[ERREUR] Échec de la déconnexion: ${errorMessage}`);
      console.error('Erreur lors de la déconnexion:', err);
      return false;
    }
  }, [connectedPort, addLog]);

  // Envoyer des données au port série avec gestion des erreurs et reconnexion
  const sendData = useCallback(async (data: any) => {
    // Si non connecté mais qu'on a un port précédemment connecté, on tente de se reconnecter
    if (!isConnected && lastConnectedPort.current) {
      addLog(`[INFO] Tentative de reconnexion automatique à ${lastConnectedPort.current}...`);
      const reconnected = await connectToPort(lastConnectedPort.current);
      if (!reconnected) {
        setError('Impossible de se reconnecter au port');
        return false;
      }
    } else if (!connectedPort) {
      setError('Non connecté à un port série');
      addLog('[ERREUR] Envoi impossible: aucun port connecté');
      return false;
    }

    try {
      // Vérifier si les données sont identiques aux précédentes
      const dataStr = JSON.stringify(data);
      
      if (dataStr === lastDataSent.current) {
        return true; // Ne pas renvoyer les mêmes données
      }
      
      addLog(`[ENVOI] Données vers ${connectedPort}`);
      const success = await window.electronAPI.sendToPort(data);
      
      if (!success) {
        setError('Échec de l\'envoi des données');
        addLog('[ERREUR] Échec de l\'envoi (réponse négative)');
        lastDataSent.current = ''; // Forcer le renvoi au prochain essai
        
        // Marquer comme déconnecté pour forcer une reconnexion
        setIsConnected(false);
        return false;
      }
      
      lastDataSent.current = dataStr;
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError('Erreur lors de l\'envoi des données');
      addLog(`[ERREUR] Échec de l'envoi: ${errorMessage}`);
      console.error('Erreur lors de l\'envoi des données:', err);
      
      // Marquer comme déconnecté pour forcer une reconnexion
      setIsConnected(false);
      return false;
    }
  }, [connectedPort, isConnected, connectToPort, addLog]);

  // Gestion des données reçues du port série
  const handleSerialData = useCallback((data: string) => {
    // Ajouter un préfixe [RECEPTION] pour les données reçues
    const timestamp = new Date().toISOString().substring(11, 19);
    const logMessage = `[${timestamp}] [RECEPTION] ${data}`;
    
    setSerialLogs(prevLogs => {
      const newLogs = [...prevLogs, logMessage];
      // Limiter le nombre de logs conservés
      return newLogs.length > maxLogs.current 
        ? newLogs.slice(-maxLogs.current)
        : newLogs;
    });
  }, []);

  // Gestion des erreurs du port série
  const handleSerialError = useCallback((error: { type: string; message: string; port?: string }) => {
    const errorMessage = `[ERREUR] ${error.type}: ${error.message}${error.port ? ` (${error.port})` : ''}`;
    console.error(errorMessage);
    setError(error.message);
    addLog(errorMessage);
    
    // Si c'est une erreur de port, marquer comme déconnecté
    if (error.type === 'port_error' && connectedPort) {
      setIsConnected(false);
    }
  }, [connectedPort, addLog]);

  // Effet pour l'initialisation et le nettoyage
  useEffect(() => {
    // Charger la liste des ports disponibles
    listPorts();
    
    // Mettre à jour la liste des ports toutes les 10 secondes
    const portScanInterval = setInterval(listPorts, 10000);
    
    // S'abonner aux données série
    const removeDataListener = window.electronAPI.onSerialData(handleSerialData);
    
    // S'abonner aux erreurs série
    const removeErrorListener = window.electronAPI.onSerialError(handleSerialError);
    
    // Nettoyage à la désactivation du hook
    return () => {
      clearInterval(portScanInterval);
      removeDataListener();
      removeErrorListener();
      
      // Annuler toute tentative de reconnexion en cours
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };
  }, [listPorts, handleSerialData, handleSerialError]);

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
