import React from 'react';
import { Music } from 'react-feather';

interface SpotifyCardProps {
  track: {
    title?: string;
    artist?: string;
    album?: string;
    albumArt?: string;
    isPlaying?: boolean;
  };
  onPlayPause?: () => void;
}

const SpotifyCard: React.FC<SpotifyCardProps> = ({ track, onPlayPause }) => {
  // Mock progress data (to be replaced by real values)
  const progress = 42; // seconds elapsed
  const duration = 180; // total seconds
  const progressPercent = duration > 0 ? Math.min(1, progress / duration) : 0;
  const progressText = `${Math.floor(progress/60)}:${(progress%60).toString().padStart(2,'0')} / ${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')}`;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg flex flex-row items-center border-2 border-green-500 w-full h-full">
      {/* Album Art à gauche */}
      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mr-4">
        {track.albumArt ? (
          <img src={track.albumArt} alt="Album Art" className="w-full h-full object-cover" />
        ) : (
          <Music size={36} className="text-gray-500" />
        )}
      </div>
      {/* Infos à droite */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Music size={20} className="text-green-400" />
          <span className="text-base font-bold tracking-widest text-green-300">Spotify</span>
        </div>
        <div className="text-base font-bold text-white truncate mb-0.5">{track.title || 'Not Playing'}</div>
        <div className="text-xs text-gray-400 truncate mb-0.5">{track.artist || '—'}</div>
        <div className="text-xs text-gray-500 truncate mb-1">{track.album || '—'}</div>
        {/* Barre de progression */}
        <div className="w-full h-2 bg-gray-700 rounded mt-1 mb-1 overflow-hidden">
          <div
            className="h-2 bg-green-400 transition-all duration-300"
            style={{ width: `${progressPercent * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>{progressText}</span>
          <span>{track.isPlaying ? 'En lecture' : 'En pause'}</span>
        </div>
        <button
          className={`mt-1 px-3 py-1 rounded-lg text-xs font-bold ${track.isPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition w-fit self-end`}
          onClick={onPlayPause}
        >
          {track.isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};

export default SpotifyCard;
