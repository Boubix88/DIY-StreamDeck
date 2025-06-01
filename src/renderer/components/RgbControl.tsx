import React from 'react';

interface RgbControlProps {
  mode: number;
  color: { r: number; g: number; b: number };
  speed: number;
  onModeChange: (mode: number) => void;
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  onSpeedChange: (speed: number) => void;
}

const MODE_STATIC = 0;
const MODE_SCROLLING_STATIC = 1;
const MODE_SCROLLING_RGB = 2;

const RgbControl: React.FC<RgbControlProps> = ({ mode, color, speed, onModeChange, onColorChange, onSpeedChange }) => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg border-2 border-cyan-400 flex flex-col items-center w-full h-full">
    <div className="text-cyan-300 font-bold mb-2 text-lg tracking-widest">LED RGB</div>
    <div className="w-full mb-2">
      <select
        className="w-full bg-gray-700 text-white p-1 rounded"
        value={mode}
        onChange={e => onModeChange(Number(e.target.value))}
      >
        <option value={MODE_STATIC}>Statique</option>
        <option value={MODE_SCROLLING_STATIC}>Défilement</option>
        <option value={MODE_SCROLLING_RGB}>Arc-en-ciel</option>
      </select>
    </div>
    {mode !== MODE_SCROLLING_RGB && (
      <div className="w-full mb-2">
        <input
          type="color"
          className="w-full h-8 rounded"
          value={`#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`}
          onChange={e => {
            const hex = e.target.value;
            onColorChange({
              r: parseInt(hex.slice(1, 3), 16),
              g: parseInt(hex.slice(3, 5), 16),
              b: parseInt(hex.slice(5, 7), 16)
            });
          }}
        />
      </div>
    )}
    {(mode === MODE_SCROLLING_STATIC || mode === MODE_SCROLLING_RGB) && (
      <div className="w-full">
        <label className="block text-xs text-gray-400 mb-1">Vitesse: {speed}</label>
        <input
          type="range"
          min="1"
          max="50"
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    )}
  </div>
);

export default RgbControl;
