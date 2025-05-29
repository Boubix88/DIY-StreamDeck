import { useState, useEffect, useCallback } from 'react';

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

const useSpotify = () => {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>({
    title: 'Not Playing',
    artist: '—',
    album: '—',
    albumArt: '',
    duration: 0,
    progress: 0,
    isPlaying: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les informations sur la piste en cours de lecture
  const fetchCurrentTrack = useCallback(async () => {
    try {
      // Dans une vraie application, vous utiliseriez l'API Spotify ici
      // Pour l'instant, nous simulons des données
      if (typeof window.electronAPI?.getSpotifyTrackInfo !== 'function') {
        setError('Electron API is not available');
        setIsLoading(false);
        return;
      }
      const trackInfo = await window.electronAPI.getSpotifyTrackInfo();
      
      if (trackInfo) {
        setCurrentTrack({
          title: trackInfo.title || 'Unknown Track',
          artist: trackInfo.artist || 'Unknown Artist',
          album: trackInfo.album || 'Unknown Album',
          albumArt: trackInfo.albumArt || '',
          duration: trackInfo.duration || 0,
          progress: trackInfo.progress || 0,
          isPlaying: trackInfo.isPlaying || false,
        });
        setIsPlaying(trackInfo.isPlaying || false);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch current track');
      console.error('Error fetching current track:', err);
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour la progression de la piste
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTrack(prev => {
        if (!prev.isPlaying || prev.progress >= prev.duration) return prev;
        
        return {
          ...prev,
          progress: prev.progress + 1000, // Incrémenter d'une seconde
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Charger les informations initiales
  useEffect(() => {
    fetchCurrentTrack();
    
    // Configurer un intervalle pour vérifier les mises à jour
    const interval = setInterval(fetchCurrentTrack, 5000);
    
    return () => clearInterval(interval);
  }, [fetchCurrentTrack]);

  // Lecture/Pause
  const togglePlayPause = useCallback(async () => {
    try {
      const newState = !isPlaying;
      if (typeof window.electronAPI?.spotifyPlayPause !== 'function') {
        setError('Electron API is not available');
        return;
      }
      const success = await window.electronAPI.spotifyPlayPause(newState);
      
      if (success) {
        setIsPlaying(newState);
        setCurrentTrack(prev => ({
          ...prev,
          isPlaying: newState,
        }));
      }
    } catch (err) {
      setError('Failed to toggle play/pause');
      console.error('Error toggling play/pause:', err);
    }
  }, [isPlaying]);

  // Piste suivante
  const nextTrack = useCallback(async () => {
    try {
      if (typeof window.electronAPI?.spotifyNext !== 'function') {
        setError('Electron API is not available');
        return;
      }
      const success = await window.electronAPI.spotifyNext();
      if (success) {
        // Recharger les informations de la piste après un court délai
        setTimeout(fetchCurrentTrack, 500);
      }
    } catch (err) {
      setError('Failed to skip to next track');
      console.error('Error skipping to next track:', err);
    }
  }, [fetchCurrentTrack]);

  // Piste précédente
  const previousTrack = useCallback(async () => {
    try {
      if (typeof window.electronAPI?.spotifyPrevious !== 'function') {
        setError('Electron API is not available');
        return;
      }
      const success = await window.electronAPI.spotifyPrevious();
      if (success) {
        // Recharger les informations de la piste après un court délai
        setTimeout(fetchCurrentTrack, 500);
      }
    } catch (err) {
      setError('Failed to go to previous track');
      console.error('Error going to previous track:', err);
    }
  }, [fetchCurrentTrack]);

  return {
    currentTrack,
    isPlaying,
    isLoading,
    error,
    togglePlayPause,
    nextTrack,
    previousTrack,
  };
};

export default useSpotify;
