import { useState, useEffect } from 'react';

const useVolumeControl = () => {
  const [volume, setVolumeState] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le volume initial
  useEffect(() => {
    const loadVolume = async () => {
      try {
        setIsLoading(true);
        const currentVolume = await window.electronAPI.getSystemVolume();
        setVolumeState(currentVolume);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load volume settings');
        console.error('Error loading volume:', err);
        setIsLoading(false);
      }
    };

    loadVolume();
  }, []);

  // Mettre à jour le volume
  const setVolume = async (newVolume: number) => {
    try {
      // S'assurer que le volume est dans la plage 0-100
      const adjustedVolume = Math.min(100, Math.max(0, newVolume));
      
      // Mettre à jour l'état local immédiatement pour une meilleure réactivité
      setVolumeState(adjustedVolume);
      
      // Mettre à jour le volume système via l'API Electron
      await window.electronAPI.setSystemVolume(adjustedVolume);
      
      // Si le volume est défini à 0, on le considère comme muet
      if (adjustedVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to update volume');
      console.error('Error setting volume:', err);
    }
  };

  // Activer/désactiver le son
  const toggleMute = async () => {
    try {
      if (isMuted) {
        // Réactiver le son au volume précédent (ou 50% si 0)
        const newVolume = volume > 0 ? volume : 50;
        await setVolume(newVolume);
      } else {
        // Couper le son
        await setVolume(0);
      }
      
      setIsMuted(!isMuted);
      setError(null);
    } catch (err) {
      setError('Failed to toggle mute');
      console.error('Error toggling mute:', err);
    }
  };

  // Augmenter le volume
  const increaseVolume = async (step: number = 5) => {
    await setVolume(volume + step);
  };

  // Diminuer le volume
  const decreaseVolume = async (step: number = 5) => {
    await setVolume(volume - step);
  };

  return {
    volume,
    isMuted,
    isLoading,
    error,
    setVolume,
    toggleMute,
    increaseVolume,
    decreaseVolume,
  };
};

export default useVolumeControl;
