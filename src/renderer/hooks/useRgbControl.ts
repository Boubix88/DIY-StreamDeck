import { useState, useEffect, useCallback } from 'react';

export const MODE_STATIC = 1;
export const MODE_SCROLLING_STATIC = 2;
export const MODE_SCROLLING_RGB = 3;

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_COLOR = { r: 0, g: 0, b: 255 };
const DEFAULT_SPEED = 10;

const useRgbControl = () => {
  // État pour le mode RVB (statique, défilement statique, arc-en-ciel)
  const [mode, setMode] = useState<number>(MODE_STATIC);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la couleur RVB (utilisé en mode statique et défilement statique)
  const [color, setColor] = useState<RgbColor>(DEFAULT_COLOR);
  
  // État pour la vitesse de défilement (utilisé en mode défilement statique et arc-en-ciel)
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  
  // Charger les paramètres sauvegardés au démarrage
  const loadSettings = useCallback(async () => {
    if (typeof window.electronAPI?.getRgbSettings !== 'function') {
      setError('Electron API is not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const savedSettings = await window.electronAPI.getRgbSettings();
      
      if (savedSettings) {
        setMode(savedSettings.mode || MODE_STATIC);
        setColor(savedSettings.color || DEFAULT_COLOR);
        setSpeed(savedSettings.speed || DEFAULT_SPEED);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load RGB settings:', err);
      setError('Failed to load RGB settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // Sauvegarder les paramètres lorsqu'ils changent
  const saveSettings = useCallback(async (newSettings: {
    mode: number;
    color: RgbColor;
    speed: number;
  }) => {
    if (typeof window.electronAPI?.saveRgbSettings !== 'function') {
      console.error('Electron API saveRgbSettings is not available');
      return;
    }

    try {
      await window.electronAPI.saveRgbSettings(newSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to save RGB settings:', err);
      setError('Failed to save RGB settings');
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveSettings({ mode, color, speed });
    }
  }, [mode, color, speed, isLoading, saveSettings]);

  // Fonction pour mettre à jour la couleur RVB
  const updateColor = (newColor: RgbColor) => {
    setColor(newColor);
  };

  // Fonction pour mettre à jour le mode
  const updateMode = (newMode: number) => {
    setMode(newMode);
  };

  // Fonction pour mettre à jour la vitesse
  const updateSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // Fonction pour définir une couleur à partir d'une valeur hexadécimale
  const setHexColor = (hex: string) => {
    // Supprimer le # s'il est présent
    const hexValue = hex.replace('#', '');
    
    // Convertir en valeurs RVB
    const r = parseInt(hexValue.substring(0, 2), 16);
    const g = parseInt(hexValue.substring(2, 4), 16);
    const b = parseInt(hexValue.substring(4, 6), 16);
    
    setColor({ r, g, b });
  };
  
  // Obtenir la couleur au format hexadécimal
  const getHexColor = (): string => {
    const toHex = (value: number) => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  };
  
  return {
    mode,
    color,
    speed,
    isLoading,
    error,
    updateMode,
    updateColor,
    updateSpeed,
    setHexColor,
    getHexColor,
    MODE_STATIC,
    MODE_SCROLLING_STATIC,
    MODE_SCROLLING_RGB,
  };
};

export default useRgbControl;
